import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
export declare class PrismaService implements OnModuleInit, OnModuleDestroy {
    private readonly logger;
    isMySqlAvailable: boolean;
    client: any;
    user: any;
    seat: any;
    pointTransaction: any;
    audioTrack: any;
    roomParticipant: any;
    sanctuaryRoom: any;
    constructor();
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
}
