import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';

import { TypeOrmCar } from './infrastructure/adapters/repositories/car.repository';
import { TypeOrmRental } from './infrastructure/adapters/repositories/rental.repository';
import { TypeOrmUser } from './infrastructure/adapters/repositories/user.repository';

import {
  CarRepositoryPort,
  RentalRepositoryPort,
  UserRepositoryPort,
  FileStoragePort,
} from './application/ports/out/car-rental-out.ports';
import {
  CreateRentalPort,
  ListAvailableCarsPort,
  ReturnRentalPort,
  CancelRentalPort,
} from './application/ports/in/car-rental-in.ports';

import { CreateRentalUseCase } from './application/use-cases/create-rental.use-case';
import { ListAvailableCarsUseCase } from './application/use-cases/list-available-cars.use-case';
import { ReturnRentalUseCase } from './application/use-cases/return-rental.use-case';
import { CancelRentalUseCase } from './application/use-cases/cancel-rental.use-case';
import { CreateCarUseCase } from './application/use-cases/create-car.use-case';
import { DeleteCarUseCase } from './application/use-cases/delete-car.use-case';

import { CarTypeOrmRepository } from './infrastructure/adapters/repositories/car.repository';
import { RentalTypeOrmRepository } from './infrastructure/adapters/repositories/rental.repository';
import { UserTypeOrmRepository } from './infrastructure/adapters/repositories/user.repository';
import { S3FileStorageAdapter } from './infrastructure/adapters/s3-file-storage.adapter';
import { GenerateReservationCodeService } from './application/services/generate-reservation-code.service';

import {
  RentalController,
  AuthController,
  UsersController,
  CarsController,
} from './infrastructure/controllers/rental.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([TypeOrmCar, TypeOrmRental, TypeOrmUser]),
    AuthModule,
  ],
  controllers: [RentalController, AuthController, UsersController, CarsController],
  providers: [
    { provide: 'CarRepositoryPort', useClass: CarTypeOrmRepository },
    { provide: 'RentalRepositoryPort', useClass: RentalTypeOrmRepository },
    { provide: 'UserRepositoryPort', useClass: UserTypeOrmRepository },
    { provide: 'FileStoragePort', useClass: S3FileStorageAdapter },

    GenerateReservationCodeService,

    {
      provide: 'CreateRentalPort',
      useFactory: (
        cars: CarRepositoryPort,
        rentals: RentalRepositoryPort,
        users: UserRepositoryPort,
        codeGen: GenerateReservationCodeService,
      ) => new CreateRentalUseCase(cars, rentals, users, codeGen),
      inject: ['CarRepositoryPort', 'RentalRepositoryPort', 'UserRepositoryPort', GenerateReservationCodeService],
    },
    {
      provide: 'ListAvailableCarsPort',
      useFactory: (cars: CarRepositoryPort) => new ListAvailableCarsUseCase(cars),
      inject: ['CarRepositoryPort'],
    },
    {
      provide: 'ReturnRentalPort',
      useFactory: (
        rentals: RentalRepositoryPort,
        cars: CarRepositoryPort,
        users: UserRepositoryPort,
      ) => new ReturnRentalUseCase(rentals, cars, users),
      inject: ['RentalRepositoryPort', 'CarRepositoryPort', 'UserRepositoryPort'],
    },
    {
      provide: 'CancelRentalPort',
      useFactory: (rentals: RentalRepositoryPort, users: UserRepositoryPort) =>
        new CancelRentalUseCase(rentals, users),
      inject: ['RentalRepositoryPort', 'UserRepositoryPort'],
    },
    {
      provide: 'CreateCarPort',
      useFactory: (cars: CarRepositoryPort) => new CreateCarUseCase(cars),
      inject: ['CarRepositoryPort'],
    },
    {
      provide: 'DeleteCarPort',
      useFactory: (cars: CarRepositoryPort) => new DeleteCarUseCase(cars),
      inject: ['CarRepositoryPort'],
    },
  ],
})
export class RentalModule {}
