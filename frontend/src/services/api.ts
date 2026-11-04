import { io, Socket } from 'socket.io-client';

class SanctuarySocketService {
  public socket: Socket | null = null;
  private heartbeatTimer: number | null = null;

  public connect(
    userId: string | undefined,
    handlers: {
      onInit: (payload: any) => void;
      onSeatUpdated: (payload: any) => void;
      onStats: (stats: any) => void;
      onAudioSync?: (syncedAudio: any) => void;
      onAnnouncements?: (announcements: any[]) => void;
    }
  ) {
    if (this.socket) {
      this.socket.disconnect();
    }

    this.socket = io('/', {
      query: userId ? { userId } : {},
      transports: ['websocket', 'polling'],
    });

    this.socket.on('sanctuary:init', (payload) => {
      handlers.onInit(payload);
    });

    this.socket.on('sanctuary:seat_updated', (payload) => {
      handlers.onSeatUpdated(payload);
    });

    this.socket.on('sanctuary:stats', (stats) => {
      handlers.onStats(stats);
    });

    this.socket.on('sanctuary:audio_sync', (syncedAudio) => {
      if (handlers.onAudioSync) {
        handlers.onAudioSync(syncedAudio);
      }
    });

    this.socket.on('sanctuary:announcements', (announcements) => {
      if (handlers.onAnnouncements) {
        handlers.onAnnouncements(announcements);
      }
    });

    // Heartbeat every 12 seconds to keep seat session active
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    this.heartbeatTimer = window.setInterval(() => {
      if (this.socket?.connected) {
        this.socket.emit(
          'sanctuary:heartbeat',
          { userId },
          (ack: { stats?: any; syncedAudio?: any }) => {
            if (ack?.stats) handlers.onStats(ack.stats);
            if (ack?.syncedAudio && handlers.onAudioSync) {
              handlers.onAudioSync(ack.syncedAudio);
            }
          }
        );
      }
    }, 12000);
  }

  public emitBowPose(
    userId: string,
    seatId: number,
    pose: 'STANDING' | 'KNEELING' | 'BOWING'
  ) {
    if (this.socket?.connected) {
      this.socket.emit('sanctuary:bow_pose', { userId, seatId, pose });
    }
  }

  public disconnect() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SanctuarySocketService();

export async function apiRequest<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    let message = 'Yêu cầu không thành công.';
    try {
      const errJson = await res.json();
      message = errJson.message || message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  return res.json();
}
