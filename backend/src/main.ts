import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('ThienVienServer');
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    },
  });

  const port = process.env.PORT || 3005;
  await app.listen(port, '0.0.0.0');
  logger.log(`THIỀN VIÊN Backend & Socket.IO Server running on http://0.0.0.0:${port}`);
}
bootstrap();
