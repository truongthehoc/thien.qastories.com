import { Injectable, Logger, OnModuleInit, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface SeatRecord {
  id: number;
  code: string;
  zoneName: string;
  ringIndex: 1 | 2 | 3 | 4;
  posX: number;
  posY: number;
  scale: number;
  isEnabled: boolean;
  status: 'EMPTY' | 'MEDITATING' | 'BOWING';
  occupant: {
    userId: string;
    displayName: string;
    avatarStyle: string;
    activityType: 'MEDITATING' | 'BOWING';
    bowingPose?: 'STANDING' | 'KNEELING' | 'BOWING';
    targetMinutes?: number;
    startedAt: string;
    expectedEndAt?: string;
    sessionId: string;
  } | null;
}

export interface UserRecord {
  id: string;
  displayName: string;
  avatarStyle: string;
  sessionToken: string;
  status: 'ACTIVE' | 'RESTRICTED' | 'BANNED';
  restrictionReason?: string;
  totalPoints: number;
  totalMeditationMinutes: number;
  totalMeditationCount: number;
  totalBowingCount: number;
  streakDays: number;
  createdAt: string;
  lastSeenAt: string;
}

export interface PointTxRecord {
  id: string;
  userId: string;
  activityType: string;
  referenceId: string;
  idempotencyKey: string;
  points: number;
  description: string;
  createdAt: string;
}

export interface AudioTrackRecord {
  id: string;
  title: string;
  description: string;
  category: 'NHAC_THIEN' | 'TIENG_SUOI' | 'TIENG_MUA' | 'TIENG_CHUONG' | 'TUNG_KINH';
  fileUrl: string;
  durationSeconds: number;
  sortOrder: number;
  isEnabled: boolean;
  isAmbientBg: boolean;
}

export interface AudioScheduleRecord {
  id: string;
  name: string;
  trackId: string | null;
  playlistId: string | null;
  startTime: string; // "HH:mm"
  endTime?: string;   // "HH:mm"
  durationMinutes: number;
  sortOrder: number;
  isRepeatDaily: boolean;
  gapSeconds: number;
  isEnabled: boolean;
}

export interface AudioPlaylistRecord {
  id: string;
  name: string;
  description: string;
  isLoop: boolean;
  gapSeconds: number;
  ambientTrackId: string | null;
  isEnabled: boolean;
  trackIds: string[];
}

export interface ActivityLogRecord {
  id: string;
  userId?: string;
  displayName?: string;
  action: string;
  detail: string;
  createdAt: string;
}

const INITIAL_SEAT_COORDS: Array<{
  id: number;
  code: string;
  zoneName: string;
  ringIndex: 1 | 2 | 3 | 4;
  posX: number;
  posY: number;
  scale: number;
}> = [
  // ==========================================================================
  // CÁNH TẢ (LEFT WING) - 21 TỌA CỤ (01 - 21) - Mặt hướng về bên phải (vào Thiền Sư)
  // posX trong khoảng 11.5% đến 43.5%
  // ==========================================================================
  // Hàng 1 (Xa nhất, Y ~ 61.5% - 63.5%)
  { id: 1,  code: '01', zoneName: 'Cánh Tả', ringIndex: 1, posX: 39.5, posY: 61.5, scale: 0.82 },
  { id: 2,  code: '02', zoneName: 'Cánh Tả', ringIndex: 1, posX: 32.0, posY: 62.0, scale: 0.82 },
  { id: 3,  code: '03', zoneName: 'Cánh Tả', ringIndex: 1, posX: 24.5, posY: 62.8, scale: 0.82 },
  { id: 4,  code: '04', zoneName: 'Cánh Tả', ringIndex: 1, posX: 17.0, posY: 63.5, scale: 0.82 },

  // Hàng 2 (Y ~ 67.2% - 70.0%)
  { id: 5,  code: '05', zoneName: 'Cánh Tả', ringIndex: 2, posX: 42.0, posY: 67.2, scale: 0.88 },
  { id: 6,  code: '06', zoneName: 'Cánh Tả', ringIndex: 2, posX: 34.0, posY: 68.0, scale: 0.88 },
  { id: 7,  code: '07', zoneName: 'Cánh Tả', ringIndex: 2, posX: 26.0, posY: 69.0, scale: 0.88 },
  { id: 8,  code: '08', zoneName: 'Cánh Tả', ringIndex: 2, posX: 17.5, posY: 70.0, scale: 0.88 },

  // Hàng 3 (Y ~ 73.5% - 77.0%)
  { id: 9,  code: '09', zoneName: 'Cánh Tả', ringIndex: 3, posX: 43.5, posY: 73.5, scale: 0.95 },
  { id: 10, code: '10', zoneName: 'Cánh Tả', ringIndex: 3, posX: 36.0, posY: 74.2, scale: 0.95 },
  { id: 11, code: '11', zoneName: 'Cánh Tả', ringIndex: 3, posX: 28.5, posY: 75.0, scale: 0.95 },
  { id: 12, code: '12', zoneName: 'Cánh Tả', ringIndex: 3, posX: 21.0, posY: 76.0, scale: 0.95 },
  { id: 13, code: '13', zoneName: 'Cánh Tả', ringIndex: 3, posX: 13.5, posY: 77.0, scale: 0.95 },

  // Hàng 4 (Y ~ 80.5% - 83.8%)
  { id: 14, code: '14', zoneName: 'Cánh Tả', ringIndex: 4, posX: 41.5, posY: 80.5, scale: 1.02 },
  { id: 15, code: '15', zoneName: 'Cánh Tả', ringIndex: 4, posX: 33.5, posY: 81.5, scale: 1.02 },
  { id: 16, code: '16', zoneName: 'Cánh Tả', ringIndex: 4, posX: 25.0, posY: 82.5, scale: 1.02 },
  { id: 17, code: '17', zoneName: 'Cánh Tả', ringIndex: 4, posX: 16.0, posY: 83.8, scale: 1.02 },

  // Hàng 5 (Tiền cảnh rộng, Y ~ 87.2% - 89.8%)
  { id: 18, code: '18', zoneName: 'Cánh Tả', ringIndex: 4, posX: 38.0, posY: 87.2, scale: 1.10 },
  { id: 19, code: '19', zoneName: 'Cánh Tả', ringIndex: 4, posX: 29.5, posY: 88.0, scale: 1.10 },
  { id: 20, code: '20', zoneName: 'Cánh Tả', ringIndex: 4, posX: 20.5, posY: 89.0, scale: 1.10 },
  { id: 21, code: '21', zoneName: 'Cánh Tả', ringIndex: 4, posX: 11.5, posY: 89.8, scale: 1.10 },

  // ==========================================================================
  // TRỤC TRUNG TÂM (CENTER AXIS) - 8 TỌA CỤ (22 - 29) - Quay lưng lại, nhìn thẳng cội cây
  // posX trong khoảng 47.6% đến 52.8%
  // ==========================================================================
  { id: 22, code: '22', zoneName: 'Trục Trung Tâm', ringIndex: 1, posX: 48.2, posY: 63.8, scale: 0.84 },
  { id: 23, code: '23', zoneName: 'Trục Trung Tâm', ringIndex: 1, posX: 52.2, posY: 63.8, scale: 0.84 },

  { id: 24, code: '24', zoneName: 'Trục Trung Tâm', ringIndex: 2, posX: 48.0, posY: 70.8, scale: 0.92 },
  { id: 25, code: '25', zoneName: 'Trục Trung Tâm', ringIndex: 2, posX: 52.4, posY: 70.8, scale: 0.92 },

  { id: 26, code: '26', zoneName: 'Trục Trung Tâm', ringIndex: 3, posX: 47.8, posY: 78.5, scale: 1.00 },
  { id: 27, code: '27', zoneName: 'Trục Trung Tâm', ringIndex: 3, posX: 52.6, posY: 78.5, scale: 1.00 },

  { id: 28, code: '28', zoneName: 'Trục Trung Tâm', ringIndex: 4, posX: 47.6, posY: 86.8, scale: 1.10 },
  { id: 29, code: '29', zoneName: 'Trục Trung Tâm', ringIndex: 4, posX: 52.8, posY: 86.8, scale: 1.10 },

  // ==========================================================================
  // CÁNH HỮU (RIGHT WING) - 21 TỌA CỤ (30 - 50) - Mặt hướng về bên trái (vào Thiền Sư)
  // posX trong khoảng 56.5% đến 88.5%
  // ==========================================================================
  // Hàng 1 (Xa nhất, Y ~ 61.5% - 63.5%)
  { id: 30, code: '30', zoneName: 'Cánh Hữu', ringIndex: 1, posX: 60.5, posY: 61.5, scale: 0.82 },
  { id: 31, code: '31', zoneName: 'Cánh Hữu', ringIndex: 1, posX: 68.0, posY: 62.0, scale: 0.82 },
  { id: 32, code: '32', zoneName: 'Cánh Hữu', ringIndex: 1, posX: 75.5, posY: 62.8, scale: 0.82 },
  { id: 33, code: '33', zoneName: 'Cánh Hữu', ringIndex: 1, posX: 83.0, posY: 63.5, scale: 0.82 },

  // Hàng 2 (Y ~ 67.2% - 70.0%)
  { id: 34, code: '34', zoneName: 'Cánh Hữu', ringIndex: 2, posX: 58.0, posY: 67.2, scale: 0.88 },
  { id: 35, code: '35', zoneName: 'Cánh Hữu', ringIndex: 2, posX: 66.0, posY: 68.0, scale: 0.88 },
  { id: 36, code: '36', zoneName: 'Cánh Hữu', ringIndex: 2, posX: 74.0, posY: 69.0, scale: 0.88 },
  { id: 37, code: '37', zoneName: 'Cánh Hữu', ringIndex: 2, posX: 82.5, posY: 70.0, scale: 0.88 },

  // Hàng 3 (Y ~ 73.5% - 77.0%)
  { id: 38, code: '38', zoneName: 'Cánh Hữu', ringIndex: 3, posX: 56.5, posY: 73.5, scale: 0.95 },
  { id: 39, code: '39', zoneName: 'Cánh Hữu', ringIndex: 3, posX: 64.0, posY: 74.2, scale: 0.95 },
  { id: 40, code: '40', zoneName: 'Cánh Hữu', ringIndex: 3, posX: 71.5, posY: 75.0, scale: 0.95 },
  { id: 41, code: '41', zoneName: 'Cánh Hữu', ringIndex: 3, posX: 79.0, posY: 76.0, scale: 0.95 },
  { id: 42, code: '42', zoneName: 'Cánh Hữu', ringIndex: 3, posX: 86.5, posY: 77.0, scale: 0.95 },

  // Hàng 4 (Y ~ 80.5% - 83.8%)
  { id: 43, code: '43', zoneName: 'Cánh Hữu', ringIndex: 4, posX: 58.5, posY: 80.5, scale: 1.02 },
  { id: 44, code: '44', zoneName: 'Cánh Hữu', ringIndex: 4, posX: 66.5, posY: 81.5, scale: 1.02 },
  { id: 45, code: '45', zoneName: 'Cánh Hữu', ringIndex: 4, posX: 75.0, posY: 82.5, scale: 1.02 },
  { id: 46, code: '46', zoneName: 'Cánh Hữu', ringIndex: 4, posX: 84.0, posY: 83.8, scale: 1.02 },

  // Hàng 5 (Tiền cảnh rộng, Y ~ 87.2% - 89.8%)
  { id: 47, code: '47', zoneName: 'Cánh Hữu', ringIndex: 4, posX: 62.0, posY: 87.2, scale: 1.10 },
  { id: 48, code: '48', zoneName: 'Cánh Hữu', ringIndex: 4, posX: 70.5, posY: 88.0, scale: 1.10 },
  { id: 49, code: '49', zoneName: 'Cánh Hữu', ringIndex: 4, posX: 79.5, posY: 89.0, scale: 1.10 },
  { id: 50, code: '50', zoneName: 'Cánh Hữu', ringIndex: 4, posX: 88.5, posY: 89.8, scale: 1.10 },
];

export interface SanctuaryAnnouncementRecord {
  id: string;
  title?: string;
  content: string;
  type: 'INFO' | 'EVENT' | 'REMINDER';
  startTime: string;
  endTime: string;
  isMarquee: boolean;
  scrollSpeed: 'SLOW' | 'NORMAL' | 'FAST';
  repeatIntervalMinutes: number;
  durationDisplaySeconds?: number;
  isEnabled: boolean;
  createdAt: string;
}

export interface AdminAccountRecord {
  username: string;
  password?: string;
  displayName: string;
  email: string;
  role: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

@Injectable()
export class SanctuaryService implements OnModuleInit {
  private readonly logger = new Logger(SanctuaryService.name);
  private readonly dbFilePath = path.join(process.cwd(), 'data', 'sanctuary-db.json');

  // Mutex lock queue to guarantee serializable transactions for seat claiming & point awarding
  private mutexPromise: Promise<unknown> = Promise.resolve();

  // Active online socket connections & heartbeats: Map<socketId, { userId, lastHeartbeatMs }>
  private onlineConnections = new Map<string, { userId: string; lastHeartbeatMs: number }>();

  // Persistent state mirror
  public state: {
    seats: SeatRecord[];
    users: UserRecord[];
    pointTransactions: PointTxRecord[];
    meditationSessions: Array<{
      id: string;
      userId: string;
      seatId: number;
      targetMinutes: number;
      status: 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
      startedAtMs: number;
      completedAt?: string;
      pointsAwarded: number;
    }>;
    bowingActivities: Array<{
      id: string;
      userId: string;
      seatId: number;
      status: 'IN_PROGRESS' | 'COMPLETED';
      startedAtMs: number;
      completedAt?: string;
      pointsAwarded: number;
    }>;
    audioTracks: AudioTrackRecord[];
    audioPlaylists: AudioPlaylistRecord[];
    audioSchedules: AudioScheduleRecord[];
    announcements: SanctuaryAnnouncementRecord[];
    adminAccount: AdminAccountRecord;
    settings: {
      sanctuaryName: string;
      adminPortalTitle?: string;
      adminPortalSubtitle?: string;
      welcomeTitle: string;
      welcomeMessage: string;
      backgroundUrl: string;
      zenMasterUrl: string;
      practitionerLeftUrl?: string;
      practitionerRightUrl?: string;
      practitionerCenterUrl?: string;
      practitionerLeftFlip?: boolean;
      practitionerRightFlip?: boolean;
      activeSeatCount: number;
      seatTimeoutSeconds: number;
      bowingPoints: number;
      meditation5Points: number;
      meditation10Points: number;
      meditation15Points: number;
      meditation30Points: number;
      bowCooldownSeconds: number;
      enableNatureAnimations: boolean;
    };
    activityLogs: ActivityLogRecord[];
    visitsToday: number;
  };

  constructor(private readonly prisma: PrismaService) {
    this.initDefaultState();
  }

  onModuleInit() {
    this.loadFromDisk();
  }

  private runInTransaction<T>(fn: () => Promise<T> | T): Promise<T> {
    const next = this.mutexPromise.then(() => fn());
    this.mutexPromise = next.catch(() => undefined);
    return next;
  }

  private initDefaultState() {
    const defaultTracks: AudioTrackRecord[] = [
      {
        id: 'track-suoi-rung',
        title: 'Tiếng Suối Rừng Đại Thụ & Hơi Thở Tự Nhiên',
        description: 'Âm thanh dòng suối chảy qua ghềnh đá rêu xanh kết hợp tần số an định 432Hz.',
        category: 'TIENG_SUOI',
        fileUrl: '',
        durationSeconds: 1800,
        sortOrder: 1,
        isEnabled: true,
        isAmbientBg: true,
      },
      {
        id: 'track-nhac-thien',
        title: 'Nhạc Thiền Trúc Lâm Tĩnh Tọa',
        description: 'Giai điệu tĩnh lặng giúp buông thư vọng tưởng và quay về chánh niệm.',
        category: 'NHAC_THIEN',
        fileUrl: '',
        durationSeconds: 1800,
        sortOrder: 2,
        isEnabled: true,
        isAmbientBg: false,
      },
      {
        id: 'track-tieng-chuong',
        title: 'Tiếng Chuông Chùa Tỉnh Thức (Chuông Gia Trì)',
        description: 'Tiếng chuông ngân vang giữa đại ngàn đánh thức sự tỉnh giác.',
        category: 'TIENG_CHUONG',
        fileUrl: '',
        durationSeconds: 900,
        sortOrder: 3,
        isEnabled: true,
        isAmbientBg: false,
      },
      {
        id: 'track-tieng-mua',
        title: 'Tiếng Mưa Rừng Thanh Lương',
        description: 'Tiếng mưa rơi nhẹ trên tán cổ thụ mang lại cảm giác mát lành.',
        category: 'TIENG_MUA',
        fileUrl: '',
        durationSeconds: 1800,
        sortOrder: 4,
        isEnabled: true,
        isAmbientBg: false,
      },
      {
        id: 'track-tung-kinh',
        title: 'Tụng Kinh Từ Bi & Chú Đại Bi Trầm Hùng',
        description: 'Âm vang tụng niệm trang nghiêm nuôi dưỡng tâm từ bi.',
        category: 'TUNG_KINH',
        fileUrl: '',
        durationSeconds: 1800,
        sortOrder: 5,
        isEnabled: true,
        isAmbientBg: false,
      },
    ];

    const defaultSchedules: AudioScheduleRecord[] = [
      {
        id: 'sched-01',
        name: 'Khung giờ Tĩnh Tâm Sớm Mai (Tiếng suối)',
        trackId: 'track-suoi-rung',
        playlistId: null,
        startTime: '05:00',
        durationMinutes: 30,
        sortOrder: 1,
        isRepeatDaily: true,
        gapSeconds: 5,
        isEnabled: true,
      },
      {
        id: 'sched-02',
        name: 'Khung giờ Thiền Định Bình Minh (Nhạc thiền)',
        trackId: 'track-nhac-thien',
        playlistId: null,
        startTime: '05:30',
        durationMinutes: 30,
        sortOrder: 2,
        isRepeatDaily: true,
        gapSeconds: 5,
        isEnabled: true,
      },
      {
        id: 'sched-03',
        name: 'Khung giờ Chuông Tỉnh Thức',
        trackId: 'track-tieng-chuong',
        playlistId: null,
        startTime: '06:00',
        durationMinutes: 15,
        sortOrder: 3,
        isRepeatDaily: true,
        gapSeconds: 5,
        isEnabled: true,
      },
      {
        id: 'sched-04',
        name: 'Khung giờ Thiền Hành & An Trú Ban Ngày',
        trackId: 'track-nhac-thien',
        playlistId: null,
        startTime: '06:15',
        durationMinutes: 720,
        sortOrder: 4,
        isRepeatDaily: true,
        gapSeconds: 5,
        isEnabled: true,
      },
      {
        id: 'sched-05',
        name: 'Khung giờ Tĩnh Tọa Đêm Khuya',
        trackId: 'track-suoi-rung',
        playlistId: null,
        startTime: '18:30',
        durationMinutes: 600,
        sortOrder: 5,
        isRepeatDaily: true,
        gapSeconds: 5,
        isEnabled: true,
      },
    ];

    // Seed 3 serene fellow practitioners so the sanctuary feels alive on first visit
    const nowIso = new Date().toISOString();
    const seededUsers: UserRecord[] = [
      {
        id: 'fellow-minh-tam',
        displayName: 'Minh Tâm',
        avatarStyle: 'ochre_gold',
        sessionToken: 'seed-token-1',
        status: 'ACTIVE',
        totalPoints: 145,
        totalMeditationMinutes: 120,
        totalMeditationCount: 9,
        totalBowingCount: 5,
        streakDays: 7,
        createdAt: nowIso,
        lastSeenAt: nowIso,
      },
      {
        id: 'fellow-tinh-hai',
        displayName: 'Tịnh Hải',
        avatarStyle: 'monastic_brown',
        sessionToken: 'seed-token-2',
        status: 'ACTIVE',
        totalPoints: 95,
        totalMeditationMinutes: 80,
        totalMeditationCount: 6,
        totalBowingCount: 3,
        streakDays: 4,
        createdAt: nowIso,
        lastSeenAt: nowIso,
      },
      {
        id: 'fellow-an-nhien',
        displayName: 'An Nhiên',
        avatarStyle: 'lam_grey',
        sessionToken: 'seed-token-3',
        status: 'ACTIVE',
        totalPoints: 65,
        totalMeditationMinutes: 50,
        totalMeditationCount: 4,
        totalBowingCount: 3,
        streakDays: 3,
        createdAt: nowIso,
        lastSeenAt: nowIso,
      },
    ];

    const seats: SeatRecord[] = INITIAL_SEAT_COORDS.map((c) => {
      if (c.id === 3) {
        return {
          ...c,
          isEnabled: true,
          status: 'MEDITATING',
          occupant: {
            userId: 'fellow-minh-tam',
            displayName: 'Minh Tâm',
            avatarStyle: 'ochre_gold',
            activityType: 'MEDITATING',
            targetMinutes: 30,
            startedAt: nowIso,
            sessionId: 'seed-sess-3',
          },
        };
      }
      if (c.id === 14) {
        return {
          ...c,
          isEnabled: true,
          status: 'MEDITATING',
          occupant: {
            userId: 'fellow-tinh-hai',
            displayName: 'Tịnh Hải',
            avatarStyle: 'monastic_brown',
            activityType: 'MEDITATING',
            targetMinutes: 15,
            startedAt: nowIso,
            sessionId: 'seed-sess-14',
          },
        };
      }
      return {
        ...c,
        isEnabled: true,
        status: 'EMPTY',
        occupant: null,
      };
    });

    this.state = {
      seats,
      users: seededUsers,
      pointTransactions: [],
      meditationSessions: [],
      bowingActivities: [],
      audioTracks: defaultTracks,
      audioPlaylists: [
        {
          id: 'playlist-buoi-sang',
          name: 'Playlist Thiền Buổi Sáng',
          description: 'Chuỗi âm thanh suối chảy, chuông chùa và nhạc thiền',
          isLoop: true,
          gapSeconds: 5,
          ambientTrackId: 'track-suoi-rung',
          isEnabled: true,
          trackIds: ['track-suoi-rung', 'track-nhac-thien', 'track-tieng-chuong'],
        },
      ],
      audioSchedules: defaultSchedules,
      announcements: [
        {
          id: 'ann-default-1',
          title: 'Lời nhắn an trú',
          content: 'Chào mừng quý đạo hữu đến với Không gian Thiền Viện. Kính chúc quý vị thân tâm thường an lạc, an trú trong phút giây hiện tại nhiệm màu.',
          type: 'INFO',
          startTime: new Date(Date.now() - 3600000).toISOString().slice(0, 16),
          endTime: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 16),
          isMarquee: true,
          scrollSpeed: 'NORMAL',
          repeatIntervalMinutes: 0,
          durationDisplaySeconds: 30,
          isEnabled: true,
          createdAt: nowIso,
        },
      ],
      adminAccount: {
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'thienvien@2026',
        displayName: 'Ban Điều Hành Thiền Viện',
        email: 'admin@thienvien.org',
        role: 'Tổng Quản Trị Viên (Super Admin)',
        avatarUrl: '',
        createdAt: nowIso,
        updatedAt: nowIso,
        lastLoginAt: nowIso,
      },
      settings: {
        sanctuaryName: 'THIỀN VIÊN – Không gian an trú',
        adminPortalTitle: 'Thiền Viên Admin Center',
        adminPortalSubtitle: 'Không gian an trú • Ban Điều Hành',
        welcomeTitle: 'Chào mừng bạn đến với Thiền Viên',
        welcomeMessage:
          'Giữa cuộc sống bộn bề, hãy dành một chút thời gian để trở về với sự bình an trong tâm.',
        backgroundUrl: '/assets/sanctuary/forest-sanctuary-bg.jpg',
        zenMasterUrl: '/assets/sanctuary/zen-master-figure.png',
        practitionerLeftUrl: '/assets/sanctuary/practitioner-left.png',
        practitionerRightUrl: '/assets/sanctuary/practitioner-right.png',
        practitionerCenterUrl: '/assets/sanctuary/practitioner-back.png',
        practitionerLeftFlip: false,
        practitionerRightFlip: false,
        activeSeatCount: 50,
        seatTimeoutSeconds: 90,
        bowingPoints: 5,
        meditation5Points: 5,
        meditation10Points: 10,
        meditation15Points: 15,
        meditation30Points: 30,
        bowCooldownSeconds: 15,
        enableNatureAnimations: true,
      },
      activityLogs: [
        {
          id: uuidv4(),
          userId: 'fellow-minh-tam',
          displayName: 'Minh Tâm',
          action: 'MEDITATION_START',
          detail: 'Bắt đầu ngồi thiền 30 phút tại Tọa cụ #03 (Liên Hoa Nội Tâm)',
          createdAt: nowIso,
        },
        {
          id: uuidv4(),
          userId: 'fellow-tinh-hai',
          displayName: 'Tịnh Hải',
          action: 'MEDITATION_START',
          detail: 'Bắt đầu ngồi thiền 15 phút tại Tọa cụ #14 (Tùng Lâm Tĩnh Độ)',
          createdAt: nowIso,
        },
      ],
      visitsToday: 18,
    };
  }

  private loadFromDisk() {
    try {
      const dir = path.dirname(this.dbFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      let readPath = this.dbFilePath;
      if (!fs.existsSync(readPath)) {
        const altPath = path.join(process.cwd(), 'backend', 'data', 'sanctuary-db.json');
        if (fs.existsSync(altPath)) {
          readPath = altPath;
        }
      }

      if (fs.existsSync(readPath)) {
        const raw = fs.readFileSync(readPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.seats) && parsed.seats.length === 50) {
          const updatedSeats = parsed.seats.map((seat: SeatRecord) => {
            const coord = INITIAL_SEAT_COORDS.find((c) => c.id === seat.id);
            return coord
              ? {
                  ...seat,
                  posX: coord.posX,
                  posY: coord.posY,
                  scale: coord.scale,
                  zoneName: coord.zoneName,
                  ringIndex: coord.ringIndex,
                }
              : seat;
          });
          this.state = {
            ...this.state,
            ...parsed,
            seats: updatedSeats,
            announcements:
              Array.isArray(parsed.announcements) && parsed.announcements.length > 0
                ? parsed.announcements
                : this.state.announcements,
            adminAccount: parsed.adminAccount || this.state.adminAccount,
            settings: {
              ...this.state.settings,
              ...(parsed.settings || {}),
            },
          };
          this.logger.log('Loaded Sanctuary state from persistent disk mirror.');
          return;
        }
      }
      this.saveToDisk();
    } catch (err) {
      this.logger.warn(`Failed to load disk mirror: ${(err as Error).message}`);
    }
  }

  public saveToDisk() {
    try {
      const dir = path.dirname(this.dbFilePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dbFilePath, JSON.stringify(this.state, null, 2), 'utf-8');
    } catch (err) {
      this.logger.warn(`Failed to write disk mirror: ${(err as Error).message}`);
    }
  }

  private logActivity(action: string, detail: string, user?: UserRecord) {
    this.state.activityLogs.unshift({
      id: uuidv4(),
      userId: user?.id,
      displayName: user?.displayName,
      action,
      detail,
      createdAt: new Date().toISOString(),
    });
    if (this.state.activityLogs.length > 250) {
      this.state.activityLogs.length = 250;
    }
  }

  // ============================================================================
  // USER SESSION & REGISTRATION
  // ============================================================================
  public async enterSanctuary(displayName: string, avatarStyle: string, existingUserId?: string) {
    return this.runInTransaction(async () => {
      const cleanedName = (displayName || '').trim().slice(0, 45);
      if (cleanedName.length < 2) {
        throw new BadRequestException('Tên hiển thị cần ít nhất 2 ký tự.');
      }

      let user = existingUserId
        ? this.state.users.find((u) => u.id === existingUserId)
        : this.state.users.find(
            (u) => u.displayName.toLowerCase() === cleanedName.toLowerCase()
          );

      if (user && user.status === 'BANNED') {
        throw new ForbiddenException('Tài khoản này đã bị tạm khóa do vi phạm quy tắc trang nghiêm.');
      }

      const nowIso = new Date().toISOString();
      if (!user) {
        user = {
          id: uuidv4(),
          displayName: cleanedName,
          avatarStyle: avatarStyle || 'monastic_brown',
          sessionToken: uuidv4(),
          status: 'ACTIVE',
          totalPoints: 0,
          totalMeditationMinutes: 0,
          totalMeditationCount: 0,
          totalBowingCount: 0,
          streakDays: 1,
          createdAt: nowIso,
          lastSeenAt: nowIso,
        };
        this.state.users.push(user);
        this.state.visitsToday += 1;
        this.logActivity('USER_JOIN', `${user.displayName} bước vào Thiền Viên`, user);
      } else {
        user.displayName = cleanedName;
        user.avatarStyle = avatarStyle || user.avatarStyle;
        user.lastSeenAt = nowIso;
      }

      if (this.prisma.isMySqlAvailable) {
        try {
          await this.prisma.user.upsert({
            where: { id: user.id },
            update: { displayName: user.displayName, avatarStyle: user.avatarStyle, lastSeenAt: new Date() },
            create: {
              id: user.id,
              displayName: user.displayName,
              avatarStyle: user.avatarStyle,
              userPoints: { create: { totalPoints: user.totalPoints } },
            },
          });
        } catch {
          // fallback smoothly
        }
      }

      this.saveToDisk();
      return user;
    });
  }

  // ============================================================================
  // SEAT OCCUPANCY & CONCURRENCY CONTROL (50 SEATS)
  // ============================================================================
  public async occupySeatForActivity(params: {
    userId: string;
    seatId?: number;
    activityType: 'MEDITATING' | 'BOWING';
    targetMinutes?: 5 | 10 | 15 | 30;
  }) {
    return this.runInTransaction(async () => {
      const user = this.state.users.find((u) => u.id === params.userId);
      if (!user) {
        throw new BadRequestException('Phiên người dùng không hợp lệ.');
      }
      if (user.status !== 'ACTIVE') {
        throw new ForbiddenException('Tài khoản đang bị hạn chế tham gia.');
      }

      let seat: SeatRecord | undefined;
      if (params.seatId && params.seatId > 0) {
        seat = this.state.seats.find((s) => s.id === params.seatId);
        if (!seat || !seat.isEnabled) {
          throw new BadRequestException('Vị trí tọa cụ này hiện không khả dụng.');
        }
        if (seat.status !== 'EMPTY' && seat.occupant && seat.occupant.userId !== user.id) {
          throw new BadRequestException(
            `Tọa cụ #${seat.code} đang có đạo hữu ${seat.occupant.displayName} an trú.`
          );
        }
      } else {
        // Tự động sắp xếp ngẫu nhiên vị trí còn trống
        const emptySeats = this.state.seats.filter(
          (s) => s.isEnabled && (s.status === 'EMPTY' || s.occupant?.userId === user.id)
        );
        if (emptySeats.length === 0) {
          throw new BadRequestException('Hiện tại tất cả 50 vị trí tọa cụ đều đã có người an tọa. Đạo hữu hoan hỷ chờ giây lát.');
        }
        seat = emptySeats[Math.floor(Math.random() * emptySeats.length)];
      }

      // Ensure a user never occupies two seats simultaneously
      const vacatedSeats: SeatRecord[] = [];
      for (const s of this.state.seats) {
        if (s.occupant?.userId === user.id && s.id !== seat.id) {
          s.status = 'EMPTY';
          s.occupant = null;
          vacatedSeats.push({ ...s });
        }
      }

      const now = Date.now();
      const nowIso = new Date(now).toISOString();
      const sessionId = uuidv4();

      if (params.activityType === 'MEDITATING') {
        const minutes = params.targetMinutes || 10;
        const expectedEndIso = new Date(now + minutes * 60 * 1000).toISOString();
        seat.status = 'MEDITATING';
        seat.occupant = {
          userId: user.id,
          displayName: user.displayName,
          avatarStyle: user.avatarStyle,
          activityType: 'MEDITATING',
          targetMinutes: minutes,
          startedAt: nowIso,
          expectedEndAt: expectedEndIso,
          sessionId,
        };
        this.state.meditationSessions.push({
          id: sessionId,
          userId: user.id,
          seatId: seat.id,
          targetMinutes: minutes,
          status: 'IN_PROGRESS',
          startedAtMs: now,
          pointsAwarded: 0,
        });
        this.logActivity(
          'MEDITATION_START',
          `${user.displayName} bắt đầu ngồi thiền (${minutes} phút) tại Tọa cụ #${seat.code}`,
          user
        );
      } else {
        seat.status = 'BOWING';
        seat.occupant = {
          userId: user.id,
          displayName: user.displayName,
          avatarStyle: user.avatarStyle,
          activityType: 'BOWING',
          bowingPose: 'STANDING',
          startedAt: nowIso,
          sessionId,
        };
        this.state.bowingActivities.push({
          id: sessionId,
          userId: user.id,
          seatId: seat.id,
          status: 'IN_PROGRESS',
          startedAtMs: now,
          pointsAwarded: 0,
        });
        this.logActivity(
          'BOWING_START',
          `${user.displayName} thực hiện nghi thức đảnh lễ Thiền sư tại Tọa cụ #${seat.code}`,
          user
        );
      }

      this.saveToDisk();
      return { seat, vacatedSeats, sessionId };
    });
  }

  public updateBowingPose(userId: string, seatId: number, pose: 'STANDING' | 'KNEELING' | 'BOWING') {
    const seat = this.state.seats.find((s) => s.id === seatId);
    if (seat && seat.occupant && seat.occupant.userId === userId) {
      seat.occupant.bowingPose = pose;
    }
    return seat;
  }

  // ============================================================================
  // SERVER-VERIFIED POINT AWARDING (ANTI-DUPLICATE IDEMPOTENCY)
  // ============================================================================
  public async completeActivityAndAwardPoints(params: {
    userId: string;
    seatId: number;
    sessionId: string;
    activityType: 'MEDITATING' | 'BOWING';
  }) {
    return this.runInTransaction(async () => {
      const user = this.state.users.find((u) => u.id === params.userId);
      if (!user) {
        throw new BadRequestException('Không tìm thấy thông tin người dùng.');
      }

      const idempotencyKey = `${params.activityType}:${params.sessionId}`;
      const existingTx = this.state.pointTransactions.find(
        (tx) => tx.idempotencyKey === idempotencyKey
      );
      if (existingTx) {
        // Already rewarded - return idempotent result
        return {
          user,
          pointsAwarded: existingTx.points,
          alreadyProcessed: true,
        };
      }

      let pointsToAward = 0;
      let description = '';

      if (params.activityType === 'BOWING') {
        const bowRecord = this.state.bowingActivities.find(
          (b) => b.id === params.sessionId && b.userId === user.id
        );
        if (!bowRecord) {
          throw new BadRequestException('Không tìm thấy phiên đảnh lễ hợp lệ.');
        }
        // Verify minimal ceremony elapsed time (at least 3.5 seconds for 3 poses)
        const elapsedMs = Date.now() - bowRecord.startedAtMs;
        if (elapsedMs < 3000) {
          throw new BadRequestException('Nghi thức đảnh lễ chưa hoàn tất.');
        }

        pointsToAward = this.state.settings.bowingPoints || 5;
        bowRecord.status = 'COMPLETED';
        bowRecord.completedAt = new Date().toISOString();
        bowRecord.pointsAwarded = pointsToAward;

        user.totalPoints += pointsToAward;
        user.totalBowingCount += 1;
        description = `Hoàn thành đảnh lễ Thiền sư tại Tọa cụ #${String(params.seatId).padStart(2, '0')}`;
      } else {
        const medRecord = this.state.meditationSessions.find(
          (m) => m.id === params.sessionId && m.userId === user.id
        );
        if (!medRecord) {
          throw new BadRequestException('Không tìm thấy phiên ngồi thiền hợp lệ.');
        }

        const m = medRecord.targetMinutes;
        if (m === 5) pointsToAward = this.state.settings.meditation5Points || 5;
        else if (m === 10) pointsToAward = this.state.settings.meditation10Points || 10;
        else if (m === 15) pointsToAward = this.state.settings.meditation15Points || 15;
        else if (m === 30) pointsToAward = this.state.settings.meditation30Points || 30;
        else pointsToAward = m;

        medRecord.status = 'COMPLETED';
        medRecord.completedAt = new Date().toISOString();
        medRecord.pointsAwarded = pointsToAward;

        user.totalPoints += pointsToAward;
        user.totalMeditationMinutes += m;
        user.totalMeditationCount += 1;
        description = `Hoàn thành ngồi thiền ${m} phút tại Tọa cụ #${String(params.seatId).padStart(2, '0')}`;
      }

      const txRecord: PointTxRecord = {
        id: uuidv4(),
        userId: user.id,
        activityType: params.activityType,
        referenceId: params.sessionId,
        idempotencyKey,
        points: pointsToAward,
        description,
        createdAt: new Date().toISOString(),
      };
      this.state.pointTransactions.unshift(txRecord);

      // Release seat after completion
      const seat = this.state.seats.find((s) => s.id === params.seatId);
      if (seat && seat.occupant?.userId === user.id) {
        seat.status = 'EMPTY';
        seat.occupant = null;
      }

      this.logActivity(
        params.activityType === 'BOWING' ? 'BOWING_COMPLETE' : 'MEDITATION_COMPLETE',
        `${user.displayName}: ${description} (+${pointsToAward} điểm)`,
        user
      );

      this.saveToDisk();
      return {
        user,
        seat,
        pointsAwarded: pointsToAward,
        transaction: txRecord,
      };
    });
  }

  public async releaseSeatByUser(userId: string, reason = 'USER_LEAVE') {
    return this.runInTransaction(async () => {
      const releasedSeats: SeatRecord[] = [];
      for (const seat of this.state.seats) {
        if (seat.occupant?.userId === userId) {
          seat.status = 'EMPTY';
          seat.occupant = null;
          releasedSeats.push(seat);
        }
      }
      if (releasedSeats.length > 0) {
        this.saveToDisk();
      }
      return releasedSeats;
    });
  }

  // ============================================================================
  // HEARTBEAT & REALTIME STATS
  // ============================================================================
  public registerSocketHeartbeat(socketId: string, userId?: string) {
    this.onlineConnections.set(socketId, {
      userId: userId || `guest-${socketId}`,
      lastHeartbeatMs: Date.now(),
    });
  }

  public removeSocket(socketId: string) {
    const info = this.onlineConnections.get(socketId);
    this.onlineConnections.delete(socketId);
    return info?.userId;
  }

  public cleanupExpiredHeartbeats(): SeatRecord[] {
    const now = Date.now();
    const timeoutMs = (this.state.settings.seatTimeoutSeconds || 90) * 1000;
    const expiredUserIds = new Set<string>();

    for (const [sockId, conn] of this.onlineConnections.entries()) {
      if (now - conn.lastHeartbeatMs > timeoutMs) {
        expiredUserIds.add(conn.userId);
        this.onlineConnections.delete(sockId);
      }
    }

    const updatedSeats: SeatRecord[] = [];
    for (const seat of this.state.seats) {
      if (
        seat.occupant &&
        !seat.occupant.userId.startsWith('fellow-') &&
        expiredUserIds.has(seat.occupant.userId)
      ) {
        seat.status = 'EMPTY';
        seat.occupant = null;
        updatedSeats.push(seat);
      }
    }
    if (updatedSeats.length > 0) {
      this.saveToDisk();
    }
    return updatedSeats;
  }

  public getLiveStats() {
    const enabledSeats = this.state.seats.filter((s) => s.isEnabled);
    const meditatingCount = enabledSeats.filter((s) => s.status === 'MEDITATING').length;
    const bowingCount = enabledSeats.filter((s) => s.status === 'BOWING').length;
    const occupiedSeatsCount = meditatingCount + bowingCount;
    const emptySeatsCount = Math.max(0, enabledSeats.length - occupiedSeatsCount);

    // Online count includes active sockets + seeded fellow practitioners
    const activeSocketCount = Math.max(1, this.onlineConnections.size);
    const totalOnline = Math.max(occupiedSeatsCount, activeSocketCount + 2);

    const totalMeditationMinutes = this.state.users.reduce(
      (acc, u) => acc + (u.totalMeditationMinutes || 0),
      0
    );
    const totalBows = this.state.users.reduce(
      (acc, u) => acc + (u.totalBowingCount || 0),
      0
    );
    const totalPointsAwarded = this.state.users.reduce(
      (acc, u) => acc + (u.totalPoints || 0),
      0
    );

    return {
      totalOnline,
      meditatingCount,
      bowingCount,
      emptySeatsCount,
      occupiedSeatsCount,
      totalVisitsToday: this.state.visitsToday,
      totalMeditationMinutes,
      totalBows,
      totalPointsAwarded,
    };
  }

  // ============================================================================
  // GLOBAL AUDIO SCHEDULE SYNCHRONIZATION
  // ============================================================================
  public getSyncedAudioState() {
    const now = new Date();
    const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

    const enabledTracks = this.state.audioTracks.filter((t) => t.isEnabled);
    const enabledSchedules = this.state.audioSchedules
      .filter((s) => s.isEnabled)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    let activeSchedule: AudioScheduleRecord | null = null;
    let scheduledElapsedSeconds = 0;

    for (const sched of enabledSchedules) {
      const [sH, sM] = (sched.startTime || '00:00').split(':').map(Number);
      const startSec = (sH || 0) * 3600 + (sM || 0) * 60;
      let endSec = startSec + (sched.durationMinutes || 30) * 60;
      if (sched.endTime) {
        const [eH, eM] = sched.endTime.split(':').map(Number);
        endSec = (eH || 0) * 3600 + (eM || 0) * 60;
        if (endSec <= startSec) {
          endSec += 86400; // schedule spans past midnight
        }
      }

      let isActive = false;
      let elapsed = 0;

      if (endSec > 86400) {
        if (nowSec >= startSec) {
          isActive = true;
          elapsed = nowSec - startSec;
        } else if (nowSec < endSec - 86400) {
          isActive = true;
          elapsed = (86400 - startSec) + nowSec;
        }
      } else {
        if (nowSec >= startSec && nowSec < endSec) {
          isActive = true;
          elapsed = nowSec - startSec;
        }
      }

      if (isActive) {
        const matchedTrack = enabledTracks.find((t) => t.id === sched.trackId);
        if (matchedTrack) {
          activeSchedule = sched;
          scheduledElapsedSeconds = elapsed;
          break;
        }
      }
    }

    const ambientTrack =
      enabledTracks.find((t) => t.isAmbientBg) || null;

    let currentTrack: AudioTrackRecord | null = null;
    let offsetSeconds = 0;
    let scheduleName = '';
    const isScheduled = Boolean(activeSchedule);

    if (activeSchedule) {
      // 1. In-schedule playback: loop continuously during the scheduled window
      currentTrack = enabledTracks.find((t) => t.id === activeSchedule!.trackId) || null;
      if (currentTrack) {
        const duration = Math.max(1, currentTrack.durationSeconds || 300);
        offsetSeconds = scheduledElapsedSeconds % duration;
        scheduleName = `${activeSchedule.name} (${activeSchedule.startTime}${activeSchedule.endTime ? ` - ${activeSchedule.endTime}` : ''})`;
      }
    }

    if (!currentTrack) {
      // 2. Outside schedule window -> auto fallback to ambient background track
      if (ambientTrack) {
        currentTrack = ambientTrack;
        const duration = Math.max(1, ambientTrack.durationSeconds || 300);
        offsetSeconds = nowSec % duration;
        scheduleName = `Nhạc nền Thiền Viện: ${ambientTrack.title}`;
      } else if (enabledTracks.length > 0) {
        currentTrack = enabledTracks[0];
        const duration = Math.max(1, currentTrack.durationSeconds || 300);
        offsetSeconds = nowSec % duration;
        scheduleName = `Mặc định: ${currentTrack.title}`;
      } else {
        scheduleName = 'Không gian Tĩnh Lặng';
      }
    }

    return {
      currentTrack,
      ambientTrack,
      activeSchedule,
      isScheduled,
      scheduleName,
      offsetSeconds,
      isPlaying: Boolean(currentTrack),
      serverTimestamp: Date.now(),
    };
  }

  // ============================================================================
  // USER HISTORY & LEADERBOARD
  // ============================================================================
  public getUserDetails(userId: string) {
    const user = this.state.users.find((u) => u.id === userId) || null;
    const history = this.state.pointTransactions
      .filter((tx) => tx.userId === userId)
      .slice(0, 30);
    const leaderboard = [...this.state.users]
      .filter((u) => u.status === 'ACTIVE')
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .slice(0, 15)
      .map((u) => ({
        userId: u.id,
        displayName: u.displayName,
        avatarStyle: u.avatarStyle,
        totalPoints: u.totalPoints,
        totalMeditationMinutes: u.totalMeditationMinutes,
        totalBowingCount: u.totalBowingCount,
      }));

    return { user, history, leaderboard };
  }

  // ============================================================================
  // ADMIN DASHBOARD OPERATIONS (/admin)
  // ============================================================================
  public getAdminDashboardData() {
    const stats = this.getLiveStats();

    // Generate 7-day chart analytics
    const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
    const chartDailyMeditation = days.map((day, idx) => ({
      day,
      minutes: 180 + idx * 45 + (idx === 6 ? stats.totalMeditationMinutes : 0),
      bows: 24 + idx * 8 + (idx === 6 ? stats.totalBows : 0),
      participants: 15 + idx * 5 + (idx === 6 ? stats.totalVisitsToday : 0),
    }));

    const chartPeakHours = [
      { hour: '05:00', count: 28 },
      { hour: '06:00', count: 35 },
      { hour: '08:00', count: 16 },
      { hour: '12:00', count: 19 },
      { hour: '18:00', count: 24 },
      { hour: '20:00', count: 42 },
      { hour: '21:00', count: 46 },
      { hour: '22:00', count: 31 },
    ];

    return {
      stats,
      seats: this.state.seats,
      users: this.state.users,
      audioTracks: this.state.audioTracks,
      audioPlaylists: this.state.audioPlaylists,
      audioSchedules: this.state.audioSchedules,
      announcements: this.state.announcements || [],
      adminProfile: this.getAdminProfile(),
      settings: this.state.settings,
      activityLogs: this.state.activityLogs.slice(0, 60),
      charts: {
        dailyActivity: chartDailyMeditation,
        peakHours: chartPeakHours,
      },
    };
  }

  public getAdminAccount(): AdminAccountRecord {
    return this.state.adminAccount;
  }

  public getAdminProfile() {
    const { password, ...safeProfile } = this.state.adminAccount;
    return safeProfile;
  }

  public recordAdminLogin(username: string) {
    if (this.state.adminAccount) {
      this.state.adminAccount.lastLoginAt = new Date().toISOString();
      this.saveToDisk();
    }
  }

  public updateAdminProfile(data: {
    displayName?: string;
    email?: string;
    username?: string;
    currentPassword?: string;
    newPassword?: string;
    avatarUrl?: string;
  }) {
    const account = this.state.adminAccount;
    const isChangingPassword = Boolean(data.newPassword && data.newPassword.trim().length > 0);
    const isChangingUsername = Boolean(
      data.username && data.username.trim().toLowerCase() !== account.username.toLowerCase()
    );

    // Require current password if changing credentials (username or password)
    if (isChangingPassword || isChangingUsername) {
      if (!data.currentPassword || data.currentPassword !== account.password) {
        throw new BadRequestException('Mật khẩu hiện tại không chính xác.');
      }
    }

    if (isChangingUsername && data.username) {
      const cleanUsername = data.username.trim().toLowerCase();
      if (cleanUsername.length < 3) {
        throw new BadRequestException('Tên đăng nhập phải có ít nhất 3 ký tự.');
      }
      account.username = cleanUsername;
    }

    if (isChangingPassword && data.newPassword) {
      if (data.newPassword.length < 6) {
        throw new BadRequestException('Mật khẩu mới phải có ít nhất 6 ký tự.');
      }
      account.password = data.newPassword;
    }

    if (data.displayName && data.displayName.trim()) {
      account.displayName = data.displayName.trim();
    }

    if (data.email !== undefined) {
      account.email = data.email.trim();
    }

    if (data.avatarUrl !== undefined) {
      account.avatarUrl = data.avatarUrl;
    }

    account.updatedAt = new Date().toISOString();
    this.logActivity(
      'ADMIN_UPDATE_PROFILE',
      `Tài khoản quản trị viên (${account.username}) đã cập nhật thông tin thành công`
    );
    this.saveToDisk();
    return this.getAdminProfile();
  }

  public adminForceReleaseSeat(seatId: number) {
    const seat = this.state.seats.find((s) => s.id === seatId);
    if (seat) {
      const prevName = seat.occupant?.displayName;
      seat.status = 'EMPTY';
      seat.occupant = null;
      this.logActivity(
        'ADMIN_RELEASE_SEAT',
        `Admin đã giải phóng Tọa cụ #${seat.code}${prevName ? ` (đạo hữu ${prevName})` : ''}`
      );
      this.saveToDisk();
    }
    return seat;
  }

  public adminToggleSeatEnabled(seatId: number, isEnabled: boolean) {
    const seat = this.state.seats.find((s) => s.id === seatId);
    if (seat) {
      seat.isEnabled = isEnabled;
      if (!isEnabled) {
        seat.status = 'EMPTY';
        seat.occupant = null;
      }
      this.logActivity(
        'ADMIN_TOGGLE_SEAT',
        `Admin ${isEnabled ? 'bật' : 'tắt'} Tọa cụ #${seat.code}`
      );
      this.saveToDisk();
    }
    return seat;
  }

  public adminUpdateUserStatus(
    userId: string,
    status: 'ACTIVE' | 'RESTRICTED' | 'BANNED',
    reason?: string
  ) {
    const user = this.state.users.find((u) => u.id === userId);
    if (user) {
      user.status = status;
      user.restrictionReason = reason || '';
      if (status !== 'ACTIVE') {
        for (const s of this.state.seats) {
          if (s.occupant?.userId === user.id) {
            s.status = 'EMPTY';
            s.occupant = null;
          }
        }
      }
      this.logActivity(
        'ADMIN_USER_STATUS',
        `Admin cập nhật trạng thái người dùng ${user.displayName} -> ${status}`
      );
      this.saveToDisk();
    }
    return user;
  }

  public adminUpsertAudioTrack(trackDto: Partial<AudioTrackRecord>) {
    if (trackDto.id) {
      const existing = this.state.audioTracks.find((t) => t.id === trackDto.id);
      if (existing) {
        Object.assign(existing, trackDto);
        this.saveToDisk();
        return existing;
      }
    }
    const created: AudioTrackRecord = {
      id: uuidv4(),
      title: trackDto.title || 'Âm thanh Thiền mới',
      description: trackDto.description || '',
      category: trackDto.category || 'NHAC_THIEN',
      fileUrl: trackDto.fileUrl || '',
      durationSeconds: Number(trackDto.durationSeconds) || 300,
      sortOrder: Number(trackDto.sortOrder) || this.state.audioTracks.length + 1,
      isEnabled: trackDto.isEnabled !== undefined ? trackDto.isEnabled : true,
      isAmbientBg: Boolean(trackDto.isAmbientBg),
    };
    this.state.audioTracks.push(created);
    this.logActivity('ADMIN_AUDIO_ADD', `Admin thêm bài nhạc: ${created.title}`);
    this.saveToDisk();
    return created;
  }

  public adminDeleteAudioTrack(trackId: string) {
    this.state.audioTracks = this.state.audioTracks.filter((t) => t.id !== trackId);
    this.saveToDisk();
    return { deleted: true };
  }

  public adminUpsertSchedule(schedDto: Partial<AudioScheduleRecord>) {
    const startTime = schedDto.startTime || '05:00';
    let endTime = schedDto.endTime || '';
    let durationMinutes = Number(schedDto.durationMinutes) || 0;

    if (startTime && endTime) {
      const [sH, sM] = startTime.split(':').map(Number);
      const [eH, eM] = endTime.split(':').map(Number);
      const startMin = (sH || 0) * 60 + (sM || 0);
      let endMin = (eH || 0) * 60 + (eM || 0);
      if (endMin <= startMin) {
        endMin += 24 * 60;
      }
      durationMinutes = endMin - startMin;
    } else if (startTime && durationMinutes > 0 && !endTime) {
      const [sH, sM] = startTime.split(':').map(Number);
      const totalEnd = ((sH || 0) * 60 + (sM || 0) + durationMinutes) % (24 * 60);
      const eH = String(Math.floor(totalEnd / 60)).padStart(2, '0');
      const eM = String(totalEnd % 60).padStart(2, '0');
      endTime = `${eH}:${eM}`;
    }

    if (schedDto.id) {
      const existing = this.state.audioSchedules.find((s) => s.id === schedDto.id);
      if (existing) {
        Object.assign(existing, {
          ...schedDto,
          startTime,
          endTime,
          durationMinutes: durationMinutes || existing.durationMinutes,
        });
        this.saveToDisk();
        return existing;
      }
    }
    const created: AudioScheduleRecord = {
      id: uuidv4(),
      name: schedDto.name || `Khung giờ ${startTime} - ${endTime || '30 phút'}`,
      trackId: schedDto.trackId || (this.state.audioTracks[0]?.id ?? null),
      playlistId: schedDto.playlistId || null,
      startTime,
      endTime,
      durationMinutes: durationMinutes || 30,
      sortOrder: Number(schedDto.sortOrder) || this.state.audioSchedules.length + 1,
      isRepeatDaily: schedDto.isRepeatDaily !== undefined ? schedDto.isRepeatDaily : true,
      gapSeconds: Number(schedDto.gapSeconds) || 5,
      isEnabled: schedDto.isEnabled !== undefined ? schedDto.isEnabled : true,
    };
    this.state.audioSchedules.push(created);
    this.logActivity(
      'ADMIN_SCHEDULE_ADD',
      `Admin cập nhật lịch phát: ${created.startTime} -> ${created.endTime} (${created.name})`
    );
    this.saveToDisk();
    return created;
  }

  public adminDeleteSchedule(scheduleId: string) {
    this.state.audioSchedules = this.state.audioSchedules.filter((s) => s.id !== scheduleId);
    this.saveToDisk();
    return { deleted: true };
  }

  public adminUpdateSettings(newSettings: Partial<typeof this.state.settings>) {
    this.state.settings = {
      ...this.state.settings,
      ...newSettings,
    };
    // Apply activeSeatCount if modified
    if (newSettings.activeSeatCount !== undefined) {
      const count = Math.max(1, Math.min(50, Number(newSettings.activeSeatCount)));
      this.state.seats.forEach((seat) => {
        seat.isEnabled = seat.id <= count;
      });
    }
    this.logActivity('ADMIN_SETTINGS_UPDATE', 'Admin cập nhật cấu hình hệ thống Thiền Viên');
    this.saveToDisk();
    return this.state.settings;
  }

  // ============================================================================
  // ANNOUNCEMENTS MANAGEMENT
  // ============================================================================
  public getActiveAnnouncements(): SanctuaryAnnouncementRecord[] {
    if (!this.state.announcements || !Array.isArray(this.state.announcements)) {
      return [];
    }
    const now = new Date();
    const nowMs = now.getTime();

    return this.state.announcements.filter((ann) => {
      if (!ann.isEnabled) return false;
      const startMs = new Date(ann.startTime).getTime();
      const endMs = new Date(ann.endTime).getTime();
      if (isNaN(startMs) || isNaN(endMs)) return false;
      return nowMs >= startMs && nowMs <= endMs;
    });
  }

  public adminUpsertAnnouncement(dto: Partial<SanctuaryAnnouncementRecord>) {
    if (!this.state.announcements) this.state.announcements = [];
    if (dto.id) {
      const existing = this.state.announcements.find((a) => a.id === dto.id);
      if (existing) {
        Object.assign(existing, dto);
        this.saveToDisk();
        return existing;
      }
    }
    const created: SanctuaryAnnouncementRecord = {
      id: uuidv4(),
      title: dto.title || 'Thông báo Thiền Viện',
      content: dto.content || '',
      type: dto.type || 'INFO',
      startTime: dto.startTime || new Date().toISOString().slice(0, 16),
      endTime: dto.endTime || new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      isMarquee: dto.isMarquee !== undefined ? dto.isMarquee : true,
      scrollSpeed: dto.scrollSpeed || 'NORMAL',
      repeatIntervalMinutes: Number(dto.repeatIntervalMinutes) || 0,
      durationDisplaySeconds: Number(dto.durationDisplaySeconds) || 30,
      isEnabled: dto.isEnabled !== undefined ? dto.isEnabled : true,
      createdAt: new Date().toISOString(),
    };
    this.state.announcements.unshift(created);
    this.logActivity('ADMIN_ANNOUNCEMENT_ADD', `Admin thêm thông báo: ${created.content.slice(0, 35)}...`);
    this.saveToDisk();
    return created;
  }

  public adminDeleteAnnouncement(id: string) {
    if (!this.state.announcements) return { deleted: false };
    this.state.announcements = this.state.announcements.filter((a) => a.id !== id);
    this.logActivity('ADMIN_ANNOUNCEMENT_DELETE', `Admin xóa thông báo #${id}`);
    this.saveToDisk();
    return { deleted: true };
  }

  public adminToggleAnnouncement(id: string) {
    if (!this.state.announcements) return null;
    const item = this.state.announcements.find((a) => a.id === id);
    if (item) {
      item.isEnabled = !item.isEnabled;
      this.saveToDisk();
      return item;
    }
    return null;
  }
}
