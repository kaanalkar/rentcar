import { CancelRentalPort } from '../ports/in/car-rental-in.ports';
import {
  RentalRepositoryPort,
  UserRepositoryPort,
} from '../ports/out/car-rental-out.ports';
import { RentalStatus } from '../../domain/enums/rental-status.enum';

export class CancelRentalUseCase implements CancelRentalPort {
  constructor(
    private readonly rentals: RentalRepositoryPort,
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
    if (!rental) throw new Error('Rental not found');

    if (rental.status !== RentalStatus.RESERVED) {
      throw new Error('Only RESERVED rentals can be canceled');
    }

    if (rental.userId !== user.id && !user.isAdmin()) {
      throw new Error('Not authorized to cancel this rental');
    }

    await this.rentals.updateStatus(rentalId, RentalStatus.CANCELED);
  }
}
