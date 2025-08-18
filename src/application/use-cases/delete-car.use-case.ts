import { DeleteCarPort } from '../ports/in/car-rental-in.ports';
import { CarRepositoryPort } from '../ports/out/car-rental-out.ports';

export class DeleteCarUseCase implements DeleteCarPort {
  constructor(private readonly cars: CarRepositoryPort) {}

  async execute(id: string): Promise<void> {
    await this.cars.delete(id);
  }
}
