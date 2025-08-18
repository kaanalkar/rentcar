import { Entity, PrimaryGeneratedColumn, Column, Index, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import type { CarRepositoryPort } from '../../../application/ports/out/car-rental-out.ports';
import { Car } from '../../../domain/entities/car.entity';
import { CarStatus } from '../../../domain/enums/car-status.enum';

@Entity('cars')
@Index('IDX_CAR_STATUS', ['status'])
@Index('IDX_CAR_PRICE', ['dailyPrice'])
export class TypeOrmCar {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() brand: string;
  @Column() model: string;
  @Column('decimal', { precision: 10, scale: 2 }) dailyPrice: number;
  @Column({ type: 'enum', enum: CarStatus, default: CarStatus.AVAILABLE }) status: CarStatus;
  @Column({ nullable: true }) imageUrl?: string;
}

const toDomain = (p: TypeOrmCar) => new Car(p.id, p.brand, p.model, Number(p.dailyPrice), p.status, p.imageUrl);

export class CarTypeOrmRepository implements CarRepositoryPort {
  constructor(@InjectRepository(TypeOrmCar) private readonly repo: Repository<TypeOrmCar>) {}

  async findById(id: string) {
    const r = await this.repo.findOne({ where: { id } });
    return r ? toDomain(r) : null;
  }

  async listAvailable(range?: { minPrice?: number; maxPrice?: number }) {
    const qb = this.repo.createQueryBuilder('c').where('c.status = :s', { s: CarStatus.AVAILABLE });
    if (range?.minPrice != null) qb.andWhere('c.dailyPrice >= :min', { min: range.minPrice });
    if (range?.maxPrice != null) qb.andWhere('c.dailyPrice <= :max', { max: range.maxPrice });
    return (await qb.getMany()).map(toDomain);
  }

  async updateStatus(id: string, status: CarStatus) {
    await this.repo.update({ id }, { status });
  }

  async save(car: Car) {
    const saved = await this.repo.save(
      this.repo.create({
        id: car.id,
        brand: car.brand,
        model: car.model,
        dailyPrice: car.dailyPrice,
        status: car.status,
        imageUrl: car.imageUrl,
      }),
    );
    return toDomain(saved);
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id });
  }
}
