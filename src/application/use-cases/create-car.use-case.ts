import { CreateCarPort } from '../ports/in/car-rental-in.ports';
import { CarRepositoryPort } from '../ports/out/car-rental-out.ports';
import { Car } from '../../domain/entities/car.entity';

export class CreateCarUseCase implements CreateCarPort {
  constructor(private readonly cars: CarRepositoryPort) {}

  async execute(input: { brand: string; model: string; dailyPrice: number; imageUrl?: string }) {
    const entity = new Car(undefined as any, input.brand, input.model, input.dailyPrice, undefined, input.imageUrl);
    const saved = await this.cars.save(entity);
    return { id: saved.id };
  }
}
