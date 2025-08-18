import { CarStatus } from '../enums/car-status.enum';

export class Car {
  constructor(
    public id: string,
    public brand: string,
    public model: string,
    public dailyPrice: number,
    public status: CarStatus = CarStatus.AVAILABLE,
    public imageUrl?: string,
  ) {}

  isRentable(): boolean {
    return this.status === CarStatus.AVAILABLE;
  }
}
