"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PrismaService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
let PrismaClientClass = null;
try {
    const prismaPkg = require('@prisma/client');
    PrismaClientClass = prismaPkg.PrismaClient;
}
catch (e) {
    PrismaClientClass = null;
}
let PrismaService = PrismaService_1 = class PrismaService {
    constructor() {
        this.logger = new common_1.Logger(PrismaService_1.name);
        this.isMySqlAvailable = false;
        this.client = null;
        this.user = null;
        this.seat = null;
        this.pointTransaction = null;
        this.audioTrack = null;
        this.roomParticipant = null;
        this.sanctuaryRoom = null;
        if (PrismaClientClass) {
            try {
                this.client = new PrismaClientClass();
                this.user = this.client.user;
                this.seat = this.client.seat;
                this.pointTransaction = this.client.pointTransaction;
                this.audioTrack = this.client.audioTrack;
                this.roomParticipant = this.client.roomParticipant;
                this.sanctuaryRoom = this.client.sanctuaryRoom;
            }
            catch (err) {
                this.logger.warn(`Prisma client could not be instantiated (${err.message}). Safe JSON mirror will be used.`);
                this.client = null;
            }
        }
        else {
            this.logger.warn('Prisma package not initialized yet. Safe JSON mirror will be used.');
        }
        return new Proxy(this, {
            get(target, prop) {
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
                new Promise((_, reject) => setTimeout(() => reject(new Error('MySQL connection timeout')), 2500)),
            ]);
            this.isMySqlAvailable = true;
            this.logger.log('Connected to MySQL database via Prisma.');
        }
        catch (err) {
            this.isMySqlAvailable = false;
            this.logger.warn(`MySQL server is not reachable (${err.message}). Using Local Persistent Transactional JSON Mirror (backend/data/sanctuary-db.json).`);
        }
    }
    async onModuleDestroy() {
        if (this.isMySqlAvailable && this.client && typeof this.client.$disconnect === 'function') {
            try {
                await this.client.$disconnect();
            }
            catch (_) { }
        }
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = PrismaService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map