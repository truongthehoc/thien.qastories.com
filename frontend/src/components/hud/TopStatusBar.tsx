import React from 'react';
import { SanctuaryStats, SanctuaryAnnouncement } from '../../types/sanctuary';
import { Leaf, Users, Sparkles, CircleDot } from 'lucide-react';
import { ZenAnnouncementBanner } from './ZenAnnouncementBanner';

interface TopStatusBarProps {
  sanctuaryName: string;
  stats: SanctuaryStats;
  announcements?: SanctuaryAnnouncement[];
}

export const TopStatusBar: React.FC<TopStatusBarProps> = ({
  sanctuaryName,
  stats,
  announcements = [],
}) => {
  return (
    <header className="fixed top-0 inset-x-0 z-30 flex items-center justify-between px-2.5 sm:px-6 py-2 sm:py-3 pointer-events-none gap-2 sm:gap-4">
      {/* Top Left: Logo & Sanctuary Name (Thu gọn tối đa trên mobile để tiết kiệm diện tích) */}
      <div className="pointer-events-auto shrink-0 flex items-center gap-1.5 sm:gap-2.5 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl sanctuary-glass shadow-lg">
        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl bg-[#d9a75a]/20 border border-[#d9a75a]/45 flex items-center justify-center shrink-0">
          <Leaf className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#d9a75a]" />
        </div>
        <div>
          <h1 className="font-serif text-xs sm:text-base font-semibold tracking-wide text-[#fff6dc] leading-tight">
            {sanctuaryName || 'THIỀN VIÊN'}
          </h1>
          <p className="text-[9px] text-[#b4c4b0] hidden md:block">
            Không gian an trú • Rừng thiền đại thụ
          </p>
        </div>
      </div>

      {/* Top Center (Desktop): Khung thông báo đưa lên ngang hàng với tên thiền viện và thông tin online */}
      <div className="pointer-events-auto hidden md:flex flex-1 justify-center max-w-xl lg:max-w-2xl mx-2">
        <ZenAnnouncementBanner announcements={announcements} inline />
      </div>

      {/* Top Right: Live Realtime Sanctuary Participation Metrics */}
      <div className="pointer-events-auto shrink-0 flex items-center gap-2">
        <div className="flex items-center gap-2.5 sm:gap-4 px-3.5 py-2 rounded-2xl sanctuary-glass shadow-lg text-xs">
          {/* Online */}
          <div className="flex items-center gap-1.5" title="Tổng số người đang hiện diện trực tuyến">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <Users className="w-3.5 h-3.5 text-[#b8cab4] hidden sm:inline" />
            <span className="text-[#c6d4c2] hidden md:inline">Hiện diện:</span>
            <span className="font-semibold text-[#fff6dc]">{stats.totalOnline}</span>
          </div>

          <div className="h-3.5 w-[1px] bg-white/15" />

          {/* Meditating */}
          <div className="flex items-center gap-1.5" title="Số đạo hữu đang ngồi thiền định">
            <Sparkles className="w-3.5 h-3.5 text-[#d9a75a]" />
            <span className="text-[#c6d4c2] hidden sm:inline">Đang thiền:</span>
            <span className="font-semibold text-[#ffe3a3]">{stats.meditatingCount}</span>
          </div>

          <div className="h-3.5 w-[1px] bg-white/15" />

          {/* Bowing */}
          <div className="flex items-center gap-1.5" title="Số người đang thực hiện nghi thức đảnh lễ Thiền sư">
            <span className="text-[#c6d4c2] hidden sm:inline">Đảnh lễ:</span>
            <span className="font-semibold text-[#f3c68f]">{stats.bowingCount}</span>
          </div>

          <div className="h-3.5 w-[1px] bg-white/15 hidden sm:block" />

          {/* Empty Seats */}
          <div className="hidden sm:flex items-center gap-1.5" title="Số bồ đoàn còn trống có thể tham gia">
            <CircleDot className="w-3.5 h-3.5 text-[#8ea885]" />
            <span className="text-[#c6d4c2] hidden lg:inline">Vị trí trống:</span>
            <span className="font-semibold text-[#d2e3ce]">
              {stats.emptySeatsCount}/50
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
