import { v4 as uuidv4 } from 'uuid';
import { CreateRentalPort } from '../ports/in/car-rental-in.ports';
import {
  CarRepositoryPort,
  RentalRepositoryPort,
  UserRepositoryPort,
} from '../ports/out/car-rental-out.ports';
import { Rental } from '../../domain/entities/rental.entity';
import { CarStatus } from '../../domain/enums/car-status.enum';
import { GenerateReservationCodeService } from '../services/generate-reservation-code.service';

const MS_PER_DAY = 86_400_000;

export class CreateRentalUseCase implements CreateRentalPort {
  constructor(
    private readonly cars: CarRepositoryPort,
    private readonly rentals: RentalRepositoryPort,
    private readonly users: UserRepositoryPort,
    private readonly codeGen: GenerateReservationCodeService,
  ) {}

  async execute(input: {
    userId: string;
    carId: string;
    startDate: Date;
    endDate: Date;
  }): Promise<{ rentalId: string; reservationCode: string }> {
    const user = await this.users.findById(input.userId);
    if (!user || !user.canRent()) throw new Error('User not allowed to rent');

    const car = await this.cars.findById(input.carId);
    if (!car || !car.isRentable()) throw new Error('Car not available');

    const carActive = await this.rentals.findActiveByCarId(input.carId);
    if (carActive) throw new Error('Car already rented');

    const userActive = await this.rentals.findActiveByUserId(input.userId);
    if (userActive) throw new Error('User already has an active rental');

    const days = Math.max(
      1,
      Math.ceil((+input.endDate - +input.startDate) / MS_PER_DAY),
    );
    const totalPrice = days * car.dailyPrice;

    const reservationCode = this.codeGen.generate({ withChecksum: true });

    const rental = new Rental(
      uuidv4(),
      input.carId,
      input.userId,
      input.startDate,
      input.endDate,
      totalPrice,
      undefined,
      reservationCode,
    );

    const saved = await this.rentals.save(rental);
    await this.cars.updateStatus(car.id, CarStatus.RENTED);

    return { rentalId: saved.id, reservationCode };
  }
}
