import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  Repository,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import type { RentalRepositoryPort } from '../../../application/ports/out/car-rental-out.ports';
import { Rental } from '../../../domain/entities/rental.entity';
import { RentalStatus } from '../../../domain/enums/rental-status.enum';

@Entity('rentals')
@Index('IDX_RENTAL_CAR_STATUS', ['carId', 'status'])
@Index('IDX_RENTAL_USER_STATUS', ['userId', 'status'])
export class TypeOrmRental {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column() carId: string;
  @Column() userId: string;

  @Column('datetime') startDate: Date;
  @Column('datetime') endDate: Date;

  @Column('decimal', { precision: 10, scale: 2 }) totalPrice: number;

  @Column({ type: 'enum', enum: RentalStatus, default: RentalStatus.ACTIVE })
  status: RentalStatus;

  @Column({ nullable: true }) reservationCode?: string;
}

const toDomain = (p: TypeOrmRental): Rental =>
  new Rental(
    p.id,
    p.carId,
    p.userId,
    p.startDate,
    p.endDate,
    Number(p.totalPrice),
    p.status,
    p.reservationCode,
  );

export class RentalTypeOrmRepository implements RentalRepositoryPort {
  constructor(
    @InjectRepository(TypeOrmRental)
    private readonly repo: Repository<TypeOrmRental>,
  ) {}

  async findById(id: string): Promise<Rental | null> {
    const r = await this.repo.findOne({ where: { id } });
    return r ? toDomain(r) : null;
  }

  async save(rental: Rental): Promise<Rental> {
    const saved = await this.repo.save(this.repo.create({ ...rental }));
    return toDomain(saved);
  }

  async updateStatus(id: string, status: RentalStatus): Promise<void> {
    await this.repo.update({ id }, { status });
  }

  async findActiveByCarId(carId: string): Promise<Rental | null> {
    const r = await this.repo.findOne({
      where: { carId, status: RentalStatus.ACTIVE },
    });
    return r ? toDomain(r) : null;
  }

  async findActiveByUserId(userId: string): Promise<Rental | null> {
    const r = await this.repo.findOne({
      where: { userId, status: RentalStatus.ACTIVE },
    });
    return r ? toDomain(r) : null;
  }
}
