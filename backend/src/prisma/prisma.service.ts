import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public isMySqlAvailable = false;

  async onModuleInit() {
    try {
      await Promise.race([
        this.$connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('MySQL connection timeout')), 2500)
        ),
      ]);
      this.isMySqlAvailable = true;
      this.logger.log('Connected to MySQL database via Prisma.');
    } catch (err) {
      this.isMySqlAvailable = false;
      this.logger.warn(
        `MySQL server is not reachable (${(err as Error).message}). Using Local Persistent Transactional JSON Mirror (backend/data/sanctuary-db.json) alongside Prisma.`
      );
    }
  }

  async onModuleDestroy() {
    if (this.isMySqlAvailable) {
      await this.$disconnect();
    }
  }
}
