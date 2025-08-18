import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { DataSource } from 'typeorm';
import { seedAdmin } from './infrastructure/seeds/admin.seed';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());
  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));

  const config = new DocumentBuilder()
    .setTitle(process.env.SWAGGER_TITLE || 'Car Rental API')
    .setDescription(process.env.SWAGGER_DESC || 'Hexagonal Architecture Demo')
    .setVersion(process.env.SWAGGER_VERSION || '1.0.0')
    .addBearerAuth()
    .build();

  const doc = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, doc, { useGlobalPrefix: true });

  try {
    const dataSource = app.get(DataSource);
    await seedAdmin(dataSource);
  } catch (e) {
    console.error('[seedAdmin] failed:', e);
  }

  await app.listen(process.env.PORT || 3000);
}
bootstrap();
