import { create } from 'zustand';
import { INITIAL_SEAT_LAYOUT } from '../config/seatLayout';
import {
  SanctuarySeat,
  SanctuaryStats,
  UserProfile,
  PointHistoryItem,
  LeaderboardEntry,
  SyncedAudioState,
  SystemSettingsConfig,
  BowingPose,
} from '../types/sanctuary';

interface ActiveActivityState {
  seatId: number;
  seatCode: string;
  type: 'MEDITATING' | 'BOWING';
  sessionId?: string;
  targetMinutes?: number;
  startedAtMs: number;
  remainingSeconds: number;
  bowingPose?: BowingPose;
  bowStep?: number; // 1: Đứng trang nghiêm, 2: Quỳ xuống, 3: Chắp tay cúi lạy
}

interface SanctuaryStore {
  user: UserProfile | null;
  seats: SanctuarySeat[];
  stats: SanctuaryStats;
  settings: SystemSettingsConfig;
  selectedSeat: SanctuarySeat | null;
  activeActivity: ActiveActivityState | null;
  pointHistory: PointHistoryItem[];
  leaderboard: LeaderboardEntry[];
  syncedAudio: SyncedAudioState;
  lastBowCompletedAtMs: number;
  notification: { message: string; type: 'info' | 'points' | 'warning' } | null;

  // Actions
  setUser: (user: UserProfile | null) => void;
  setSeats: (seats: SanctuarySeat[]) => void;
  updateSingleSeat: (seat: SanctuarySeat) => void;
  setStats: (stats: SanctuaryStats) => void;
  setSettings: (settings: Partial<SystemSettingsConfig>) => void;
  setSelectedSeat: (seat: SanctuarySeat | null) => void;
  setActiveActivity: (activity: ActiveActivityState | null) => void;
  updateActiveActivity: (partial: Partial<ActiveActivityState>) => void;
  setPointHistory: (items: PointHistoryItem[]) => void;
  setLeaderboard: (entries: LeaderboardEntry[]) => void;
  setSyncedAudio: (audio: SyncedAudioState) => void;
  setLastBowCompletedAtMs: (ts: number) => void;
  showNotification: (message: string, type?: 'info' | 'points' | 'warning') => void;
}

const DEFAULT_SETTINGS: SystemSettingsConfig = {
  sanctuaryName: 'THIỀN VIÊN – Không gian an trú',
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
  bowCooldownSeconds: 20,
  enableNatureAnimations: true,
};

const buildInitialSeats = (): SanctuarySeat[] =>
  INITIAL_SEAT_LAYOUT.map((cfg) => ({
    ...cfg,
    isEnabled: true,
    status: 'EMPTY',
    occupant: null,
  }));

const loadPersistedUser = (): UserProfile | null => {
  try {
    const raw =
      localStorage.getItem('thien_vien_user_data') ||
      localStorage.getItem('thien_vien_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const useSanctuaryStore = create<SanctuaryStore>((set) => ({
  user: loadPersistedUser(),
  seats: buildInitialSeats(),
  stats: {
    totalOnline: 1,
    meditatingCount: 0,
    bowingCount: 0,
    emptySeatsCount: 50,
    occupiedSeatsCount: 0,
  },
  settings: DEFAULT_SETTINGS,
  selectedSeat: null,
  activeActivity: null,
  pointHistory: [],
  leaderboard: [],
  syncedAudio: {
    currentTrack: {
      id: 'default-stream',
      title: 'Tiếng Suối Rừng Đại Thụ & Chuông Chánh Niệm',
      description: 'Âm thanh suối chảy tự nhiên hòa cùng tần số 432Hz an định tâm trí',
      category: 'TIENG_SUOI',
      fileUrl: '',
      durationSeconds: 1800,
      sortOrder: 1,
      isEnabled: true,
      isAmbientBg: true,
    },
    ambientTrack: null,
    scheduleName: 'Lịch phát Tĩnh Tâm Thường Nhật',
    offsetSeconds: 0,
    isPlaying: true,
    serverTimestamp: Date.now(),
  },
  lastBowCompletedAtMs: 0,
  notification: null,

  setUser: (user) => {
    try {
      if (user) {
        localStorage.setItem('thien_vien_user', JSON.stringify(user));
        localStorage.setItem('thien_vien_user_data', JSON.stringify(user));
      } else {
        localStorage.removeItem('thien_vien_user');
        localStorage.removeItem('thien_vien_user_data');
      }
    } catch {
      // ignore storage errors
    }
    set({ user });
  },

  setSeats: (seats) => set({ seats }),

  updateSingleSeat: (updatedSeat) =>
    set((state) => ({
      seats: state.seats.map((s) => {
        if (s.id === updatedSeat.id) {
          return updatedSeat;
        }
        // Đảm bảo 1 người dùng không bao giờ hiển thị trên nhiều tọa cụ cùng lúc
        if (
          updatedSeat.occupant?.userId &&
          s.occupant?.userId === updatedSeat.occupant.userId
        ) {
          return { ...s, status: 'EMPTY', occupant: null };
        }
        return s;
      }),
    })),

  setStats: (stats) => set({ stats }),

  setSettings: (newSettings) =>
    set((state) => ({
      settings: { ...state.settings, ...newSettings },
    })),

  setSelectedSeat: (selectedSeat) => set({ selectedSeat }),

  setActiveActivity: (activeActivity) => set({ activeActivity }),

  updateActiveActivity: (partial) =>
    set((state) => ({
      activeActivity: state.activeActivity
        ? { ...state.activeActivity, ...partial }
        : null,
    })),

  setPointHistory: (pointHistory) => set({ pointHistory }),

  setLeaderboard: (leaderboard) => set({ leaderboard }),

  setSyncedAudio: (syncedAudio) => set({ syncedAudio }),

  setLastBowCompletedAtMs: (lastBowCompletedAtMs) => set({ lastBowCompletedAtMs }),

  showNotification: (message, type = 'info') => {
    set({ notification: { message, type } });
    setTimeout(() => {
      set((state) =>
        state.notification?.message === message ? { notification: null } : {}
      );
    }, 4500);
  },
}));
