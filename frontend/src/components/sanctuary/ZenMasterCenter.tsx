import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';

interface ZenMasterCenterProps {
  zenMasterUrl?: string;
}

/**
 * Vị Thiền sư khổ hạnh (Photorealistic Ascetic Zen Master):
 * - Ngồi kiết già trang nghiêm dưới cội Bồ đề đại thụ trung tâm.
 * - Tọa độ: X: 50.4%, Y: 55.0%
 * - CHỈ HIỂN THỊ TÊN KHI ĐƯA CHUỘT HOẶC CLICK VÀO THIỀN SƯ.
 * - Khi click vào Thiền sư: hiển thị lời khai thị chánh niệm thanh tịnh.
 */
export const ZenMasterCenter: React.FC<ZenMasterCenterProps> = ({
  zenMasterUrl = '/assets/sanctuary/zen-master-figure.png',
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  return (
    <>
      <div
        className="absolute z-15 flex flex-col items-center select-none"
        style={{
          left: '50.4%',
          top: '52.8%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        {/* Subtle warm golden sunlight aura behind the Zen Master */}
        <motion.div
          className="absolute -top-10 w-44 h-44 md:w-56 md:h-56 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(255, 243, 204, 0.28) 0%, rgba(217, 167, 90, 0.12) 50%, rgba(24, 40, 26, 0) 75%)',
            filter: 'blur(16px)',
            mixBlendMode: 'screen',
          }}
          animate={{
            scale: isHovered || isClicked ? [1.05, 1.14, 1.05] : [0.97, 1.04, 0.97],
            opacity: isHovered || isClicked ? 0.95 : [0.55, 0.85, 0.55],
          }}
          transition={{
            duration: 6.0,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* 
          BIỂN TÊN THIỀN SƯ AN TRÚ:
          Theo yêu cầu: CHỈ HIỂN THỊ KHI ĐƯA CHUỘT HOẶC CLICK VÀO THIỀN SƯ.
          Bình thường hoàn toàn ẩn (opacity 0), khi hover hoặc click sẽ hiện lên mượt mà.
        */}
        <div
          className={`absolute -top-9 z-20 transition-all duration-300 transform pointer-events-none ${
            isHovered || isClicked
              ? 'opacity-100 scale-100 translate-y-0'
              : 'opacity-0 scale-90 translate-y-2'
          }`}
        >
          <div className="px-3.5 py-1 rounded-full bg-[#111e13]/90 border border-[#d9a75a]/75 shadow-2xl backdrop-blur-md flex items-center gap-1.5 ring-1 ring-[#d9a75a]/30">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d9a75a] animate-pulse" />
            <span className="font-serif text-[11px] md:text-xs tracking-wider text-[#f7e7c4] font-medium whitespace-nowrap">
              Thiền Sư An Trú
            </span>
          </div>
        </div>

        {/* 
          HÌNH TƯỢNG THIỀN SƯ CHÂN THỰC (Interactive Hit Area)
          - Đưa chuột hoặc click vào để tương tác và xem tên/lời khai thị
        */}
        <div
          className="relative cursor-pointer group pointer-events-auto flex flex-col items-center focus:outline-none"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          onClick={() => {
            setIsClicked(true);
            setShowDialog(true);
          }}
          title="Thiền Sư An Trú - Nhấn để tiếp nhận lời khai thị chánh niệm"
        >
          {/* Contact shadow under straw mat */}
          <div
            className="absolute -bottom-2 w-32 md:w-40 h-8 rounded-full pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at center, rgba(12, 20, 14, 0.85) 0%, rgba(12, 20, 14, 0.3) 55%, transparent 75%)',
            }}
          />

          {/* Photorealistic Zen Master Figure */}
          <motion.div
            animate={{
              y: [0, -1.8, 0],
              scaleY: [1, 1.014, 1],
            }}
            transition={{
              duration: 6.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="relative flex items-center justify-center"
          >
            <img
              src={zenMasterUrl}
              alt="Thiền Sư An Trú tĩnh tọa dưới cội Bồ đề"
              className="w-36 sm:w-40 md:w-44 lg:w-48 h-auto object-contain pointer-events-none select-none drop-shadow-[0_12px_22px_rgba(0,0,0,0.85)] filter transition-all duration-300 group-hover:drop-shadow-[0_0_24px_rgba(255,230,150,0.65)] group-hover:brightness-105"
              draggable={false}
            />
          </motion.div>
        </div>
      </div>

      {/* LỜI KHAI THỊ KHI CLICK VÀO THIỀN SƯ */}
      <AnimatePresence>
        {showDialog && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm pointer-events-auto"
            onClick={() => {
              setShowDialog(false);
              setIsClicked(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 8 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-md w-full sanctuary-glass p-6 md:p-7 rounded-3xl border border-[#d9a75a]/50 shadow-2xl text-center text-[#f0f4ef] relative"
            >
              <button
                type="button"
                onClick={() => {
                  setShowDialog(false);
                  setIsClicked(false);
                }}
                className="absolute top-4 right-4 p-1.5 rounded-full text-[#a9bca6] hover:text-white hover:bg-white/10 transition-colors"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#d9a75a]/20 border border-[#d9a75a]/50 flex items-center justify-center text-[#ffd27d]">
                <Sparkles className="w-6 h-6 text-[#d9a75a]" />
              </div>

              <h3 className="font-serif text-xl text-[#ffeec9] font-medium tracking-wide mb-1">
                Thiền Sư An Trú
              </h3>
              <p className="text-xs text-[#a9bca6] mb-4">
                Bậc Thầy Tỉnh Thức • An Trú Trong Đại Định
              </p>

              <blockquote className="italic font-serif text-sm md:text-base text-[#e2ede0] leading-relaxed px-4 py-3 bg-black/35 rounded-2xl border border-white/5 mb-5 shadow-inner">
                « Thở vào tâm tĩnh lặng,
                <br />
                Thở ra miệng mỉm cười.
                <br />
                An trú trong hiện tại,
                <br />
                Giờ phút đẹp tuyệt vời. »
              </blockquote>

              <p className="text-xs text-[#8da589] leading-relaxed mb-6 px-2">
                Vạn pháp quy tâm, tâm an vạn sự an. Khi thân tâm hòa vào từng hơi thở chánh niệm,
                mỗi tấc đất dưới cội đại thụ này đều là chốn bình yên đích thực.
              </p>

              <button
                type="button"
                onClick={() => {
                  setShowDialog(false);
                  setIsClicked(false);
                }}
                className="w-full py-2.5 rounded-xl bg-[#d9a75a] hover:bg-[#c99547] text-[#121f14] font-medium text-sm transition-all shadow-lg cursor-pointer"
              >
                Lĩnh Hội & Trở Về Hơi Thở
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
