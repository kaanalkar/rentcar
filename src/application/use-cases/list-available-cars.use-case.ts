import { ListAvailableCarsPort } from '../ports/in/car-rental-in.ports';
import { CarRepositoryPort } from '../ports/out/car-rental-out.ports';
import { Car } from '../../domain/entities/car.entity';

export class ListAvailableCarsUseCase implements ListAvailableCarsPort {
  constructor(private readonly cars: CarRepositoryPort) {}
  execute(filter?: { minPrice?: number; maxPrice?: number }): Promise<Car[]> {
    return this.cars.listAvailable(filter);
  }
}
