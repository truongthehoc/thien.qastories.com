import { OnModuleInit } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
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
    startTime: string;
    endTime?: string;
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
export declare class SanctuaryService implements OnModuleInit {
    private readonly prisma;
    private readonly logger;
    private readonly dbFilePath;
    private mutexPromise;
    private onlineConnections;
    state: {
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
    constructor(prisma: PrismaService);
    onModuleInit(): void;
    private runInTransaction;
    private initDefaultState;
    private loadFromDisk;
    saveToDisk(): void;
    private logActivity;
    enterSanctuary(displayName: string, avatarStyle: string, existingUserId?: string): Promise<UserRecord>;
    occupySeatForActivity(params: {
        userId: string;
        seatId?: number;
        activityType: 'MEDITATING' | 'BOWING';
        targetMinutes?: 5 | 10 | 15 | 30;
    }): Promise<{
        seat: SeatRecord;
        vacatedSeats: SeatRecord[];
        sessionId: string;
    }>;
    updateBowingPose(userId: string, seatId: number, pose: 'STANDING' | 'KNEELING' | 'BOWING'): SeatRecord;
    completeActivityAndAwardPoints(params: {
        userId: string;
        seatId: number;
        sessionId: string;
        activityType: 'MEDITATING' | 'BOWING';
    }): Promise<{
        user: UserRecord;
        pointsAwarded: number;
        alreadyProcessed: boolean;
        seat?: undefined;
        transaction?: undefined;
    } | {
        user: UserRecord;
        seat: SeatRecord;
        pointsAwarded: number;
        transaction: PointTxRecord;
        alreadyProcessed?: undefined;
    }>;
    releaseSeatByUser(userId: string, reason?: string): Promise<SeatRecord[]>;
    registerSocketHeartbeat(socketId: string, userId?: string): void;
    removeSocket(socketId: string): string;
    cleanupExpiredHeartbeats(): SeatRecord[];
    getLiveStats(): {
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
    getSyncedAudioState(): {
        currentTrack: AudioTrackRecord;
        ambientTrack: AudioTrackRecord;
        activeSchedule: AudioScheduleRecord;
        isScheduled: boolean;
        scheduleName: string;
        offsetSeconds: number;
        isPlaying: boolean;
        serverTimestamp: number;
    };
    getUserDetails(userId: string): {
        user: UserRecord;
        history: PointTxRecord[];
        leaderboard: {
            userId: string;
            displayName: string;
            avatarStyle: string;
            totalPoints: number;
            totalMeditationMinutes: number;
            totalBowingCount: number;
        }[];
    };
    getAdminDashboardData(): {
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
        seats: SeatRecord[];
        users: UserRecord[];
        audioTracks: AudioTrackRecord[];
        audioPlaylists: AudioPlaylistRecord[];
        audioSchedules: AudioScheduleRecord[];
        announcements: SanctuaryAnnouncementRecord[];
        adminProfile: {
            username: string;
            displayName: string;
            email: string;
            role: string;
            avatarUrl?: string;
            createdAt: string;
            updatedAt: string;
            lastLoginAt?: string;
        };
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
        charts: {
            dailyActivity: {
                day: string;
                minutes: number;
                bows: number;
                participants: number;
            }[];
            peakHours: {
                hour: string;
                count: number;
            }[];
        };
    };
    getAdminAccount(): AdminAccountRecord;
    getAdminProfile(): {
        username: string;
        displayName: string;
        email: string;
        role: string;
        avatarUrl?: string;
        createdAt: string;
        updatedAt: string;
        lastLoginAt?: string;
    };
    recordAdminLogin(username: string): void;
    updateAdminProfile(data: {
        displayName?: string;
        email?: string;
        username?: string;
        currentPassword?: string;
        newPassword?: string;
        avatarUrl?: string;
    }): {
        username: string;
        displayName: string;
        email: string;
        role: string;
        avatarUrl?: string;
        createdAt: string;
        updatedAt: string;
        lastLoginAt?: string;
    };
    adminForceReleaseSeat(seatId: number): SeatRecord;
    adminToggleSeatEnabled(seatId: number, isEnabled: boolean): SeatRecord;
    adminUpdateUserStatus(userId: string, status: 'ACTIVE' | 'RESTRICTED' | 'BANNED', reason?: string): UserRecord;
    adminUpsertAudioTrack(trackDto: Partial<AudioTrackRecord>): AudioTrackRecord;
    adminDeleteAudioTrack(trackId: string): {
        deleted: boolean;
    };
    adminUpsertSchedule(schedDto: Partial<AudioScheduleRecord>): AudioScheduleRecord;
    adminDeleteSchedule(scheduleId: string): {
        deleted: boolean;
    };
    adminUpdateSettings(newSettings: Partial<typeof this.state.settings>): {
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
    getActiveAnnouncements(): SanctuaryAnnouncementRecord[];
    adminUpsertAnnouncement(dto: Partial<SanctuaryAnnouncementRecord>): SanctuaryAnnouncementRecord;
    adminDeleteAnnouncement(id: string): {
        deleted: boolean;
    };
    adminToggleAnnouncement(id: string): SanctuaryAnnouncementRecord;
}
