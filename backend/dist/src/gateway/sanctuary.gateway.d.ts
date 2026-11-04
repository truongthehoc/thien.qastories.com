import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SanctuaryService } from '../sanctuary.service';
import { OnModuleInit } from '@nestjs/common';
export declare class SanctuaryGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
    private readonly sanctuaryService;
    server: Server;
    constructor(sanctuaryService: SanctuaryService);
    onModuleInit(): void;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): Promise<void>;
    handleHeartbeat(client: Socket, payload: {
        userId?: string;
    }): {
        ok: boolean;
        stats: {
            totalOnline: number;
            meditatingCount: number;
            bowingCount: number;
            emptySeatsCount: number;
            occupiedSeatsCount: number;
            totalVisitsToday: number;
            totalMeditationMinutes: number;
            totalBows: number;
            totalPointsAwarded: number;
        };
        syncedAudio: {
            currentTrack: import("../sanctuary.service").AudioTrackRecord;
            ambientTrack: import("../sanctuary.service").AudioTrackRecord;
            activeSchedule: import("../sanctuary.service").AudioScheduleRecord;
            isScheduled: boolean;
            scheduleName: string;
            offsetSeconds: number;
            isPlaying: boolean;
            serverTimestamp: number;
        };
    };
    handleBowPose(payload: {
        userId: string;
        seatId: number;
        pose: 'STANDING' | 'KNEELING' | 'BOWING';
    }): void;
    broadcastSeatUpdate(seat: unknown): void;
    broadcastStats(): void;
    broadcastAudioSync(): void;
    broadcastAnnouncements(): void;
    broadcastFullSync(): void;
}
