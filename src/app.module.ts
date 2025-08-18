import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { validationSchema } from './config/validation';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { AuthModule } from './auth/auth.module';
import { RentalModule } from './rental.module';

import { TypeOrmCar } from './infrastructure/adapters/repositories/car.repository';
import { TypeOrmRental } from './infrastructure/adapters/repositories/rental.repository';
import { TypeOrmUser } from './infrastructure/adapters/repositories/user.repository';
import type { CacheStoreFactory } from '@nestjs/cache-manager';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema }),

    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (cs: ConfigService) => {
        const { redisStore } = await import('cache-manager-redis-store');
        return {
          store: redisStore as unknown as CacheStoreFactory,
          url: cs.get<string>('REDIS_URL')!,
          ttl: 10,
        };
      },
    }),

    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cs: ConfigService) => ({
        type: 'mysql',
        host: cs.get('DB_HOST'),
        port: cs.get<number>('DB_PORT'),
        username: cs.get('DB_USER'),
        password: cs.get('DB_PASS'),
        database: cs.get('DB_NAME'),
        autoLoadEntities: true,
        synchronize: true,
      }),
    }),

    AuthModule,
    RentalModule,
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
