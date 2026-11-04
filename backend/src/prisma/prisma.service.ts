import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

let PrismaClientClass: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const prismaPkg = require('@prisma/client');
  PrismaClientClass = prismaPkg.PrismaClient;
} catch (e: any) {
  PrismaClientClass = null;
}

@Injectable()
export class PrismaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);
  public isMySqlAvailable = false;
  public client: any = null;

  // Type-safe accessor placeholders for common models
  public user: any = null;
  public seat: any = null;
  public pointTransaction: any = null;
  public audioTrack: any = null;
  public roomParticipant: any = null;
  public sanctuaryRoom: any = null;

  constructor() {
    if (PrismaClientClass) {
      try {
        this.client = new PrismaClientClass();
        this.user = this.client.user;
        this.seat = this.client.seat;
        this.pointTransaction = this.client.pointTransaction;
        this.audioTrack = this.client.audioTrack;
        this.roomParticipant = this.client.roomParticipant;
        this.sanctuaryRoom = this.client.sanctuaryRoom;
      } catch (err: any) {
        this.logger.warn(`Prisma client could not be instantiated (${err.message}). Safe JSON mirror will be used.`);
        this.client = null;
      }
    } else {
      this.logger.warn('Prisma package not initialized yet. Safe JSON mirror will be used.');
    }

    // Proxy fallback for any dynamic Prisma queries
    return new Proxy(this, {
      get(target: any, prop: string | symbol) {
        if (prop in target) {
          return target[prop];
        }
        if (target.client && prop in target.client) {
          const val = target.client[prop];
          return typeof val === 'function' ? val.bind(target.client) : val;
        }
        return undefined;
      },
    });
  }

  async onModuleInit() {
    if (!this.client || typeof this.client.$connect !== 'function') {
      this.isMySqlAvailable = false;
      this.logger.log('Prisma Client not initialized. Running safely with Local JSON Database Mirror (sanctuary-db.json).');
      return;
    }

    try {
      await Promise.race([
        this.client.$connect(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('MySQL connection timeout')), 2500)
        ),
      ]);
      this.isMySqlAvailable = true;
      this.logger.log('Connected to MySQL database via Prisma.');
    } catch (err: any) {
      this.isMySqlAvailable = false;
      this.logger.warn(
        `MySQL server is not reachable (${err.message}). Using Local Persistent Transactional JSON Mirror (backend/data/sanctuary-db.json).`
      );
    }
  }

  async onModuleDestroy() {
    if (this.isMySqlAvailable && this.client && typeof this.client.$disconnect === 'function') {
      try {
        await this.client.$disconnect();
      } catch (_) {}
    }
  }
}
