import { ReturnRentalPort } from '../ports/in/car-rental-in.ports';
import {
  RentalRepositoryPort,
  CarRepositoryPort,
  UserRepositoryPort,
} from '../ports/out/car-rental-out.ports';
import { RentalStatus } from '../../domain/enums/rental-status.enum';
import { CarStatus } from '../../domain/enums/car-status.enum';

export class ReturnRentalUseCase implements ReturnRentalPort {
  constructor(
    private readonly rentals: RentalRepositoryPort,
    private readonly cars: CarRepositoryPort,
    private readonly users: UserRepositoryPort,
  ) {}

  async execute({
    rentalId,
    userId,
  }: {
    rentalId: string;
    userId: string;
  }): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) throw new Error('User not found');

    const rental = await this.rentals.findById(rentalId);
    if (!rental || rental.status !== RentalStatus.ACTIVE)
      throw new Error('Invalid rental');

    if (rental.userId !== user.id && !user.isAdmin()) {
      throw new Error('Not authorized to return this rental');
    }

    await this.rentals.updateStatus(rentalId, RentalStatus.RETURNED);
    await this.cars.updateStatus(rental.carId, CarStatus.AVAILABLE);
  }
}
