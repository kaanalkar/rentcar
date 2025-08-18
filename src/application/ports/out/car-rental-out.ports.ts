import { Car } from '../../../domain/entities/car.entity';
import { CarStatus } from '../../../domain/enums/car-status.enum';
import { Rental } from '../../../domain/entities/rental.entity';
import { RentalStatus } from '../../../domain/enums/rental-status.enum';
import { User } from '../../../domain/entities/user.entity';

export interface CarRepositoryPort {
  findById(id: string): Promise<Car | null>;
  listAvailable(range?: { minPrice?: number; maxPrice?: number }): Promise<Car[]>;
  updateStatus(id: string, status: CarStatus): Promise<void>;
  save(car: Car): Promise<Car>;
  delete(id: string): Promise<void>;  
}

export interface RentalRepositoryPort {
  findById(id: string): Promise<Rental | null>;
  save(rental: Rental): Promise<Rental>;
  updateStatus(id: string, status: RentalStatus): Promise<void>;
  findActiveByCarId(carId: string): Promise<Rental | null>;
  findActiveByUserId(userId: string): Promise<Rental | null>;
}

export interface UserRepositoryPort {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<User>;
}

export interface FileStoragePort {
  upload(params: { key: string; buffer: Buffer; contentType: string }): Promise<string>;
  getPresignedPutUrl(key: string, expiresInSec?: number): Promise<string>;
}
