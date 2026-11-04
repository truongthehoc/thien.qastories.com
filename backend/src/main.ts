import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const logger = new Logger('ThienVienServer');
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    },
  });

  // Enable high payload limit (up to 500MB) for audio & character asset uploads
  app.use(json({ limit: '500mb' }));
  app.use(urlencoded({ limit: '500mb', extended: true }));

  const port = process.env.PORT || 3005;
  await app.listen(port, '0.0.0.0');
  logger.log(`THIỀN VIÊN Backend & Socket.IO Server running on http://0.0.0.0:${port}`);
}
bootstrap();
