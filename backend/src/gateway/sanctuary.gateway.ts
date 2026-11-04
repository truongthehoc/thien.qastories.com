import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SanctuaryService } from '../sanctuary.service';
import { OnModuleInit } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SanctuaryGateway
  implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  server: Server;

  constructor(private readonly sanctuaryService: SanctuaryService) {}

  onModuleInit() {
    // Periodic cleanup of expired heartbeats every 15 seconds
    setInterval(() => {
      const released = this.sanctuaryService.cleanupExpiredHeartbeats();
      if (released.length > 0 && this.server) {
        this.broadcastFullSync();
      }
    }, 15000);

    // Periodic realtime audio synchronization every 5 seconds to keep all participants in exact lockstep
    setInterval(() => {
      if (this.server) {
        this.server.emit('sanctuary:audio_sync', this.sanctuaryService.getSyncedAudioState());
      }
    }, 5000);
  }

  handleConnection(client: Socket) {
    const userId = (client.handshake.query.userId as string) || undefined;
    this.sanctuaryService.registerSocketHeartbeat(client.id, userId);

    // Send immediate state snapshot to newly joined visitor
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

  async handleDisconnect(client: Socket) {
    const disconnectedUserId = this.sanctuaryService.removeSocket(client.id);
    if (disconnectedUserId && !disconnectedUserId.startsWith('guest-')) {
      const released = await this.sanctuaryService.releaseSeatByUser(
        disconnectedUserId,
        'SOCKET_DISCONNECT'
      );
      if (released.length > 0) {
        this.broadcastFullSync();
        return;
      }
    }
    this.broadcastStats();
  }

  @SubscribeMessage('sanctuary:heartbeat')
  handleHeartbeat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { userId?: string }
  ) {
    this.sanctuaryService.registerSocketHeartbeat(client.id, payload?.userId);
    return {
      ok: true,
      stats: this.sanctuaryService.getLiveStats(),
      syncedAudio: this.sanctuaryService.getSyncedAudioState(),
    };
  }

  @SubscribeMessage('sanctuary:bow_pose')
  handleBowPose(
    @MessageBody()
    payload: {
      userId: string;
      seatId: number;
      pose: 'STANDING' | 'KNEELING' | 'BOWING';
    }
  ) {
    const seat = this.sanctuaryService.updateBowingPose(
      payload.userId,
      payload.seatId,
      payload.pose
    );
    if (seat && this.server) {
      this.server.emit('sanctuary:seat_updated', {
        seat,
        stats: this.sanctuaryService.getLiveStats(),
      });
    }
  }

  public broadcastSeatUpdate(seat: unknown) {
    if (!this.server) return;
    this.server.emit('sanctuary:seat_updated', {
      seat,
      stats: this.sanctuaryService.getLiveStats(),
    });
  }

  public broadcastStats() {
    if (!this.server) return;
    this.server.emit('sanctuary:stats', this.sanctuaryService.getLiveStats());
  }

  public broadcastAudioSync() {
    if (!this.server) return;
    this.server.emit('sanctuary:audio_sync', this.sanctuaryService.getSyncedAudioState());
  }

  public broadcastAnnouncements() {
    if (!this.server) return;
    this.server.emit('sanctuary:announcements', this.sanctuaryService.getActiveAnnouncements());
  }

  public broadcastFullSync() {
    if (!this.server) return;
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
}
