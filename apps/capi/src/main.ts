import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');
  app.enableShutdownHooks();

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );

  // Production is served same-origin behind the reverse proxy: CORS only when explicitly configured.
  const corsOrigins = configService.get<string[]>('CORS_ORIGINS') ?? [];
  if (corsOrigins.length > 0) {
    app.enableCors({ origin: corsOrigins });
  }

  const port = configService.get('PORT');
  await app.listen(port);
}

bootstrap();
