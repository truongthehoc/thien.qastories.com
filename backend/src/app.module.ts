import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import * as fs from 'fs';
import { PrismaModule } from './prisma/prisma.module';
import { SanctuaryService } from './sanctuary.service';
import { SanctuaryController } from './sanctuary.controller';
import { SanctuaryGateway } from './gateway/sanctuary.gateway';

const frontendDistPath = fs.existsSync(join(process.cwd(), 'frontend', 'dist'))
  ? join(process.cwd(), 'frontend', 'dist')
  : fs.existsSync(join(process.cwd(), '..', 'frontend', 'dist'))
  ? join(process.cwd(), '..', 'frontend', 'dist')
  : join(process.cwd(), 'uploads');

@Module({
  imports: [
    PrismaModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    ServeStaticModule.forRoot({
      rootPath: frontendDistPath,
      exclude: ['/api/(.*)', '/socket.io/(.*)', '/uploads/(.*)'],
    }),
  ],
  controllers: [SanctuaryController],
  providers: [SanctuaryService, SanctuaryGateway],
})
export class AppModule {}
