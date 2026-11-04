import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useSanctuaryStore } from './store/useSanctuaryStore';
import { ForestEnvironment } from './components/sanctuary/ForestEnvironment';
import { TopStatusBar } from './components/hud/TopStatusBar';
import { WelcomeModal } from './components/hud/WelcomeModal';
import { SeatActionModal } from './components/hud/SeatActionModal';
import { ActiveMeditationHUD } from './components/hud/ActiveMeditationHUD';
import { AudioPlayerBar } from './components/hud/AudioPlayerBar';
import { UserProfileDrawer } from './components/hud/UserProfileDrawer';
import { ZenAnnouncementBanner } from './components/hud/ZenAnnouncementBanner';
import { AdminCenterPage } from './components/admin/AdminCenterPage';
import { apiRequest, socketService } from './services/api';
import { soundEngine } from './services/soundEngine';
import {
  SanctuarySeat,
  AudioTrackItem,
  AudioScheduleItem,
  SanctuaryAnnouncement,
  UserProfile,
  PointHistoryItem,
  LeaderboardEntry,
} from './types/sanctuary';
import { Sparkles } from 'lucide-react';

const SanctuaryMainView: React.FC = () => {
  const {
    user,
    seats,
    stats,
    settings,
    selectedSeat,
    activeActivity,
    pointHistory,
    leaderboard,
    syncedAudio,
    lastBowCompletedAtMs,
    notification,
    setUser,
    setSeats,
    updateSingleSeat,
    setStats,
    setSettings,
    setSelectedSeat,
    setActiveActivity,
    updateActiveActivity,
    setPointHistory,
    setLeaderboard,
    setSyncedAudio,
    setLastBowCompletedAtMs,
    showNotification,
  } = useSanctuaryStore();

  const [audioTracks, setAudioTracks] = useState<AudioTrackItem[]>([
    {
      id: 'track-suoi-rung',
      title: 'Tiếng Suối Rừng Đại Thụ & Hơi Thở Tự Nhiên',
      category: 'TIENG_SUOI',
      fileUrl: '',
      durationSeconds: 1800,
      sortOrder: 1,
      isEnabled: true,
      isAmbientBg: true,
    },
  ]);

  const [cooldownRemainingSec, setCooldownRemainingSec] = useState(0);
  const [audioSchedules, setAudioSchedules] = useState<AudioScheduleItem[]>([]);
  const [announcements, setAnnouncements] = useState<SanctuaryAnnouncement[]>([]);

  // 0. Auto-Resume Practitioner Identity & History from LocalStorage (Không cần login tài khoản)
  useEffect(() => {
    const rawSaved = localStorage.getItem('thien_vien_user_data');
    if (rawSaved) {
      try {
        const saved = JSON.parse(rawSaved);
        if (saved?.id && saved?.displayName) {
          setUser(saved);
          const rawHistory = localStorage.getItem('thien_vien_point_history');
          if (rawHistory) {
            try {
              setPointHistory(JSON.parse(rawHistory));
            } catch {}
          }
          // Sync with backend to reconnect user and restore up-to-date points & status
          apiRequest<{ user: UserProfile; allocatedSeat?: SanctuarySeat }>('/api/sessions/enter', {
            method: 'POST',
            body: JSON.stringify({
              displayName: saved.displayName,
              avatarStyle: saved.avatarStyle || 'monastic_brown',
              existingUserId: saved.id,
            }),
          })
            .then((res) => {
              if (res.user) {
                setUser(res.user);
                localStorage.setItem('thien_vien_user_data', JSON.stringify(res.user));
                refreshUserProfile(res.user.id);
              }
              if (res.allocatedSeat) {
                updateSingleSeat(res.allocatedSeat);
              }
            })
            .catch(() => {
              refreshUserProfile(saved.id);
            });
        }
      } catch {}
    }
  }, []);

  // Connect Socket.IO & Initial State
  useEffect(() => {
    apiRequest<{
      seats: SanctuarySeat[];
      stats: any;
      settings: any;
      syncedAudio: any;
      audioTracks: AudioTrackItem[];
      audioSchedules?: AudioScheduleItem[];
      announcements?: SanctuaryAnnouncement[];
    }>('/api/sanctuary/state')
      .then((res) => {
        if (res.seats) setSeats(res.seats);
        if (res.stats) setStats(res.stats);
        if (res.settings) setSettings(res.settings);
        if (res.syncedAudio) setSyncedAudio(res.syncedAudio);
        if (res.audioTracks) setAudioTracks(res.audioTracks);
        if (res.audioSchedules) setAudioSchedules(res.audioSchedules);
        if (res.announcements) setAnnouncements(res.announcements);
      })
      .catch(() => {
        // Fallback if backend is starting
      });

    socketService.connect(user?.id, {
      onInit: (payload) => {
        if (payload.seats) setSeats(payload.seats);
        if (payload.stats) setStats(payload.stats);
        if (payload.settings) setSettings(payload.settings);
        if (payload.syncedAudio) setSyncedAudio(payload.syncedAudio);
        if (payload.audioTracks) setAudioTracks(payload.audioTracks);
        if (payload.audioSchedules) setAudioSchedules(payload.audioSchedules);
        if (payload.announcements) setAnnouncements(payload.announcements);
      },
      onSeatUpdated: (payload) => {
        if (payload.seat) updateSingleSeat(payload.seat);
        if (payload.stats) setStats(payload.stats);
      },
      onStats: (liveStats) => {
        if (liveStats) setStats(liveStats);
      },
      onAudioSync: (synced) => {
        if (synced) setSyncedAudio(synced);
      },
      onAnnouncements: (anns) => {
        if (anns) setAnnouncements(anns);
      },
    });

    return () => {
      socketService.disconnect();
    };
  }, [user?.id]);

  // Real-time synchronization polling backup (guarantees presence even across proxy drops)
  useEffect(() => {
    const syncInterval = setInterval(async () => {
      try {
        const stateRes = await apiRequest<{
          seats: SanctuarySeat[];
          stats: any;
        }>('/api/sanctuary/state');
        if (stateRes?.seats) {
          setSeats(stateRes.seats);
        }
        if (stateRes?.stats) {
          setStats(stateRes.stats);
        }
      } catch {
        // network silent
      }
    }, 4000);
    return () => clearInterval(syncInterval);
  }, []);

  // Bowing Cooldown Timer
  useEffect(() => {
    const timer = setInterval(() => {
      if (!lastBowCompletedAtMs) {
        setCooldownRemainingSec(0);
        return;
      }
      const cooldownMs = (settings.bowCooldownSeconds || 15) * 1000;
      const diffSec = Math.ceil((lastBowCompletedAtMs + cooldownMs - Date.now()) / 1000);
      setCooldownRemainingSec(Math.max(0, diffSec));
    }, 1000);
    return () => clearInterval(timer);
  }, [lastBowCompletedAtMs, settings.bowCooldownSeconds]);

  // Refresh User Profile & Leaderboard
  const refreshUserProfile = async (targetUserId?: string) => {
    const uid = targetUserId || user?.id;
    if (!uid) return;
    try {
      const res = await apiRequest<{
        user: UserProfile | null;
        history: PointHistoryItem[];
        leaderboard: LeaderboardEntry[];
      }>(`/api/users/${uid}/profile`);
      if (res.user) {
        setUser(res.user);
        localStorage.setItem('thien_vien_user_data', JSON.stringify(res.user));
      }
      if (res.history) {
        setPointHistory(res.history);
        localStorage.setItem('thien_vien_point_history', JSON.stringify(res.history));
      }
      if (res.leaderboard) setLeaderboard(res.leaderboard);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (user?.id) {
      refreshUserProfile(user.id);
    }
  }, [user?.id]);

  // Handle Enter Sanctuary (Welcome Screen)
  const handleEnterSanctuary = async (displayName: string, avatarStyle: string) => {
    const res = await apiRequest<{ user: UserProfile; allocatedSeat?: SanctuarySeat }>('/api/sessions/enter', {
      method: 'POST',
      body: JSON.stringify({
        displayName,
        avatarStyle,
        existingUserId: user?.id,
      }),
    });
    setUser(res.user);
    if (res.allocatedSeat) {
      updateSingleSeat(res.allocatedSeat);
    }
    localStorage.setItem('thien_vien_user_data', JSON.stringify(res.user));
    soundEngine.playMindfulnessBell(0.35);
    showNotification(
      `Chào mừng đạo hữu ${res.user.displayName} bước vào Không gian Thiền Viên.`,
      'info'
    );
    await refreshUserProfile(res.user.id);
  };

  // Start Bowing Ceremony (3 States: STANDING -> KNEELING -> BOWING)
  const handleStartBowing = async (_seat?: SanctuarySeat) => {
    if (!user) return;
    try {
      const res = await apiRequest<{
        seat: SanctuarySeat;
        vacatedSeats?: SanctuarySeat[];
        sessionId: string;
      }>('/api/seats/occupy', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          seatId: 0, // Auto-allocate random empty seat across Tả, Hữu, or Trục Trung Tâm
          activityType: 'BOWING',
        }),
      });

      if (res.vacatedSeats) {
        for (const vacated of res.vacatedSeats) {
          updateSingleSeat(vacated);
        }
      }
      if (res.seat) {
        updateSingleSeat(res.seat);
      }

      const allocatedSeat = res.seat;
      setSelectedSeat(null);
      soundEngine.playMindfulnessBell(0.4);

      setActiveActivity({
        seatId: allocatedSeat.id,
        seatCode: allocatedSeat.code,
        type: 'BOWING',
        sessionId: res.sessionId,
        startedAtMs: Date.now(),
        remainingSeconds: 6,
        bowingPose: 'STANDING',
        bowStep: 1,
      });

      // Step 2: Kneeling after 2s
      setTimeout(() => {
        updateActiveActivity({ bowingPose: 'KNEELING', bowStep: 2 });
        socketService.emitBowPose(user.id, allocatedSeat.id, 'KNEELING');
      }, 2000);

      // Step 3: Prostration/Bowing after 4s
      setTimeout(() => {
        updateActiveActivity({ bowingPose: 'BOWING', bowStep: 3 });
        socketService.emitBowPose(user.id, allocatedSeat.id, 'BOWING');
        soundEngine.playMindfulnessBell(0.35);
      }, 4000);

      // Complete Ceremony & Award Verified Points at 6.5s -> Tự động chuyển sang ngồi thiền
      setTimeout(async () => {
        try {
          const completeRes = await apiRequest<{
            user: UserProfile;
            pointsAwarded: number;
            nextActivity?: {
              sessionId: string;
              seatId: number;
              targetMinutes: number;
              type: 'MEDITATING';
            };
          }>('/api/activities/complete', {
            method: 'POST',
            body: JSON.stringify({
              userId: user.id,
              seatId: allocatedSeat.id,
              sessionId: res.sessionId,
              activityType: 'BOWING',
            }),
          });
          setUser(completeRes.user);
          setLastBowCompletedAtMs(Date.now());
          soundEngine.playMindfulnessBell(0.4);
          showNotification(
            `Đã viên mãn nghi thức đảnh lễ Thiền sư (+${completeRes.pointsAwarded} điểm an trú). Tự động an vị tĩnh tâm thiền định.`,
            'points'
          );

          // Tự động chuyển sang ngồi thiền trên cùng tọa cụ
          setActiveActivity({
            seatId: allocatedSeat.id,
            seatCode: allocatedSeat.code,
            type: 'MEDITATING',
            sessionId: completeRes.nextActivity?.sessionId || `med_${Date.now()}`,
            targetMinutes: 15,
            startedAtMs: Date.now(),
            remainingSeconds: 15 * 60,
          });

          refreshUserProfile(user.id);
        } catch (err) {
          setActiveActivity(null);
          showNotification((err as Error).message, 'warning');
        }
      }, 6500);
    } catch (err) {
      showNotification((err as Error).message, 'warning');
    }
  };

  // Start Meditation Session (5, 10, 15, 30 minutes)
  const handleStartMeditation = async (
    _seat: SanctuarySeat | null,
    durationMinutes: 5 | 10 | 15 | 30
  ) => {
    if (!user) return;
    try {
      const res = await apiRequest<{
        seat: SanctuarySeat;
        vacatedSeats?: SanctuarySeat[];
        sessionId: string;
      }>('/api/seats/occupy', {
        method: 'POST',
        body: JSON.stringify({
          userId: user.id,
          seatId: 0, // Auto-allocate random empty seat
          activityType: 'MEDITATING',
          targetMinutes: durationMinutes,
        }),
      });

      if (res.vacatedSeats) {
        for (const vacated of res.vacatedSeats) {
          updateSingleSeat(vacated);
        }
      }
      if (res.seat) {
        updateSingleSeat(res.seat);
      }

      const allocatedSeat = res.seat;
      setSelectedSeat(null);
      soundEngine.playMindfulnessBell(0.5);

      setActiveActivity({
        seatId: allocatedSeat.id,
        seatCode: allocatedSeat.code,
        type: 'MEDITATING',
        sessionId: res.sessionId,
        targetMinutes: durationMinutes,
        startedAtMs: Date.now(),
        remainingSeconds: durationMinutes * 60,
      });

      showNotification(
        `Đã an vị ngồi thiền ${durationMinutes} phút tại Tọa cụ #${allocatedSeat.code} (${allocatedSeat.zoneName}).`,
        'info'
      );
    } catch (err) {
      showNotification((err as Error).message, 'warning');
    }
  };

  // Meditation Countdown Tick & Completion Verification
  useEffect(() => {
    if (!activeActivity || activeActivity.type !== 'MEDITATING' || !user) return;

    const interval = setInterval(() => {
      const elapsedSec = Math.floor((Date.now() - activeActivity.startedAtMs) / 1000);
      const totalSec = (activeActivity.targetMinutes || 10) * 60;
      const remaining = Math.max(0, totalSec - elapsedSec);

      updateActiveActivity({ remainingSeconds: remaining });

      if (remaining <= 0) {
        clearInterval(interval);
        soundEngine.playMindfulnessBell(0.6);

        apiRequest<{
          user: UserProfile;
          pointsAwarded: number;
          nextActivity?: {
            sessionId: string;
            seatId: number;
            targetMinutes: number;
          };
        }>(
          '/api/activities/complete',
          {
            method: 'POST',
            body: JSON.stringify({
              userId: user.id,
              seatId: activeActivity.seatId,
              sessionId: activeActivity.sessionId,
              activityType: 'MEDITATING',
            }),
          }
        )
          .then((res) => {
            setUser(res.user);
            const prevMinutes = activeActivity.targetMinutes || 10;
            const newTargetMinutes = res.nextActivity?.targetMinutes || (prevMinutes + 10);
            const additionalSec = (newTargetMinutes - prevMinutes) * 60;

            showNotification(
              `Hoàn mãn ${prevMinutes} phút thiền định (+${res.pointsAwarded} điểm). Tiếp tục an trú thiền định (Mốc tiếp theo: ${newTargetMinutes} phút).`,
              'points'
            );

            // Tiếp tục an tọa thiền định và cộng dồn thời gian mà không bị đẩy ra ngoài
            setActiveActivity({
              ...activeActivity,
              sessionId: res.nextActivity?.sessionId || `med_${Date.now()}`,
              startedAtMs: Date.now(),
              targetMinutes: newTargetMinutes,
              remainingSeconds: additionalSec,
            });

            refreshUserProfile(user.id);
          })
          .catch((err) => {
            showNotification((err as Error).message, 'warning');
          });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeActivity?.sessionId, activeActivity?.type, user?.id]);

  // Leave Seat Early
  const handleLeaveSeat = async () => {
    if (!user) return;
    await apiRequest('/api/seats/leave', {
      method: 'POST',
      body: JSON.stringify({ userId: user.id }),
    });
    setActiveActivity(null);
    setSelectedSeat(null);
    showNotification('Bạn đã xả thiền và nhường lại vị trí tọa cụ.', 'info');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden">
      {/* 1. Full-screen 2.5D Ancient Forest Sanctuary */}
      <ForestEnvironment
        seats={seats}
        currentUserId={user?.id}
        selectedSeatId={selectedSeat?.id}
        backgroundUrl={settings.backgroundUrl}
        zenMasterUrl={settings.zenMasterUrl}
        enableNatureAnimations={settings.enableNatureAnimations}
        onSelectSeat={(seat) => setSelectedSeat(seat)}
      />

      {/* 2. Top Minimalist Status Bar */}
      <TopStatusBar sanctuaryName={settings.sanctuaryName} stats={stats} />

      {/* Floating Zen Announcement Banner (Realtime, Marquee & Intervals) */}
      <ZenAnnouncementBanner announcements={announcements} />

      {/* 3. Active Meditation / Bowing Subtle HUD */}
      <AnimatePresence>
        {activeActivity && (
          <ActiveMeditationHUD
            seatCode={activeActivity.seatCode}
            activityType={activeActivity.type}
            targetMinutes={activeActivity.targetMinutes}
            remainingSeconds={activeActivity.remainingSeconds}
            bowingPose={activeActivity.bowingPose}
            bowStep={activeActivity.bowStep}
            onStopEarly={handleLeaveSeat}
          />
        )}
      </AnimatePresence>

      {/* 4. Serene Notification Toast */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
          >
            <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl sanctuary-glass shadow-2xl text-xs text-[#fff6dc]">
              <Sparkles className="w-4 h-4 text-[#d9a75a] shrink-0" />
              <span>{notification.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 5. Bottom Left Synchronized Audio Player */}
      <AudioPlayerBar
        syncedAudio={syncedAudio}
        tracks={audioTracks}
        schedules={audioSchedules}
        onSelectLocalTrack={(track) =>
          setSyncedAudio({
            ...syncedAudio,
            currentTrack: track,
            offsetSeconds: 0,
            serverTimestamp: Date.now(),
          })
        }
      />

      {/* 6. Bottom Right Practitioner Profile & Points */}
      {user && (
        <UserProfileDrawer
          user={user}
          pointHistory={pointHistory}
          leaderboard={leaderboard}
          onRefreshData={() => refreshUserProfile(user.id)}
          onChangeNameOrLogout={() => {
            handleLeaveSeat();
            localStorage.removeItem('thien_vien_user_data');
            localStorage.removeItem('thien_vien_point_history');
            setUser(null);
          }}
        />
      )}

      {/* Floating Quick Meditation Button (Tự động sắp xếp ngẫu nhiên) */}
      {user && !activeActivity && (
        <div className="fixed bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 z-30 pointer-events-auto whitespace-nowrap">
          <motion.button
            type="button"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              const emptySeats = seats.filter((s) => s.isEnabled && s.status === 'EMPTY');
              const seedSeat = emptySeats.length > 0 ? emptySeats[0] : seats[0];
              setSelectedSeat(seedSeat);
            }}
            className="px-5 sm:px-6 py-2.5 rounded-full bg-gradient-to-r from-[#b8863b] via-[#d9a75a] to-[#b8863b] text-[#111d13] font-semibold text-xs tracking-wide shadow-[0_8px_25px_rgba(217,167,90,0.55)] border border-[#fff2cb]/70 flex items-center gap-2 hover:brightness-110 transition-all cursor-pointer ring-2 ring-[#d9a75a]/30"
          >
            <Sparkles className="w-4 h-4 text-[#442b00] animate-pulse" />
            <span>Vào Tọa Thiền<span className="hidden sm:inline"> (An vị ngẫu nhiên)</span></span>
          </motion.button>
        </div>
      )}

      {/* 7. Seat Selection Modal (When clicking one of the 50 seats) */}
      <AnimatePresence>
        {selectedSeat && user && (
          <SeatActionModal
            seat={
              seats.find((s) => s.id === selectedSeat.id) || selectedSeat
            }
            currentUserId={user.id}
            settings={settings}
            cooldownRemainingSec={cooldownRemainingSec}
            onClose={() => setSelectedSeat(null)}
            onStartBowing={handleStartBowing}
            onStartMeditation={handleStartMeditation}
            onLeaveSeat={handleLeaveSeat}
          />
        )}
      </AnimatePresence>

      {/* 8. Welcome Screen on First Visit */}
      {!user && (
        <WelcomeModal
          welcomeTitle={settings.welcomeTitle}
          welcomeMessage={settings.welcomeMessage}
          onEnterSanctuary={handleEnterSanctuary}
        />
      )}
    </div>
  );
};

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SanctuaryMainView />} />
        <Route path="/admin" element={<AdminCenterPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
