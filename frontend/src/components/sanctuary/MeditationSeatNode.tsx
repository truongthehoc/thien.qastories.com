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
  // Ẩn hoàn toàn đốm sáng vị trí trống khỏi background theo yêu cầu:
  // Chỉ hiển thị nhân vật đạo hữu tại các vị trí thực sự có người đang ngồi (isOccupied)
  const isOccupied = seat.status !== 'EMPTY' && seat.occupant !== null;
  if (!seat.isEnabled || !isOccupied || !seat.occupant) return null;

  const isCurrentUser = seat.occupant.userId === currentUserId;

  // Determine avatar pose
  let avatarPose: 'STANDING' | 'KNEELING' | 'BOWING' | 'MEDITATING' = 'MEDITATING';
  if (seat.status === 'BOWING') {
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
        onClick={() => {
          // Chỉ người sở hữu tọa cụ mới có thể mở menu điều khiển (xem thông tin / xả thiền)
          // Không cho phép người dùng bấm đổi chỗ lung tung
          if (isCurrentUser) {
            onSelectSeat(seat);
          }
        }}
        whileHover={isCurrentUser ? { scale: 1.08 } : undefined}
        whileTap={isCurrentUser ? { scale: 0.96 } : undefined}
        aria-label={`Vị trí thiền #${seat.code} - ${seat.occupant.displayName}`}
        className={`relative flex flex-col items-center justify-end focus:outline-none ${
          isCurrentUser ? 'cursor-pointer' : 'cursor-default pointer-events-none'
        }`}
      >
        {/* Name Label above character */}
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

        {/* Practitioner Avatar */}
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
      </motion.button>
    </div>
  );
};
