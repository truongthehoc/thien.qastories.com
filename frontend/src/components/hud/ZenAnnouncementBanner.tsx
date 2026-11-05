import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SanctuaryAnnouncement } from '../../types/sanctuary';
import { Sparkles, Bell, Calendar, X, Volume2, Info } from 'lucide-react';

interface ZenAnnouncementBannerProps {
  announcements: SanctuaryAnnouncement[];
}

export const ZenAnnouncementBanner: React.FC<ZenAnnouncementBannerProps> = ({
  announcements = [],
}) => {
  const [dismissedIds, setDismissedIds] = useState<Record<string, boolean>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRepeatHidden, setIsRepeatHidden] = useState(false);

  // Filter currently valid announcements based on system time and enabled state
  const activeList = useMemo(() => {
    const nowMs = Date.now();
    return announcements.filter((ann) => {
      if (!ann.isEnabled) return false;
      if (dismissedIds[ann.id]) return false;
      const startMs = new Date(ann.startTime).getTime();
      const endMs = new Date(ann.endTime).getTime();
      if (isNaN(startMs) || isNaN(endMs)) return false;
      return nowMs >= startMs && nowMs <= endMs;
    });
  }, [announcements, dismissedIds]);

  const currentAnnouncement = activeList[currentIndex] || activeList[0] || null;

  // Cycle through multiple announcements if more than 1
  useEffect(() => {
    if (activeList.length <= 1) {
      setCurrentIndex(0);
      return;
    }
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeList.length);
    }, 25000);
    return () => clearInterval(timer);
  }, [activeList.length]);

  // Handle Repeat Cycle for announcement (repeatIntervalMinutes)
  useEffect(() => {
    if (!currentAnnouncement) return;
    const intervalMin = currentAnnouncement.repeatIntervalMinutes || 0;
    if (intervalMin <= 0) {
      setIsRepeatHidden(false);
      return;
    }

    // Show for displayDuration, then hide for repeatIntervalMinutes
    const displayDurationMs = (currentAnnouncement.durationDisplaySeconds || 30) * 1000;
    const hideDurationMs = intervalMin * 60 * 1000;

    setIsRepeatHidden(false);
    const hideTimer = setTimeout(() => {
      setIsRepeatHidden(true);
      const showTimer = setTimeout(() => {
        setIsRepeatHidden(false);
      }, hideDurationMs);
      return () => clearTimeout(showTimer);
    }, displayDurationMs);

    return () => clearTimeout(hideTimer);
  }, [currentAnnouncement?.id, currentAnnouncement?.repeatIntervalMinutes]);

  if (!currentAnnouncement || isRepeatHidden) {
    return null;
  }

  // Animation speed in seconds
  const speedSeconds =
    currentAnnouncement.scrollSpeed === 'SLOW'
      ? 45
      : currentAnnouncement.scrollSpeed === 'FAST'
      ? 18
      : 28;

  const handleDismiss = (id: string) => {
    setDismissedIds((prev) => ({ ...prev, [id]: true }));
  };

  const getBadgeInfo = () => {
    switch (currentAnnouncement.type) {
      case 'EVENT':
        return {
          icon: Calendar,
          label: 'Thời Khóa',
          badgeBg: 'bg-amber-950/70 border-amber-500/40 text-amber-300',
        };
      case 'REMINDER':
        return {
          icon: Bell,
          label: 'Lời Nhắc',
          badgeBg: 'bg-emerald-950/70 border-emerald-500/40 text-emerald-300',
        };
      case 'INFO':
      default:
        return {
          icon: Sparkles,
          label: 'Thiền Viên',
          badgeBg: 'bg-[#d9a75a]/20 border-[#d9a75a]/45 text-[#ffe3a3]',
        };
    }
  };

  const badge = getBadgeInfo();
  const BadgeIcon = badge.icon;

  return (
    <div className="fixed top-20 sm:top-18 inset-x-0 z-30 flex justify-center pointer-events-none px-3 sm:px-4">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentAnnouncement.id}
          initial={{ opacity: 0, y: -16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -12, scale: 0.96 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="pointer-events-auto w-full max-w-md sm:max-w-xl md:max-w-2xl"
        >
          <div className="relative px-3 py-1.5 sm:px-4 sm:py-2 rounded-full sanctuary-glass border border-[#d9a75a]/35 shadow-[0_10px_35px_rgba(0,0,0,0.65)] flex items-center gap-2.5 sm:gap-3 select-none overflow-hidden group">
            {/* Subtle Ambient Radial Light */}
            <div
              className="absolute inset-0 pointer-events-none opacity-40 group-hover:opacity-60 transition-opacity"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 50%, rgba(217, 167, 90, 0.22) 0%, transparent 80%)',
              }}
            />

            {/* Type Pill */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[10px] sm:text-xs font-serif font-bold shrink-0 tracking-wider uppercase shadow-sm ${badge.badgeBg}`}
            >
              <BadgeIcon className="w-3 h-3 text-[#d9a75a] shrink-0" />
              <span>{badge.label}</span>
            </div>

            {/* Announcement Content: Marquee or Static Smooth Text */}
            <div className="flex-1 overflow-hidden relative h-5 sm:h-6 flex items-center">
              {currentAnnouncement.isMarquee ? (
                <div
                  className="animate-zen-marquee"
                  style={{ animationDuration: `${speedSeconds}s` }}
                >
                  <span className="font-serif text-xs sm:text-sm text-[#fff6dc] pr-12 tracking-wide font-normal whitespace-nowrap">
                    {currentAnnouncement.title ? (
                      <strong className="text-[#ffe3a3] font-semibold">{currentAnnouncement.title} • </strong>
                    ) : null}
                    {currentAnnouncement.content}
                  </span>
                  <span className="font-serif text-xs sm:text-sm text-[#fff6dc] pr-12 tracking-wide font-normal whitespace-nowrap">
                    {currentAnnouncement.title ? (
                      <strong className="text-[#ffe3a3] font-semibold">{currentAnnouncement.title} • </strong>
                    ) : null}
                    {currentAnnouncement.content}
                  </span>
                </div>
              ) : (
                <p className="font-serif text-xs sm:text-sm text-[#fff6dc] truncate tracking-wide">
                  {currentAnnouncement.title ? (
                    <strong className="text-[#ffe3a3] font-semibold">{currentAnnouncement.title}: </strong>
                  ) : null}
                  {currentAnnouncement.content}
                </p>
              )}
            </div>

            {/* Dismiss / Close Button */}
            <button
              type="button"
              onClick={() => handleDismiss(currentAnnouncement.id)}
              title="Tạm ẩn thông báo"
              className="p-1 rounded-full text-[#8ea885] hover:text-[#fff6dc] hover:bg-white/10 transition-colors shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
