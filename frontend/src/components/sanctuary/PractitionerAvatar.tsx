import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type MeditationPoseType = 'FULL_LOTUS' | 'HALF_LOTUS' | 'KNEELING_ANJALI' | 'BOWING' | 'STANDING_ANJALI';

interface PractitionerAvatarProps {
  pose: 'STANDING' | 'KNEELING' | 'BOWING' | 'MEDITATING' | MeditationPoseType;
  avatarStyle?: string;
  isCurrentUser?: boolean;
  facingDirection?: 'left' | 'right' | 'back';
  customImageUrl?: string;
  isFlipped?: boolean;
}

/**
 * Nhân vật hành giả ngồi thiền chân thực (Photorealistic Buddhist Practitioner):
 * - Ngồi bên trái: quay mặt về bên phải (hướng vào Thiền sư).
 * - Ngồi bên phải: quay mặt về bên trái (hướng vào Thiền sư).
 * - Thẳng chính giữa: quay lưng lại màn hình (nhìn thẳng về phía cội bồ đề và Thiền sư).
 */
export const PractitionerAvatar: React.FC<PractitionerAvatarProps> = ({
  pose,
  avatarStyle = 'monastic_brown',
  isCurrentUser = false,
  facingDirection = 'right',
  customImageUrl,
  isFlipped = false,
}) => {
  // Map incoming pose names cleanly
  let currentPose: MeditationPoseType = 'FULL_LOTUS';
  if (pose === 'MEDITATING' || pose === 'FULL_LOTUS') {
    currentPose = 'FULL_LOTUS';
  } else if (pose === 'HALF_LOTUS') {
    currentPose = 'HALF_LOTUS';
  } else if (pose === 'KNEELING' || pose === 'KNEELING_ANJALI') {
    currentPose = 'KNEELING_ANJALI';
  } else if (pose === 'BOWING') {
    currentPose = 'BOWING';
  } else if (pose === 'STANDING' || pose === 'STANDING_ANJALI') {
    currentPose = 'STANDING_ANJALI';
  }

  const isBackView = facingDirection === 'back';
  const robeKey = avatarStyle || 'monastic_brown';

  // Determine image sources based on customImageUrl or front/side vs back view
  const defaultDirSrc = isBackView
    ? `/assets/sanctuary/practitioner-back-${robeKey}.png`
    : facingDirection === 'right'
    ? `/assets/sanctuary/practitioner-left-${robeKey}.png`
    : `/assets/sanctuary/practitioner-right-${robeKey}.png`;

  const avatarImageSrc = customImageUrl || defaultDirSrc;

  const fallbackImageSrc = isBackView
    ? '/assets/sanctuary/practitioner-back.png'
    : facingDirection === 'right'
    ? '/assets/sanctuary/practitioner-left.png'
    : '/assets/sanctuary/practitioner-right.png';

  // Left wing characters natively face right, right wing characters face left, back view faces center.
  // isFlipped allows inverting horizontally if an uploaded custom asset was oriented opposite.
  const flipFactor = isFlipped ? -1 : 1;

  return (
    <div className="relative flex flex-col items-center justify-end pointer-events-none select-none">
      {/* Soft Contact Shadow on Grass/Ground */}
      <motion.div
        className="absolute -bottom-1 w-20 h-6 rounded-full pointer-events-none"
        style={{
          background: isCurrentUser
            ? 'radial-gradient(ellipse at center, rgba(255, 230, 160, 0.45) 0%, rgba(217, 167, 90, 0.15) 55%, transparent 75%)'
            : 'radial-gradient(ellipse at center, rgba(10, 18, 12, 0.72) 0%, rgba(10, 18, 12, 0.25) 60%, transparent 80%)',
        }}
        animate={{
          scale: [1, 1.05, 1],
          opacity: [0.75, 0.95, 0.75],
        }}
        transition={{
          duration: 5.5,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      <AnimatePresence mode="wait">
        {/* 1. NGỒI KIẾT GIÀ CHÂN THỰC (Full Lotus - Inward Facing or Rear View) */}
        {(currentPose === 'FULL_LOTUS' || currentPose === 'HALF_LOTUS') && (
          <motion.div
            key={`photorealistic_lotus_${facingDirection}`}
            style={{
              transformOrigin: '50% 90%',
              scaleX: flipFactor,
            }}
            animate={{
              y: [0, -1.5, 0],
              scaleY: [1, 1.018, 1],
            }}
            transition={{
              duration: 5.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative flex items-center justify-center"
          >
            <img
              src={avatarImageSrc}
              onError={(e) => {
                (e.target as HTMLImageElement).src = fallbackImageSrc;
              }}
              alt={isBackView ? 'Hành giả quay lưng tọa thiền' : 'Hành giả tọa thiền hướng vào trung tâm'}
              className="w-[70px] sm:w-[74px] md:w-20 lg:w-22 h-auto object-contain pointer-events-none select-none drop-shadow-[0_8px_16px_rgba(0,0,0,0.7)]"
              draggable={false}
            />
          </motion.div>
        )}

        {/* 2. ĐẢNH LỄ HƯỚNG VỀ THIỀN SƯ (Bowing - Smooth Prostration) */}
        {currentPose === 'BOWING' && (
          <motion.div
            key={`photorealistic_bowing_${facingDirection}`}
            style={{
              transformOrigin: '50% 90%',
              scaleX: flipFactor,
            }}
            animate={
              isBackView
                ? {
                    y: [0, 8, 11, 8, 0],
                    scaleY: [1, 0.90, 0.85, 0.90, 1],
                  }
                : {
                    rotate: [0, 38, 42, 38, 0],
                    y: [0, 8, 10, 8, 0],
                    scaleY: [1, 0.92, 0.88, 0.92, 1],
                  }
            }
            transition={{
              duration: 4.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative flex items-center justify-center"
          >
            <img
              src={avatarImageSrc}
              onError={(e) => {
                (e.target as HTMLImageElement).src = fallbackImageSrc;
              }}
              alt="Hành giả đảnh lễ Thiền sư"
              className="w-[70px] sm:w-[74px] md:w-20 lg:w-22 h-auto object-contain pointer-events-none select-none drop-shadow-[0_8px_16px_rgba(0,0,0,0.7)]"
              draggable={false}
            />
          </motion.div>
        )}

        {/* 3. QUỲ CHẮP TAY (Kneeling Anjali) */}
        {currentPose === 'KNEELING_ANJALI' && (
          <motion.div
            key={`photorealistic_kneeling_${facingDirection}`}
            style={{
              transformOrigin: '50% 90%',
              scaleX: flipFactor,
            }}
            animate={{
              y: [0, -1, 0],
              scaleY: [0.98, 1, 0.98],
            }}
            transition={{
              duration: 4.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative flex items-center justify-center"
          >
            <img
              src={avatarImageSrc}
              onError={(e) => {
                (e.target as HTMLImageElement).src = fallbackImageSrc;
              }}
              alt="Hành giả quỳ chắp tay"
              className="w-[70px] sm:w-[74px] md:w-20 lg:w-22 h-auto object-contain pointer-events-none select-none drop-shadow-[0_8px_16px_rgba(0,0,0,0.7)]"
              draggable={false}
            />
          </motion.div>
        )}

        {/* 4. ĐỨNG TRANG NGHIÊM (Standing Anjali) */}
        {currentPose === 'STANDING_ANJALI' && (
          <motion.div
            key={`photorealistic_standing_${facingDirection}`}
            style={{
              transformOrigin: '50% 90%',
              scaleX: flipFactor,
            }}
            animate={{
              y: [0, -1, 0],
            }}
            transition={{
              duration: 4.0,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative flex items-center justify-center -translate-y-2"
          >
            <img
              src={avatarImageSrc}
              onError={(e) => {
                (e.target as HTMLImageElement).src = fallbackImageSrc;
              }}
              alt="Hành giả đứng trang nghiêm"
              className="w-[70px] sm:w-[74px] md:w-20 lg:w-22 h-auto object-contain pointer-events-none select-none drop-shadow-[0_8px_16px_rgba(0,0,0,0.7)]"
              draggable={false}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
