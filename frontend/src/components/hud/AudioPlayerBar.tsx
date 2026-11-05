import React, { useEffect, useRef, useState } from 'react';
import { SyncedAudioState, AudioTrackItem, AudioScheduleItem } from '../../types/sanctuary';
import { soundEngine } from '../../services/soundEngine';
import {
  Volume2,
  VolumeX,
  Clock,
  X,
  Radio,
  Sparkles,
  Music,
} from 'lucide-react';

interface AudioPlayerBarProps {
  syncedAudio: SyncedAudioState;
  tracks: AudioTrackItem[];
  schedules?: AudioScheduleItem[];
  onSelectLocalTrack?: (track: AudioTrackItem) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  TIENG_SUOI: 'Tiếng suối rừng',
  NHAC_THIEN: 'Nhạc thiền định',
  TIENG_MUA: 'Tiếng mưa rừng',
  TIENG_CHUONG: 'Tiếng chuông chùa',
  TUNG_KINH: 'Tụng kinh an trú',
};

export const AudioPlayerBar: React.FC<AudioPlayerBarProps> = ({
  syncedAudio,
  tracks,
  schedules = [],
}) => {
  const [isPlayingLocal, setIsPlayingLocal] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  // Single HTML5 Audio element to guarantee no overlapping MP3 playback
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const currentTrack = syncedAudio.currentTrack;
  const ambientTrack =
    syncedAudio.ambientTrack || tracks.find((t) => t.isAmbientBg) || null;

  // Global gesture listener to bypass browser autoplay restrictions seamlessly
  useEffect(() => {
    const unlockAndPlay = () => {
      setIsPlayingLocal(true);
      if (audioRef.current && audioRef.current.paused && !isMuted) {
        audioRef.current.play().catch(() => {});
      }
    };

    window.addEventListener('pointerdown', unlockAndPlay, { once: true });
    window.addEventListener('keydown', unlockAndPlay, { once: true });
    window.addEventListener('touchstart', unlockAndPlay, { once: true });

    return () => {
      window.removeEventListener('pointerdown', unlockAndPlay);
      window.removeEventListener('keydown', unlockAndPlay);
      window.removeEventListener('touchstart', unlockAndPlay);
    };
  }, [isMuted]);

  useEffect(() => {
    soundEngine.setVolume(volume);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // 1. Quản lý tải và phát bài nhạc (Chỉ khởi tạo lại khi đổi bài hoặc đổi trạng thái Mute/Play)
  useEffect(() => {
    if (!isPlayingLocal || isMuted) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      soundEngine.stopForestAmbience();
      return;
    }

    const fileUrl = currentTrack?.fileUrl?.trim();

    if (fileUrl) {
      soundEngine.stopForestAmbience();

      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.loop = true;
      }

      const audio = audioRef.current;
      if (!audio.src.endsWith(fileUrl)) {
        audio.src = fileUrl;
      }
      audio.volume = isMuted ? 0 : volume;

      const elapsedSinceSync = Math.max(
        0,
        Math.floor((Date.now() - syncedAudio.serverTimestamp) / 1000)
      );
      const duration = Math.max(1, currentTrack?.durationSeconds || 300);
      const targetOffset = ((syncedAudio.offsetSeconds || 0) + elapsedSinceSync) % duration;

      const applyInitialOffsetAndPlay = () => {
        try {
          if (Math.abs(audio.currentTime - targetOffset) > 2) {
            audio.currentTime = targetOffset;
          }
        } catch {}
        audio.play().catch(() => {
          soundEngine.startForestAmbience(currentTrack?.category || 'TIENG_SUOI');
        });
      };

      if (audio.readyState >= 1) {
        applyInitialOffsetAndPlay();
      } else {
        audio.onloadedmetadata = applyInitialOffsetAndPlay;
        audio.onerror = () => {
          soundEngine.startForestAmbience(currentTrack?.category || 'TIENG_SUOI');
        };
      }
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      soundEngine.startForestAmbience(currentTrack?.category || 'TIENG_SUOI');
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [isPlayingLocal, isMuted, currentTrack?.id, currentTrack?.fileUrl]);

  // 2. Tinh chỉnh đồng bộ âm thanh liên thiết bị ngầm (Lockstep Sync mà không ngắt quãng nhạc)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || audio.paused || !currentTrack?.fileUrl || isMuted || !isPlayingLocal) return;

    const duration = Math.max(1, currentTrack?.durationSeconds || audio.duration || 300);
    const elapsedSinceSync = Math.max(0, (Date.now() - syncedAudio.serverTimestamp) / 1000);
    const targetOffset = ((syncedAudio.offsetSeconds || 0) + elapsedSinceSync) % duration;

    // Chỉ hiệu chỉnh nếu lệch quá 2.5 giây để tránh giật âm thanh
    const drift = Math.abs(audio.currentTime - targetOffset);
    if (drift > 2.5) {
      try {
        audio.currentTime = targetOffset;
      } catch {}
    }
  }, [syncedAudio.offsetSeconds, syncedAudio.serverTimestamp]);

  const handleToggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    soundEngine.setMuted(next);
    if (audioRef.current) {
      audioRef.current.muted = next;
    }
  };

  // Sort schedules chronologically by startTime
  const sortedSchedules = [...schedules]
    .filter((s) => s.isEnabled)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const now = new Date();
  const currentHhMm = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;
  const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();

  return (
    <>
      {/* 1. VỊ TRÍ BÊN TRÁI: Khung Lịch phát theo mốc thời gian (Desktop / Tablet) */}
      <div className="hidden sm:block fixed left-3.5 top-1/2 -translate-y-1/2 z-30 pointer-events-auto select-none opacity-35 hover:opacity-100 transition-all duration-300">
        <div className="p-3 rounded-2xl bg-black/40 hover:bg-black/85 backdrop-blur-md border border-white/10 hover:border-[#d9a75a]/50 shadow-2xl text-xs text-[#fff6dc] w-52 sm:w-60 space-y-2.5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#d9a75a]" />
              <span className="font-semibold text-[#ffe3a3] text-xs">Thời Khóa Phát Nhạc</span>
            </div>
            {syncedAudio.isScheduled && (
              <span className="flex items-center gap-1 text-[10px] text-emerald-300 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                Live
              </span>
            )}
          </div>

          {/* Timeline Milestones list */}
          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
            {sortedSchedules.length === 0 ? (
              <p className="text-[11px] text-[#a9ba9f] py-1">Đang phát Nhạc nền xuyên suốt.</p>
            ) : (
              sortedSchedules.map((sched) => {
                const matchedTrack = tracks.find((t) => t.id === sched.trackId);
                const [sH, sM] = (sched.startTime || '00:00').split(':').map(Number);
                const startSec = (sH || 0) * 3600 + (sM || 0) * 60;
                let endSec = startSec + (sched.durationMinutes || 30) * 60;
                if (sched.endTime) {
                  const [eH, eM] = sched.endTime.split(':').map(Number);
                  endSec = (eH || 0) * 3600 + (eM || 0) * 60;
                  if (endSec <= startSec) endSec += 86400;
                }
                const isActive =
                  endSec > 86400
                    ? nowSec >= startSec || nowSec < endSec - 86400
                    : nowSec >= startSec && nowSec < endSec;

                return (
                  <div
                    key={sched.id}
                    onClick={() => setShowScheduleModal(true)}
                    className={`p-2 rounded-xl border cursor-pointer transition-all ${
                      isActive
                        ? 'bg-[#d9a75a]/20 border-[#d9a75a]/60 shadow-[0_0_10px_rgba(217,167,90,0.2)]'
                        : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/15'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-mono font-bold text-[#ffe3a3]">
                        {sched.startTime} → {sched.endTime || `${sched.durationMinutes}m`}
                      </span>
                      {isActive && (
                        <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300 font-bold animate-pulse">
                          Đang phát
                        </span>
                      )}
                    </div>
                    <p className="font-medium text-[#fff6dc] text-[11px] truncate mt-0.5">
                      {sched.name}
                    </p>
                    <p className="text-[10px] text-[#a9ba9f] truncate">
                      {matchedTrack?.title || 'Nhạc thiền'}
                    </p>
                  </div>
                );
              })
            )}

            {/* Ambient Background Default Period */}
            <div
              onClick={() => setShowScheduleModal(true)}
              className="p-2 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer hover:bg-white/10 text-[10px] text-[#d0ded0]"
            >
              <div className="flex items-center gap-1.5 font-semibold text-[#ffe3a3]">
                <Sparkles className="w-3 h-3 text-[#d9a75a]" />
                <span>Khung giờ khác:</span>
              </div>
              <p className="truncate mt-0.5 text-[#b5c7b3]">
                Nhạc nền: {ambientTrack?.title || 'Thanh âm Đại Ngàn'}
              </p>
            </div>
          </div>

          {/* Quick Click to Expand Detail */}
          <button
            type="button"
            onClick={() => setShowScheduleModal(true)}
            className="w-full text-center py-1 text-[10px] text-[#d9a75a] hover:text-[#ffe3a3] hover:underline"
          >
            Xem toàn bộ dòng thời gian ➔
          </button>
        </div>
      </div>

      {/* Mobile: Nút bấm Lịch phát nhỏ gọn bên trái để không che khuất cội cây và thiền sư */}
      <div className="block sm:hidden fixed left-2 top-1/2 -translate-y-1/2 z-30 pointer-events-auto select-none opacity-75 hover:opacity-100 transition-all duration-300">
        <button
          type="button"
          onClick={() => setShowScheduleModal(true)}
          className="flex flex-col items-center gap-1 p-2 rounded-2xl bg-black/55 hover:bg-black/85 backdrop-blur-md border border-white/15 text-[#ffe3a3] text-[10px] shadow-xl cursor-pointer"
          title="Xem Lịch phát thời khóa"
        >
          <Clock className="w-4 h-4 text-[#d9a75a]" />
          <span className="font-medium text-[9px]">Lịch</span>
          {syncedAudio.isScheduled && (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          )}
        </button>
      </div>

      {/* 2. GÓC BÊN PHẢI: Thanh điều chỉnh âm lượng dạng dọc siêu gọn (Tiết kiệm diện tích) */}
      <div className="fixed right-3 top-1/2 -translate-y-1/2 z-30 pointer-events-auto select-none opacity-80 sm:opacity-50 sm:hover:opacity-100 transition-all duration-300">
        <div className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-black/55 hover:bg-black/85 backdrop-blur-md border border-white/15 shadow-2xl text-[#fff6dc]">
          {/* Mute/Unmute Icon Button */}
          <button
            type="button"
            onClick={handleToggleMute}
            className="p-1 rounded-full text-[#ffe3a3] hover:text-white transition-colors cursor-pointer"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
            aria-label={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted || volume === 0 ? (
              <VolumeX className="w-4 h-4 text-red-300" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#d9a75a]" />
            )}
          </button>

          {/* Dạng dọc: vertical slider */}
          <div className="relative flex items-center justify-center h-20 w-4 py-1">
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                setIsMuted(false);
                setVolume(parseFloat(e.target.value));
              }}
              aria-label="Âm lượng"
              title={`Âm lượng: ${Math.round((isMuted ? 0 : volume) * 100)}%`}
              className="h-16 w-1 accent-[#d9a75a] bg-white/25 rounded-full cursor-pointer hover:bg-white/40 transition-all [writing-mode:vertical-lr] [direction:rtl]"
              style={{
                WebkitAppearance: 'slider-vertical',
              }}
            />
          </div>

          <span className="font-mono text-[9px] text-[#ffe3a3]/80">
            {isMuted ? '0%' : `${Math.round(volume * 100)}%`}
          </span>
        </div>
      </div>

      {/* 3. Modal Lịch phát theo mốc thời gian chi tiết (Timeline Schedule Milestone Modal) */}
      {showScheduleModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
          onClick={() => setShowScheduleModal(false)}
        >
          <div
            className="w-full max-w-lg max-h-[85vh] flex flex-col rounded-3xl bg-[#141d16]/95 border border-[#d9a75a]/30 shadow-2xl backdrop-blur-xl text-[#f3ede2] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-black/20">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#d9a75a]/20 border border-[#d9a75a]/30 flex items-center justify-center text-[#ffe3a3]">
                  <Clock className="w-5 h-5 text-[#d9a75a]" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-[#fff6dc]">
                    Thời Khóa Âm Thanh Thiền Viện
                  </h3>
                  <p className="text-xs text-[#a9ba9f]">
                    Đồng bộ thời gian thực cho toàn bộ người tham gia
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-[#c2d0bf] hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Currently Active Status Banner */}
            <div className="px-6 py-3 bg-[#d9a75a]/10 border-b border-[#d9a75a]/20 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate pr-2">
                <Radio className="w-4 h-4 text-[#d9a75a] shrink-0 animate-pulse" />
                <span className="text-[#ffe3a3] font-medium truncate">
                  Đang phát: {currentTrack?.title || 'Thanh âm Tĩnh Lặng'}
                </span>
              </div>
              <span className="text-[11px] text-[#d9a75a] shrink-0 font-mono">
                Hiện tại: {currentHhMm}
              </span>
            </div>

            {/* Timeline Milestones Body */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {sortedSchedules.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#a9ba9f] space-y-2">
                  <p>Chưa có lịch phát thời khóa đặc biệt nào được tạo.</p>
                  <p className="text-[#ffe3a3]">
                    Hệ thống đang phát Nhạc nền Thiền Viện xuyên suốt mọi khung giờ.
                  </p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-white/10">
                  {sortedSchedules.map((sched) => {
                    const matchedTrack = tracks.find((t) => t.id === sched.trackId);

                    const [sH, sM] = (sched.startTime || '00:00').split(':').map(Number);
                    const startSec = (sH || 0) * 3600 + (sM || 0) * 60;
                    let endSec = startSec + (sched.durationMinutes || 30) * 60;
                    if (sched.endTime) {
                      const [eH, eM] = sched.endTime.split(':').map(Number);
                      endSec = (eH || 0) * 3600 + (eM || 0) * 60;
                      if (endSec <= startSec) endSec += 86400;
                    }
                    const isActive =
                      endSec > 86400
                        ? nowSec >= startSec || nowSec < endSec - 86400
                        : nowSec >= startSec && nowSec < endSec;
                    const isPassed = !isActive && nowSec >= endSec;

                    return (
                      <div key={sched.id} className="relative group">
                        {/* Milestone Node on Timeline */}
                        <div
                          className={`absolute -left-[27px] top-3.5 w-3 h-3 rounded-full border-2 transition-all ${
                            isActive
                              ? 'bg-[#d9a75a] border-[#ffe3a3] shadow-[0_0_10px_rgba(217,167,90,0.8)] scale-125'
                              : isPassed
                              ? 'bg-stone-600 border-stone-500'
                              : 'bg-emerald-500 border-emerald-300'
                          }`}
                        />

                        {/* Milestone Card */}
                        <div
                          className={`p-3.5 rounded-2xl border transition-all ${
                            isActive
                              ? 'bg-[#d9a75a]/15 border-[#d9a75a]/50 shadow-[0_0_15px_rgba(217,167,90,0.15)]'
                              : 'bg-white/5 border-white/5 hover:border-white/15'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`font-mono text-xs font-bold px-2 py-0.5 rounded ${
                                isActive
                                  ? 'bg-[#d9a75a] text-[#121f14]'
                                  : 'bg-white/10 text-[#ffe3a3]'
                              }`}
                            >
                              {sched.startTime} → {sched.endTime || `${sched.durationMinutes}m`}
                            </span>
                            {isActive ? (
                              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                Đang phát trực tiếp
                              </span>
                            ) : isPassed ? (
                              <span className="text-[10px] text-stone-400">Đã qua</span>
                            ) : (
                              <span className="text-[10px] text-emerald-300/80">Sắp diễn ra</span>
                            )}
                          </div>

                          <p className="text-sm font-semibold text-[#fff6dc] mt-1">
                            {sched.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-[#a9ba9f] mt-1">
                            <Music className="w-3.5 h-3.5 text-[#d9a75a]" />
                            <span>
                              Bài phát: {matchedTrack?.title || 'Mặc định'}
                            </span>
                            <span>•</span>
                            <span>
                              {CATEGORY_LABELS[matchedTrack?.category || 'NHAC_THIEN']}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Ambient Track Milestone Box */}
              <div className="mt-4 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-start gap-3 text-xs">
                <Sparkles className="w-4 h-4 text-[#d9a75a] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#ffe3a3]">
                    Mọi khung giờ khác trong ngày:
                  </p>
                  <p className="text-[#d0ded0] mt-0.5">
                    Nhạc nền chính:{' '}
                    <strong>{ambientTrack?.title || 'Thanh âm Suối Rừng'}</strong>
                  </p>
                  <p className="text-[11px] text-[#8ea48b] mt-1">
                    Hệ thống tự động phát lặp lại thanh âm an định, thanh tịnh giữa các thời khóa thiền định.
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-white/10 bg-black/20 flex justify-end">
              <button
                type="button"
                onClick={() => setShowScheduleModal(false)}
                className="px-4 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs text-[#fff6dc] transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
