import { RentalStatus } from '../enums/rental-status.enum';

export class Rental {
  constructor(
    public id: string,
    public carId: string,
    public userId: string,
    public startDate: Date,
    public endDate: Date,
    public totalPrice: number,
    public status: RentalStatus = RentalStatus.ACTIVE,
    public reservationCode?: string,
  ) {}
}
