import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { PrismaModule } from './prisma/prisma.module';
import { SanctuaryService } from './sanctuary.service';
import { SanctuaryController } from './sanctuary.controller';
import { SanctuaryGateway } from './gateway/sanctuary.gateway';

@Module({
  imports: [
    PrismaModule,
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
  ],
  controllers: [SanctuaryController],
  providers: [SanctuaryService, SanctuaryGateway],
})
export class AppModule {}
