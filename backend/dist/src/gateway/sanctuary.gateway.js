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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SanctuaryGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const sanctuary_service_1 = require("../sanctuary.service");
let SanctuaryGateway = class SanctuaryGateway {
    constructor(sanctuaryService) {
        this.sanctuaryService = sanctuaryService;
    }
    onModuleInit() {
        setInterval(() => {
            const released = this.sanctuaryService.cleanupExpiredHeartbeats();
            if (released.length > 0 && this.server) {
                this.broadcastFullSync();
            }
        }, 15000);
        setInterval(() => {
            if (this.server) {
                this.server.emit('sanctuary:audio_sync', this.sanctuaryService.getSyncedAudioState());
            }
        }, 5000);
    }
    handleConnection(client) {
        const userId = client.handshake.query.userId || undefined;
        this.sanctuaryService.registerSocketHeartbeat(client.id, userId);
        client.emit('sanctuary:init', {
            seats: this.sanctuaryService.state.seats,
            stats: this.sanctuaryService.getLiveStats(),
            settings: this.sanctuaryService.state.settings,
            syncedAudio: this.sanctuaryService.getSyncedAudioState(),
            audioTracks: this.sanctuaryService.state.audioTracks,
            audioSchedules: this.sanctuaryService.state.audioSchedules,
            announcements: this.sanctuaryService.getActiveAnnouncements(),
        });
        this.broadcastStats();
    }
    async handleDisconnect(client) {
        const disconnectedUserId = this.sanctuaryService.removeSocket(client.id);
        if (disconnectedUserId && !disconnectedUserId.startsWith('guest-')) {
            const released = await this.sanctuaryService.releaseSeatByUser(disconnectedUserId, 'SOCKET_DISCONNECT');
            if (released.length > 0) {
                this.broadcastFullSync();
                return;
            }
        }
        this.broadcastStats();
    }
    handleHeartbeat(client, payload) {
        this.sanctuaryService.registerSocketHeartbeat(client.id, payload?.userId);
        return {
            ok: true,
            stats: this.sanctuaryService.getLiveStats(),
            syncedAudio: this.sanctuaryService.getSyncedAudioState(),
        };
    }
    handleBowPose(payload) {
        const seat = this.sanctuaryService.updateBowingPose(payload.userId, payload.seatId, payload.pose);
        if (seat && this.server) {
            this.server.emit('sanctuary:seat_updated', {
                seat,
                stats: this.sanctuaryService.getLiveStats(),
            });
        }
    }
    broadcastSeatUpdate(seat) {
        if (!this.server)
            return;
        this.server.emit('sanctuary:seat_updated', {
            seat,
            stats: this.sanctuaryService.getLiveStats(),
        });
    }
    broadcastStats() {
        if (!this.server)
            return;
        this.server.emit('sanctuary:stats', this.sanctuaryService.getLiveStats());
    }
    broadcastAudioSync() {
        if (!this.server)
            return;
        this.server.emit('sanctuary:audio_sync', this.sanctuaryService.getSyncedAudioState());
    }
    broadcastAnnouncements() {
        if (!this.server)
            return;
        this.server.emit('sanctuary:announcements', this.sanctuaryService.getActiveAnnouncements());
    }
    broadcastFullSync() {
        if (!this.server)
            return;
        this.server.emit('sanctuary:init', {
            seats: this.sanctuaryService.state.seats,
            stats: this.sanctuaryService.getLiveStats(),
            settings: this.sanctuaryService.state.settings,
            syncedAudio: this.sanctuaryService.getSyncedAudioState(),
            audioTracks: this.sanctuaryService.state.audioTracks,
            audioSchedules: this.sanctuaryService.state.audioSchedules,
            announcements: this.sanctuaryService.getActiveAnnouncements(),
        });
        this.broadcastAudioSync();
        this.broadcastAnnouncements();
    }
};
exports.SanctuaryGateway = SanctuaryGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], SanctuaryGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('sanctuary:heartbeat'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], SanctuaryGateway.prototype, "handleHeartbeat", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('sanctuary:bow_pose'),
    __param(0, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SanctuaryGateway.prototype, "handleBowPose", null);
exports.SanctuaryGateway = SanctuaryGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: '*',
        },
    }),
    __metadata("design:paramtypes", [sanctuary_service_1.SanctuaryService])
], SanctuaryGateway);
//# sourceMappingURL=sanctuary.gateway.js.map