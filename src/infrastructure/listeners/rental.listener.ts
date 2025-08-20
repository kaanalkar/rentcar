import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { RENTAL_CREATED, RentalCreatedEvent } from '../../application/events/rental.events';
import { MailService } from '../../application/services/mail.service';
import type { UserRepositoryPort, CarRepositoryPort } from '../../application/ports/out/car-rental-out.ports';

@Injectable()
export class RentalEventsListener {
  constructor(
    private readonly mail: MailService,
    @Inject('UserRepositoryPort') private readonly users: UserRepositoryPort,
    @Inject('CarRepositoryPort') private readonly cars: CarRepositoryPort,
  ) {}

  @OnEvent(RENTAL_CREATED, { async: true })
  async handleRentalCreated(evt: RentalCreatedEvent) {
    const user = await this.users.findById(evt.userId);
    if (!user?.email) return;

    const car = await this.cars.findById(evt.carId);

    const html = `
      <h2>Resevation Success</h2>
      <p>Hello ${user.fullName},</p>
      <p><b>${car?.brand ?? ''} ${car?.model ?? ''}</b> reservation is created.</p>
      <ul>
        <li>Reservation Code: <b>${evt.reservationCode}</b></li>
        <li>Start Date: ${new Date(evt.startDate).toISOString()}</li>
        <li>End Date: ${new Date(evt.endDate).toISOString()}</li>
        <li>Total Price: ${evt.totalPrice}</li>
      </ul>
      <p>Be Careful!</p>
    `;

    await this.mail.send(user.email, 'Car Rental - Reservation Success', html);
  }
}
