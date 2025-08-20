import { CancelRentalPort } from '../ports/in/car-rental-in.ports';
import { RentalRepositoryPort, UserRepositoryPort } from '../ports/out/car-rental-out.ports';
import { RentalStatus } from '../../domain/enums/rental-status.enum';

export class CancelRentalUseCase implements CancelRentalPort {
  constructor(
    private readonly rentals: RentalRepositoryPort,
    private readonly users: UserRepositoryPort,
  ) {}

  async execute({ rentalId, userId }: { rentalId: string; userId: string }): Promise<void> {
    const user = await this.users.findById(userId);
    if (!user) throw new Error('User not found');

    const rental = await this.rentals.findById(rentalId);
    if (!rental) throw new Error('Rental not found');

    const isOwnerOrAdmin = rental.userId === user.id || user.isAdmin();
    if (!isOwnerOrAdmin) throw new Error('Not authorized to cancel this rental');

    const now = new Date();
    const canCancel =
      rental.status === RentalStatus.RESERVED ||
      (rental.status === RentalStatus.ACTIVE && rental.startDate > now);

    if (!canCancel) {
      throw new Error('Cannot cancel: rental is not cancelable at this stage');
    }

    await this.rentals.updateStatus(rentalId, RentalStatus.CANCELED);
  }
}
