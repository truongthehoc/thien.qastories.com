import { SanctuaryService } from './sanctuary.service';
import { SanctuaryGateway } from './gateway/sanctuary.gateway';
export declare class SanctuaryController {
    private readonly sanctuaryService;
    private readonly gateway;
    constructor(sanctuaryService: SanctuaryService, gateway: SanctuaryGateway);
    getInitialState(): {
        seats: import("./sanctuary.service").SeatRecord[];
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
        syncedAudio: {
            currentTrack: import("./sanctuary.service").AudioTrackRecord;
            ambientTrack: import("./sanctuary.service").AudioTrackRecord;
            activeSchedule: import("./sanctuary.service").AudioScheduleRecord;
            isScheduled: boolean;
            scheduleName: string;
            offsetSeconds: number;
            isPlaying: boolean;
            serverTimestamp: number;
        };
        audioTracks: import("./sanctuary.service").AudioTrackRecord[];
        audioSchedules: import("./sanctuary.service").AudioScheduleRecord[];
        announcements: import("./sanctuary.service").SanctuaryAnnouncementRecord[];
    };
    getActiveAnnouncements(): {
        announcements: import("./sanctuary.service").SanctuaryAnnouncementRecord[];
    };
    enterSanctuary(body: {
        displayName: string;
        avatarStyle?: string;
        existingUserId?: string;
    }): Promise<{
        user: import("./sanctuary.service").UserRecord;
        allocatedSeat: import("./sanctuary.service").SeatRecord;
    }>;
    getUserProfile(userId: string): {
        user: import("./sanctuary.service").UserRecord;
        history: import("./sanctuary.service").PointTxRecord[];
        leaderboard: {
            userId: string;
            displayName: string;
            avatarStyle: string;
            totalPoints: number;
            totalMeditationMinutes: number;
            totalBowingCount: number;
        }[];
    };
    occupySeat(body: {
        userId: string;
        seatId?: number;
        activityType: 'MEDITATING' | 'BOWING';
        targetMinutes?: 5 | 10 | 15 | 30;
    }): Promise<{
        seat: import("./sanctuary.service").SeatRecord;
        vacatedSeats: import("./sanctuary.service").SeatRecord[];
        sessionId: string;
    }>;
    completeActivity(body: {
        userId: string;
        seatId: number;
        sessionId: string;
        activityType: 'MEDITATING' | 'BOWING';
    }): Promise<{
        user: import("./sanctuary.service").UserRecord;
        pointsAwarded: number;
        alreadyProcessed: boolean;
        seat?: undefined;
        transaction?: undefined;
        nextActivity?: undefined;
    } | {
        user: import("./sanctuary.service").UserRecord;
        seat: import("./sanctuary.service").SeatRecord;
        pointsAwarded: number;
        transaction: import("./sanctuary.service").PointTxRecord;
        nextActivity: {
            sessionId: string;
            seatId: number;
            targetMinutes: number;
            type: "MEDITATING";
        };
        alreadyProcessed?: undefined;
    }>;
    leaveSeat(body: {
        userId: string;
    }): Promise<{
        releasedCount: number;
    }>;
    getAdminDashboard(): {
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
        seats: import("./sanctuary.service").SeatRecord[];
        users: import("./sanctuary.service").UserRecord[];
        audioTracks: import("./sanctuary.service").AudioTrackRecord[];
        audioPlaylists: import("./sanctuary.service").AudioPlaylistRecord[];
        audioSchedules: import("./sanctuary.service").AudioScheduleRecord[];
        announcements: import("./sanctuary.service").SanctuaryAnnouncementRecord[];
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
        activityLogs: import("./sanctuary.service").ActivityLogRecord[];
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
    adminReleaseSeat(seatId: string): {
        seat: import("./sanctuary.service").SeatRecord;
    };
    adminToggleSeat(seatId: string, body: {
        isEnabled: boolean;
    }): {
        seat: import("./sanctuary.service").SeatRecord;
    };
    adminUpdateUserStatus(userId: string, body: {
        status: 'ACTIVE' | 'RESTRICTED' | 'BANNED';
        reason?: string;
    }): {
        user: import("./sanctuary.service").UserRecord;
    };
    adminLogin(body: {
        username?: string;
        password?: string;
    }): {
        ok: boolean;
        token: string;
        profile: {
            username: string;
            displayName: string;
            email: string;
            role: string;
            avatarUrl?: string;
            createdAt: string;
            updatedAt: string;
            lastLoginAt?: string;
        };
        expiresIn: number;
    };
    adminVerify(): {
        ok: boolean;
        valid: boolean;
        profile: {
            username: string;
            displayName: string;
            email: string;
            role: string;
            avatarUrl?: string;
            createdAt: string;
            updatedAt: string;
            lastLoginAt?: string;
        };
    };
    getAdminProfile(): {
        profile: {
            username: string;
            displayName: string;
            email: string;
            role: string;
            avatarUrl?: string;
            createdAt: string;
            updatedAt: string;
            lastLoginAt?: string;
        };
    };
    updateAdminProfile(body: {
        displayName?: string;
        email?: string;
        username?: string;
        currentPassword?: string;
        newPassword?: string;
        avatarUrl?: string;
    }): {
        ok: boolean;
        profile: {
            username: string;
            displayName: string;
            email: string;
            role: string;
            avatarUrl?: string;
            createdAt: string;
            updatedAt: string;
            lastLoginAt?: string;
        };
    };
    purgeTestData(): Promise<{
        success: boolean;
        message: string;
    }>;
    uploadAudioFile(file: Express.Multer.File, body: {
        title?: string;
        description?: string;
        category?: 'NHAC_THIEN' | 'TIENG_SUOI' | 'TIENG_MUA' | 'TIENG_CHUONG' | 'TUNG_KINH';
        durationSeconds?: string;
        isAmbientBg?: string;
    }): {
        track: import("./sanctuary.service").AudioTrackRecord;
    };
    uploadAudioChunk(file: Express.Multer.File, body: {
        uploadId: string;
        chunkIndex: string;
        totalChunks: string;
        fileName: string;
        title?: string;
        description?: string;
        category?: 'NHAC_THIEN' | 'TIENG_SUOI' | 'TIENG_MUA' | 'TIENG_CHUONG' | 'TUNG_KINH';
        durationSeconds?: string;
        isAmbientBg?: string;
    }): Promise<{
        ok: boolean;
        chunkIndex: number;
        totalChunks: number;
        track?: undefined;
    } | {
        track: import("./sanctuary.service").AudioTrackRecord;
        ok?: undefined;
        chunkIndex?: undefined;
        totalChunks?: undefined;
    }>;
    upsertAudioTrack(body: Record<string, unknown>): {
        track: import("./sanctuary.service").AudioTrackRecord;
    };
    deleteAudioTrack(trackId: string): {
        deleted: boolean;
    };
    upsertSchedule(body: Record<string, unknown>): {
        schedule: import("./sanctuary.service").AudioScheduleRecord;
    };
    deleteSchedule(scheduleId: string): {
        deleted: boolean;
    };
    updateSettings(body: Record<string, unknown>): {
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
    };
    uploadCharacterImage(file: Express.Multer.File, body: {
        characterType: 'zenMaster' | 'practitionerRight' | 'practitionerLeft' | 'practitionerCenter';
    }): {
        success: boolean;
        fileUrl: string;
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
    };
    getAdminAnnouncements(): {
        announcements: import("./sanctuary.service").SanctuaryAnnouncementRecord[];
    };
    upsertAnnouncement(body: any): {
        announcement: import("./sanctuary.service").SanctuaryAnnouncementRecord;
    };
    deleteAnnouncement(id: string): {
        deleted: boolean;
    };
    toggleAnnouncement(id: string): {
        announcement: import("./sanctuary.service").SanctuaryAnnouncementRecord;
    };
}
