import React from 'react';
import { SanctuaryStats } from '../../types/sanctuary';
import { Leaf, Users, Sparkles, CircleDot } from 'lucide-react';

interface TopStatusBarProps {
  sanctuaryName: string;
  stats: SanctuaryStats;
}

export const TopStatusBar: React.FC<TopStatusBarProps> = ({
  sanctuaryName,
  stats,
}) => {
  return (
    <header className="fixed top-0 inset-x-0 z-30 flex items-center justify-between px-3 sm:px-6 py-3 pointer-events-none">
      {/* Top Left: Logo & Sanctuary Name */}
      <div className="pointer-events-auto flex items-center gap-2.5 px-3.5 py-2 rounded-2xl sanctuary-glass shadow-lg">
        <div className="w-8 h-8 rounded-xl bg-[#d9a75a]/20 border border-[#d9a75a]/45 flex items-center justify-center">
          <Leaf className="w-4 h-4 text-[#d9a75a]" />
        </div>
        <div>
          <h1 className="font-serif text-sm sm:text-base font-semibold tracking-wide text-[#fff6dc] leading-tight">
            {sanctuaryName || 'THIỀN VIÊN'}
          </h1>
          <p className="text-[10px] text-[#b4c4b0] hidden sm:block">
            Không gian an trú • Rừng thiền đại thụ
          </p>
        </div>
      </div>

      {/* Top Right: Live Realtime Sanctuary Participation Metrics */}
      <div className="pointer-events-auto flex items-center gap-2">
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
