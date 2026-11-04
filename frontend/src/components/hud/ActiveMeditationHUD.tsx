import React from 'react';
import { motion } from 'framer-motion';
import { BowingPose } from '../../types/sanctuary';
import { Bell, LogOut } from 'lucide-react';
import { soundEngine } from '../../services/soundEngine';

interface ActiveMeditationHUDProps {
  seatCode: string;
  activityType: 'MEDITATING' | 'BOWING';
  targetMinutes?: 5 | 10 | 15 | 30;
  remainingSeconds: number;
  bowingPose?: BowingPose;
  bowStep?: number;
  onStopEarly: () => void;
}

export const ActiveMeditationHUD: React.FC<ActiveMeditationHUDProps> = ({
  seatCode,
  activityType,
  targetMinutes = 10,
  remainingSeconds,
  bowingPose = 'STANDING',
  bowStep = 1,
  onStopEarly,
}) => {
  const formatTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const totalSec = targetMinutes * 60;
  const progressPct =
    activityType === 'MEDITATING'
      ? Math.min(100, Math.max(0, ((totalSec - remainingSeconds) / totalSec) * 100))
      : ((bowStep || 1) / 3) * 100;

  const poseDescription =
    bowingPose === 'STANDING'
      ? 'Đứng lạy'
      : bowingPose === 'KNEELING'
      ? 'Quỳ lạy'
      : 'Cúi lạy';

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.95 }}
      className="fixed top-14 sm:top-16 right-2 sm:right-6 z-30 pointer-events-auto select-none opacity-40 hover:opacity-100 transition-all duration-300"
    >
      {/* Mobile: dạng dọc (flex-col) bên phải | Tablet/Desktop: dạng ngang gọn (sm:flex-row) */}
      <div className="flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2.5 p-2 sm:px-3 sm:py-1.5 rounded-2xl bg-black/45 hover:bg-black/80 backdrop-blur-md border border-white/10 hover:border-[#d9a75a]/40 shadow-xl text-xs text-[#fff6dc]">
        {/* Breathing Lotus Indicator */}
        <div className="relative flex items-center justify-center w-6 h-6 rounded-full bg-[#d9a75a]/20 border border-[#d9a75a]/50 shrink-0">
          <motion.div
            className="w-2 h-2 rounded-full bg-[#d9a75a]"
            animate={{
              scale: [0.8, 1.3, 0.8],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        </div>

        {/* Status & Compact Countdown */}
        <div className="flex flex-col items-center sm:items-start sm:min-w-[90px]">
          <div className="flex items-center gap-1 text-[11px] leading-tight">
            <span className="font-semibold text-[#d9a75a]">#{seatCode}</span>
            <span className="text-[#a9ba9f] hidden sm:inline">•</span>
            <span className="text-[#d8e4d5] font-medium hidden sm:inline truncate">
              {activityType === 'MEDITATING' ? `${targetMinutes}p thiền` : 'Đảnh lễ'}
            </span>
          </div>

          {activityType === 'MEDITATING' ? (
            <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 mt-0.5">
              <span className="font-mono text-xs font-bold text-[#ffe3a3] leading-tight">
                {formatTime(remainingSeconds)}
              </span>
              <div className="w-10 sm:w-14 h-1 rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#b8863b] to-[#ffe3a3] transition-all duration-500"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="text-[10px] text-[#ffe3a3] mt-0.5 truncate">{poseDescription}</p>
          )}
        </div>

        {/* Action Buttons: Bell & Xả Thiền */}
        <div className="flex flex-col sm:flex-row items-center gap-1 mt-0.5 sm:mt-0 pt-1 sm:pt-0 border-t sm:border-t-0 sm:border-l border-white/10 sm:pl-2">
          {activityType === 'MEDITATING' && (
            <button
              type="button"
              onClick={() => soundEngine.playMindfulnessBell(0.45)}
              title="Thỉnh chuông chánh niệm"
              className="p-1 rounded-lg bg-white/5 hover:bg-[#d9a75a]/25 text-[#d9a75a] transition-colors"
            >
              <Bell className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={onStopEarly}
            title="Xả thiền"
            className="flex items-center justify-center gap-1 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-xl bg-white/5 hover:bg-red-950/70 text-[#bdcbb9] hover:text-red-200 border border-white/10 text-[10px] sm:text-[11px] font-medium transition-colors"
          >
            <LogOut className="w-3 h-3" />
            <span>Xả</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};
