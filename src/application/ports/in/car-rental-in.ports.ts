import { Car } from '../../../domain/entities/car.entity';

export interface CreateRentalPort {
  execute(input: {
    userId: string;
    carId: string;
    startDate: Date;
    endDate: Date;
  }): Promise<{ rentalId: string; reservationCode: string }>;
}

export interface ListAvailableCarsPort {
  execute(filter?: { minPrice?: number; maxPrice?: number }): Promise<Car[]>;
}

export interface ReturnRentalPort {
  execute(input: { rentalId: string; userId: string }): Promise<void>;
}

export interface CancelRentalPort {
  execute(input: { rentalId: string; userId: string }): Promise<void>;
}

export interface CreateCarPort {
  execute(input: { brand: string; model: string; dailyPrice: number; imageUrl?: string }): Promise<{ id: string }>;
}

export interface DeleteCarPort {
  execute(id: string): Promise<void>;
}