import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SanctuarySeat, SystemSettingsConfig } from '../../types/sanctuary';
import { X, Clock, Sparkles, HandHeart, UserCheck } from 'lucide-react';

interface SeatActionModalProps {
  seat: SanctuarySeat;
  currentUserId?: string;
  settings: SystemSettingsConfig;
  cooldownRemainingSec: number;
  onClose: () => void;
  onStartBowing: (seat: SanctuarySeat) => void;
  onStartMeditation: (seat: SanctuarySeat, durationMinutes: 5 | 10 | 15 | 30) => void;
  onLeaveSeat: () => void;
}

const MEDITATION_OPTIONS: Array<{ minutes: 5 | 10 | 15 | 30; label: string; desc: string }> = [
  { minutes: 5, label: '5 phút', desc: 'An định hơi thở' },
  { minutes: 10, label: '10 phút', desc: 'Quán chiếu thân tâm' },
  { minutes: 15, label: '15 phút', desc: 'Thiền định sâu lắng' },
  { minutes: 30, label: '30 phút', desc: 'An trú chánh niệm' },
];

export const SeatActionModal: React.FC<SeatActionModalProps> = ({
  seat,
  currentUserId,
  settings,
  cooldownRemainingSec,
  onClose,
  onStartBowing,
  onStartMeditation,
  onLeaveSeat,
}) => {
  const [selectedDuration, setSelectedDuration] = useState<5 | 10 | 15 | 30>(10);
  const [forceRandomMode, setForceRandomMode] = useState(false);

  const isOccupied = seat.status !== 'EMPTY' && seat.occupant !== null;
  const isCurrentUser = isOccupied && seat.occupant?.userId === currentUserId;

  const getPointsForDuration = (m: 5 | 10 | 15 | 30) => {
    if (m === 5) return settings.meditation5Points;
    if (m === 10) return settings.meditation10Points;
    if (m === 15) return settings.meditation15Points;
    return settings.meditation30Points;
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-black/45 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, y: 12, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        transition={{ duration: 0.25 }}
        className="relative w-full max-w-md max-h-[90vh] overflow-y-auto rounded-3xl sanctuary-glass p-5 sm:p-6 shadow-[0_20px_60px_rgba(0,0,0,0.85)]"
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-[#a8b8a4] hover:text-[#fff6dc] hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-11 h-11 rounded-2xl bg-[#d9a75a]/20 border border-[#d9a75a]/45 flex flex-col items-center justify-center">
            {isOccupied && !forceRandomMode ? (
              <>
                <span className="text-[9px] uppercase text-[#c7d3c3]">Tọa cụ</span>
                <span className="font-serif font-bold text-sm text-[#ffe3a3]">#{seat.code}</span>
              </>
            ) : (
              <Sparkles className="w-5 h-5 text-[#ffd27d] animate-pulse" />
            )}
          </div>
          <div>
            <h2 className="font-serif text-lg font-semibold text-[#fff6dc]">
              {isOccupied && !forceRandomMode
                ? `Vị trí Tọa cụ số ${seat.code}`
                : 'An Tọa Thiền Định'}
            </h2>
            <p className="text-xs text-[#b5c4b1]">
              {isOccupied && !forceRandomMode
                ? `Khu vực: ${seat.zoneName}`
                : 'Hệ thống tự động sắp xếp vị trí còn trống ngẫu nhiên'}
            </p>
          </div>
        </div>

        {/* Case 1: Occupied by another practitioner */}
        {isOccupied && !isCurrentUser && !forceRandomMode && seat.occupant && (
          <div className="p-4 rounded-2xl bg-[#101d12]/80 border border-[#8ea885]/25 space-y-3.5 text-sm">
            <div className="flex items-center gap-2 text-[#ffe3a3] font-medium">
              <UserCheck className="w-4 h-4 text-[#d9a75a]" />
              <span>Đạo hữu {seat.occupant.displayName} đang an trú tại đây</span>
            </div>
            <p className="text-xs text-[#c2d0bf] leading-relaxed">
              Trạng thái hiện tại:{' '}
              <strong className="text-[#fff6dc]">
                {seat.status === 'MEDITATING'
                  ? `Đang ngồi thiền (${seat.occupant.targetMinutes || 10} phút)`
                  : 'Đang thực hiện nghi thức đảnh lễ Thiền sư'}
              </strong>
              .
            </p>
            <p className="text-[11px] text-[#94a691] italic">
              Vị trí này đã có người ngồi. Bạn có thể vào tọa thiền để hệ thống tự động chọn một chỗ trống thanh tịnh cho bạn.
            </p>
            <button
              type="button"
              onClick={() => setForceRandomMode(true)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#b8863b] via-[#d9a75a] to-[#b8863b] text-[#111d13] font-semibold text-xs tracking-wide shadow flex items-center justify-center gap-1.5 hover:brightness-110 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Vào Tọa Thiền (An vị ngẫu nhiên)</span>
            </button>
          </div>
        )}

        {/* Case 2: Occupied by Current User */}
        {isCurrentUser && !forceRandomMode && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-[#d9a75a]/15 border border-[#d9a75a]/40 text-xs text-[#f5ebd6]">
              Bạn đang an trú tại tọa cụ số <strong>{seat.code}</strong> ({seat.zoneName}). Bạn có thể tiếp tục hoàn thành thời khóa hoặc xả thiền để nhường vị trí cho đạo hữu khác.
            </div>
            <button
              type="button"
              onClick={onLeaveSeat}
              className="w-full py-2.5 rounded-xl bg-red-950/60 hover:bg-red-900/70 border border-red-400/30 text-red-200 text-xs font-medium transition-colors"
            >
              Xả thiền & Rời khỏi vị trí
            </button>
          </div>
        )}

        {/* Case 3: Empty Seat OR Auto-allocate random seat mode */}
        {(!isOccupied || forceRandomMode) && (
          <div className="space-y-5">
            {/* Tự động sắp xếp ghi chú */}
            <div className="px-3 py-2 rounded-xl bg-[#d9a75a]/10 border border-[#d9a75a]/25 text-[11px] text-[#ebd4a5] flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-[#d9a75a] shrink-0" />
              <span>
                Vị trí sẽ được tự động xếp vào một tọa cụ trống ngẫu nhiên (Cánh Tả, Cánh Hữu hoặc Trục Trung Tâm).
              </span>
            </div>

            {/* Option A: Đảnh lễ Thiền sư */}
            <div className="p-4 rounded-2xl bg-[#0e1b11]/85 border border-[#d9a75a]/30 hover:border-[#d9a75a]/60 transition-all">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <HandHeart className="w-4 h-4 text-[#d9a75a]" />
                  <h3 className="font-serif font-semibold text-sm text-[#fff6dc]">
                    A. Đảnh lễ Thiền sư
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#d9a75a]/20 text-[#ffe3a3] text-[11px] font-medium">
                  +{settings.bowingPoints} điểm an trú
                </span>
              </div>
              <p className="text-xs text-[#bdcbb9] mb-3 leading-relaxed">
                Nghi thức tam bái trang nghiêm hướng về vị Thiền sư (Đứng trang nghiêm → Quỳ xuống → Chắp tay cúi lạy).
              </p>
              <button
                type="button"
                disabled={cooldownRemainingSec > 0}
                onClick={() => onStartBowing(seat)}
                className="w-full py-2.5 px-4 rounded-xl bg-[#273d29] hover:bg-[#314c33] border border-[#d9a75a]/45 text-[#fff6dc] text-xs font-medium transition-all disabled:opacity-50 cursor-pointer"
              >
                {cooldownRemainingSec > 0
                  ? `Xin tĩnh tâm chờ ${cooldownRemainingSec}s trước lượt lễ tiếp theo`
                  : 'Bắt đầu Đảnh lễ (An vị ngẫu nhiên)'}
              </button>
            </div>

            {/* Option B: Ngồi thiền */}
            <div className="p-4 rounded-2xl bg-[#0e1b11]/85 border border-[#8ea885]/30 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#d9a75a]" />
                  <h3 className="font-serif font-semibold text-sm text-[#fff6dc]">
                    B. Ngồi thiền định
                  </h3>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#d9a75a]/20 text-[#ffe3a3] text-[11px] font-medium">
                  +{getPointsForDuration(selectedDuration)} điểm an trú
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {MEDITATION_OPTIONS.map((opt) => {
                  const active = selectedDuration === opt.minutes;
                  return (
                    <button
                      key={opt.minutes}
                      type="button"
                      onClick={() => setSelectedDuration(opt.minutes)}
                      className={`p-2.5 rounded-xl border text-left transition-all ${
                        active
                          ? 'bg-[#d9a75a]/25 border-[#d9a75a] text-[#fff6dc] shadow'
                          : 'bg-[#0a130b]/70 border-white/10 text-[#b7c5b4] hover:border-white/25'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs">{opt.label}</span>
                        <span className="text-[10px] text-[#d9a75a]">
                          +{getPointsForDuration(opt.minutes)}đ
                        </span>
                      </div>
                      <p className="text-[10px] text-[#9eb09a] mt-0.5">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => onStartMeditation(seat, selectedDuration)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#b8863b] via-[#d9a75a] to-[#b8863b] text-[#111d13] font-semibold text-xs tracking-wide shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Bắt đầu Ngồi Thiền ({selectedDuration} phút)</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
};
