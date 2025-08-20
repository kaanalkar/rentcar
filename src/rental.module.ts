import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { AuthModule } from './auth/auth.module';

import {
  RentalController,
  AuthController,
  UsersController,
  CarsController,
} from './infrastructure/controllers/rental.controller';

import { TypeOrmCar, CarTypeOrmRepository } from './infrastructure/adapters/repositories/car.repository';
import { TypeOrmRental, RentalTypeOrmRepository } from './infrastructure/adapters/repositories/rental.repository';
import { TypeOrmUser, UserTypeOrmRepository } from './infrastructure/adapters/repositories/user.repository';

import type {
  CarRepositoryPort,
  RentalRepositoryPort,
  UserRepositoryPort,
  FileStoragePort,
} from './application/ports/out/car-rental-out.ports';

import type {
  CreateRentalPort,
  ListAvailableCarsPort,
  ReturnRentalPort,
  CancelRentalPort,
  CreateCarPort,
  DeleteCarPort,
} from './application/ports/in/car-rental-in.ports';

import { CreateRentalUseCase } from './application/use-cases/create-rental.use-case';
import { ListAvailableCarsUseCase } from './application/use-cases/list-available-cars.use-case';
import { ReturnRentalUseCase } from './application/use-cases/return-rental.use-case';
import { CancelRentalUseCase } from './application/use-cases/cancel-rental.use-case';
import { CreateCarUseCase } from './application/use-cases/create-car.use-case';
import { DeleteCarUseCase } from './application/use-cases/delete-car.use-case';

import { GenerateReservationCodeService } from './application/services/generate-reservation-code.service';
import { S3FileStorageAdapter } from './infrastructure/adapters/s3-file-storage.adapter';
import { MailService } from './application/services/mail.service';
import { RentalEventsListener } from './infrastructure/listeners/rental.listener';
import { ExportService } from 'application/services/export.service';

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

    ExportService,
    GenerateReservationCodeService,
    MailService,
    RentalEventsListener,

    {
      provide: 'CreateRentalPort',
      useFactory: (
        cars: CarRepositoryPort,
        rentals: RentalRepositoryPort,
        users: UserRepositoryPort,
        codeGen: GenerateReservationCodeService,
        events: EventEmitter2,
      ) => new CreateRentalUseCase(cars, rentals, users, codeGen, events),
      inject: ['CarRepositoryPort', 'RentalRepositoryPort', 'UserRepositoryPort', GenerateReservationCodeService, EventEmitter2],
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
