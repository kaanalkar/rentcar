export const RENTAL_CREATED = 'rental.created';

export interface RentalCreatedEvent {
  rentalId: string;
  reservationCode: string;
  carId: string;
  userId: string;
  startDate: Date;
  endDate: Date;
  totalPrice: number;
}
