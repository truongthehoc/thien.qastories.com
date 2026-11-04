export type SeatStatus = 'EMPTY' | 'MEDITATING' | 'BOWING';

export type BowingPose = 'STANDING' | 'KNEELING' | 'BOWING';

export interface SeatOccupant {
  userId: string;
  displayName: string;
  avatarStyle: string;
  activityType: 'MEDITATING' | 'BOWING';
  bowingPose?: BowingPose;
  targetMinutes?: number;
  startedAt: string;
  expectedEndAt?: string;
}

export interface SanctuarySeat {
  id: number;
  code: string;
  zoneName: string;
  ringIndex: 1 | 2 | 3 | 4;
  posX: number;
  posY: number;
  scale: number;
  isEnabled: boolean;
  status: SeatStatus;
  occupant: SeatOccupant | null;
}

export interface SanctuaryStats {
  totalOnline: number;
  meditatingCount: number;
  bowingCount: number;
  emptySeatsCount: number;
  occupiedSeatsCount: number;
  totalVisitsToday?: number;
  totalMeditationMinutes?: number;
  totalBows?: number;
  totalPointsAwarded?: number;
}

export interface UserProfile {
  id: string;
  displayName: string;
  avatarStyle: string;
  sessionToken: string;
  status: string;
  totalPoints: number;
  totalMeditationMinutes: number;
  totalMeditationCount: number;
  totalBowingCount: number;
  streakDays: number;
}

export interface PointHistoryItem {
  id: string;
  activityType: string;
  points: number;
  description: string;
  createdAt: string;
}

export interface LeaderboardEntry {
  userId: string;
  displayName: string;
  avatarStyle: string;
  totalPoints: number;
  totalMeditationMinutes: number;
  totalBowingCount: number;
}

export interface AudioTrackItem {
  id: string;
  title: string;
  description?: string;
  category: 'NHAC_THIEN' | 'TIENG_SUOI' | 'TIENG_MUA' | 'TIENG_CHUONG' | 'TUNG_KINH';
  fileUrl: string;
  durationSeconds: number;
  sortOrder: number;
  isEnabled: boolean;
  isAmbientBg: boolean;
}

export interface AudioScheduleItem {
  id: string;
  name: string;
  trackId?: string | null;
  playlistId?: string | null;
  startTime: string; // "HH:mm"
  endTime?: string;   // "HH:mm"
  durationMinutes: number;
  sortOrder: number;
  isRepeatDaily: boolean;
  gapSeconds: number;
  isEnabled: boolean;
  track?: AudioTrackItem | null;
}

export interface SyncedAudioState {
  currentTrack: AudioTrackItem | null;
  ambientTrack: AudioTrackItem | null;
  activeSchedule?: AudioScheduleItem | null;
  isScheduled?: boolean;
  scheduleName: string;
  offsetSeconds: number;
  isPlaying: boolean;
  serverTimestamp: number;
}

export interface SystemSettingsConfig {
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
}

export interface SanctuaryAnnouncement {
  id: string;
  title?: string;
  content: string;
  type: 'INFO' | 'EVENT' | 'REMINDER';
  startTime: string;
  endTime: string;
  isMarquee: boolean;
  scrollSpeed: 'SLOW' | 'NORMAL' | 'FAST';
  repeatIntervalMinutes: number; // 0 = continuous, >0 = every X minutes
  durationDisplaySeconds?: number;
  isEnabled: boolean;
  createdAt: string;
}

export interface AdminAccountProfile {
  username: string;
  displayName: string;
  email: string;
  role: string;
  avatarUrl?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}
