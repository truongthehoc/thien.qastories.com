import React from 'react';
import { motion } from 'framer-motion';
import { SanctuarySeat } from '../../types/sanctuary';
import { PractitionerAvatar } from './PractitionerAvatar';
import { useSanctuaryStore } from '../../store/useSanctuaryStore';

interface MeditationSeatNodeProps {
  seat: SanctuarySeat;
  currentUserId?: string;
  isSelected?: boolean;
  onSelectSeat: (seat: SanctuarySeat) => void;
}

export const MeditationSeatNode: React.FC<MeditationSeatNodeProps> = ({
  seat,
  currentUserId,
  isSelected = false,
  onSelectSeat,
}) => {
  if (!seat.isEnabled) return null;

  const isOccupied = seat.status !== 'EMPTY' && seat.occupant !== null;
  const isCurrentUser = isOccupied && seat.occupant?.userId === currentUserId;

  // Determine avatar pose
  let avatarPose: 'STANDING' | 'KNEELING' | 'BOWING' | 'MEDITATING' = 'MEDITATING';
  if (seat.status === 'BOWING' && seat.occupant) {
    avatarPose = seat.occupant.bowingPose || 'BOWING';
  }

  // Định hướng nhìn của nhân vật thiền định theo yêu cầu:
  // - Ngồi bên trái (posX < 47.0): quay mặt về bên phải hướng về Thiền sư ('right')
  // - Ngồi bên phải (posX > 53.8): quay mặt về bên trái hướng về Thiền sư ('left')
  // - Thẳng chính giữa (47.0 <= posX <= 53.8): quay lưng lại màn hình hướng thẳng cội bồ đề ('back')
  let facingDirection: 'left' | 'right' | 'back' = 'back';
  if (seat.posX < 47.0) {
    facingDirection = 'right';
  } else if (seat.posX > 53.8) {
    facingDirection = 'left';
  } else {
    facingDirection = 'back';
  }

  const settings = useSanctuaryStore((s) => s.settings);

  let customImageUrl: string | undefined = undefined;
  let isFlipped = false;
  if (facingDirection === 'back') {
    customImageUrl = settings.practitionerCenterUrl;
  } else if (facingDirection === 'left') {
    customImageUrl = settings.practitionerRightUrl;
    isFlipped = Boolean(settings.practitionerRightFlip);
  } else if (facingDirection === 'right') {
    customImageUrl = settings.practitionerLeftUrl;
    isFlipped = Boolean(settings.practitionerLeftFlip);
  }

  return (
    <div
      style={{
        left: `${seat.posX}%`,
        top: `${seat.posY}%`,
        zIndex: Math.round(seat.posY) + (isCurrentUser ? 20 : 0),
        transform: `translate(-50%, -50%) scale(${seat.scale})`,
      }}
      className="absolute group"
    >
      <motion.button
        type="button"
        onClick={() => onSelectSeat(seat)}
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.96 }}
        aria-label={`Vị trí thiền ${seat.code} - ${
          isOccupied
            ? `${seat.occupant?.displayName} đang ${
                seat.status === 'MEDITATING' ? 'ngồi thiền' : 'đảnh lễ'
              }`
            : 'Còn trống'
        }`}
        className="relative flex flex-col items-center justify-end focus:outline-none cursor-pointer"
      >
        {/* Name Label above character when occupied */}
        {isOccupied && seat.occupant && (
          <div
            className={`mb-0.5 px-2.5 py-[1.5px] rounded-full text-[10px] md:text-[11px] font-medium whitespace-nowrap shadow-lg backdrop-blur-sm transition-all ${
              isCurrentUser
                ? 'bg-[#2a3f28]/95 text-[#ffe7b3] border border-[#d9a75a]/85 ring-1 ring-[#d9a75a]/40 scale-105'
                : 'bg-[#101c12]/90 text-[#f0f4ef] border border-[#8ea885]/45'
            }`}
          >
            <span>{seat.occupant.displayName}</span>
            {seat.status === 'BOWING' && (
              <span className="ml-1 text-[8px] text-[#d9a75a]">• Lễ</span>
            )}
          </div>
        )}

        {/* Practitioner Avatar if occupied */}
        {isOccupied && seat.occupant && (
          <div className="-mb-2 z-10">
            <PractitionerAvatar
              pose={avatarPose}
              avatarStyle={seat.occupant.avatarStyle}
              isCurrentUser={isCurrentUser}
              facingDirection={facingDirection}
              customImageUrl={customImageUrl}
              isFlipped={isFlipped}
            />
          </div>
        )}

        {/* 
          VỊ TRÍ NGỒI:
          Theo yêu cầu: Chỉ cần flare ánh sáng để đánh dấu, không cần biểu tượng bồ đoàn dày đặc.
        */}
        {!isOccupied && (
          <div className="relative flex items-center justify-center py-1">
            {/* Vùng hào quang sáng dịu trên mặt cỏ tự nhiên */}
            <motion.div
              className="w-7 h-3 rounded-full pointer-events-none"
              style={{
                background: isSelected
                  ? 'radial-gradient(ellipse at center, rgba(255, 248, 220, 0.95) 0%, rgba(217, 167, 90, 0.65) 40%, transparent 75%)'
                  : 'radial-gradient(ellipse at center, rgba(255, 246, 215, 0.8) 0%, rgba(217, 167, 90, 0.4) 40%, rgba(217, 167, 90, 0.08) 65%, transparent 75%)',
                filter: 'blur(2px)',
              }}
              animate={{
                scale: [0.92, 1.15, 0.92],
                opacity: [0.65, 0.95, 0.65],
              }}
              transition={{
                duration: 3.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />

            {/* Điểm tâm sáng flare ánh sáng lung linh */}
            <div className="absolute w-2 h-1 rounded-full bg-[#fffce8] shadow-[0_0_8px_#ffe49e] group-hover:scale-150 transition-transform duration-300" />

            {/* Số hiệu tọa cụ chỉ hiện khi đưa chuột vào */}
            <div className="absolute -bottom-3.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none px-1.5 py-[0.5px] rounded bg-[#101c12]/90 border border-[#d9a75a]/50 text-[8px] text-[#ffeec9] font-mono shadow-md whitespace-nowrap">
              #{seat.code}
            </div>
          </div>
        )}

        {/* Hover Tooltip for Empty Seat */}
        {!isOccupied && (
          <div className="pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute -top-7 px-2 py-0.5 rounded bg-[#101c12]/92 border border-[#d9a75a]/40 text-[10px] text-[#f5ebd6] whitespace-nowrap shadow-lg z-30">
            Tọa cụ #{seat.code} • {seat.zoneName}
          </div>
        )}
      </motion.button>
    </div>
  );
};
