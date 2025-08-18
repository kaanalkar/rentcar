import {
  Entity, PrimaryGeneratedColumn, Column, Index, Repository,
} from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import type { UserRepositoryPort } from '../../../application/ports/out/car-rental-out.ports';
import { User } from '../../../domain/entities/user.entity';
import { UserStatus } from '../../../domain/enums/user-status.enum';
import { UserRole } from '../../../domain/enums/user-role.enum';

@Entity('users')
@Index('UQ_USER_EMAIL', ['email'], { unique: true })
export class TypeOrmUser {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column() email: string;
  @Column() fullName: string;
  @Column() driverLicenseNo: string;

  @Column() passwordHash: string;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Column('simple-array', { nullable: true }) roles?: string[];
}

const toDomain = (p: TypeOrmUser) =>
  new User(
    p.id,
    p.email,
    p.fullName,
    p.driverLicenseNo,
    p.status,
    (p.roles && p.roles.length > 0 ? (p.roles as UserRole[]) : [UserRole.USER]),
    p.passwordHash,
  );

export class UserTypeOrmRepository implements UserRepositoryPort {
  constructor(@InjectRepository(TypeOrmUser) private readonly repo: Repository<TypeOrmUser>) {}

  async findById(id: string) {
    const r = await this.repo.findOne({ where: { id } });
    return r ? toDomain(r) : null;
  }

  async findByEmail(email: string) {
    const r = await this.repo.findOne({ where: { email } });
    return r ? toDomain(r) : null;
  }

  async save(user: User) {
    const roles = user.roles && user.roles.length > 0 ? user.roles : [UserRole.USER];
    const saved = await this.repo.save(this.repo.create({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      driverLicenseNo: user.driverLicenseNo,
      status: user.status,
      roles,
      passwordHash: user.passwordHash!,
    }));
    return toDomain(saved);
  }
}
