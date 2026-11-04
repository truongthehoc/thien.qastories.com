import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Leaf } from 'lucide-react';

interface WelcomeModalProps {
  welcomeTitle: string;
  welcomeMessage: string;
  onEnterSanctuary: (displayName: string, avatarStyle: string) => Promise<void>;
}

const AVATAR_STYLES = [
  { id: 'monastic_brown', label: 'Áo Nâu Đất', color: '#7D5736' },
  { id: 'ochre_gold', label: 'Y Vàng Trầm', color: '#9D7132' },
  { id: 'lam_grey', label: 'Áo Lam Khói', color: '#57686B' },
  { id: 'moss_robe', label: 'Xanh Rêu Rừng', color: '#4A5D46' },
];

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  welcomeTitle,
  welcomeMessage,
  onEnterSanctuary,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [avatarStyle, setAvatarStyle] = useState('monastic_brown');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = displayName.trim();
    if (cleaned.length < 2) {
      setError('Xin vui lòng nhập tên hiển thị hoặc pháp danh (tối thiểu 2 ký tự).');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await onEnterSanctuary(cleaned, avatarStyle);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/65 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="relative w-full max-w-md rounded-3xl sanctuary-glass p-7 md:p-9 shadow-[0_25px_70px_rgba(0,0,0,0.85)] text-center overflow-hidden"
      >
        {/* Subtle top light glow */}
        <div
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-44 rounded-full pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(217, 167, 90, 0.28) 0%, rgba(217, 167, 90, 0) 70%)',
          }}
        />

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-12 h-12 rounded-2xl bg-[#d9a75a]/15 border border-[#d9a75a]/40 flex items-center justify-center mb-4 shadow-inner">
            <Leaf className="w-6 h-6 text-[#d9a75a]" />
          </div>

          <p className="text-[11px] uppercase tracking-[0.25em] text-[#d9a75a] font-medium mb-1.5">
            Không Gian An Trú Trực Tuyến
          </p>

          <h1 className="font-serif text-2xl md:text-3xl font-semibold text-[#fff6dc] leading-snug mb-3">
            {welcomeTitle || 'Chào mừng bạn đến với Thiền Viên'}
          </h1>

          <p className="text-sm text-[#d4ded2] leading-relaxed mb-6 font-light italic">
            “{welcomeMessage ||
              'Giữa cuộc sống bộn bề, hãy dành một chút thời gian để trở về với sự bình an trong tâm.'}”
          </p>

          <form onSubmit={handleSubmit} className="w-full space-y-5 text-left">
            <div>
              <label className="block text-xs text-[#c2d0bf] mb-2 font-medium">
                Tên hiển thị hoặc Pháp danh của bạn
              </label>
              <input
                type="text"
                maxLength={40}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Ví dụ: Tâm An, Minh Tịnh, An Nhiên..."
                autoFocus
                className="w-full px-4 py-3 rounded-xl bg-[#0b140d]/85 border border-[#8ea885]/35 text-[#fff6dc] placeholder-[#788c75] text-sm focus:outline-none focus:border-[#d9a75a] focus:ring-1 focus:ring-[#d9a75a]/50 transition-all"
              />
              {error && (
                <p className="mt-1.5 text-xs text-[#f29b76]">{error}</p>
              )}
            </div>

            <div>
              <label className="block text-xs text-[#c2d0bf] mb-2 font-medium">
                Màu y phục hành thiền
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {AVATAR_STYLES.map((style) => (
                  <button
                    key={style.id}
                    type="button"
                    onClick={() => setAvatarStyle(style.id)}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-xl border text-xs transition-all ${
                      avatarStyle === style.id
                        ? 'bg-[#d9a75a]/20 border-[#d9a75a] text-[#fff6dc] font-medium shadow'
                        : 'bg-[#0e1910]/60 border-white/10 text-[#b7c5b4] hover:border-white/25'
                    }`}
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/30"
                      style={{ backgroundColor: style.color }}
                    />
                    <span className="truncate">{style.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 px-6 rounded-xl bg-gradient-to-r from-[#b8863b] via-[#d9a75a] to-[#b8863b] text-[#111d13] font-semibold text-sm tracking-wide shadow-[0_8px_25px_rgba(217,167,90,0.35)] hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isSubmitting ? 'Đang bước vào rừng thiền...' : 'Bước Vào Thiền Viên'}</span>
            </button>
          </form>

          <p className="mt-4 text-[11px] text-[#8fa18c]">
            Không cần đăng ký tài khoản • Trải nghiệm tĩnh lặng thời gian thực
          </p>
        </div>
      </motion.div>
    </div>
  );
};
