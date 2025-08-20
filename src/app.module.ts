import { Module, MiddlewareConsumer } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import type { CacheStoreFactory } from '@nestjs/cache-manager';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventEmitterModule } from '@nestjs/event-emitter';

import { validationSchema } from './config/validation';
import { LoggingMiddleware } from './common/middleware/logging.middleware';

import { AuthModule } from './auth/auth.module';
import { RentalModule } from './rental.module';


@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema }),

    EventEmitterModule.forRoot(),

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
        host: cs.get<string>('DB_HOST'),
        port: cs.get<number>('DB_PORT'),
        username: cs.get<string>('DB_USER'),
        password: cs.get<string>('DB_PASS'),
        database: cs.get<string>('DB_NAME'),
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
