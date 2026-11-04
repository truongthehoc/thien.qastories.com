import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  UserProfile,
  PointHistoryItem,
  LeaderboardEntry,
} from '../../types/sanctuary';
import {
  Award,
  Clock,
  HandHeart,
  History,
  Users,
  X,
  LogOut,
  Sparkles,
} from 'lucide-react';

interface UserProfileDrawerProps {
  user: UserProfile;
  pointHistory: PointHistoryItem[];
  leaderboard: LeaderboardEntry[];
  onRefreshData: () => void;
  onChangeNameOrLogout: () => void;
}

export const UserProfileDrawer: React.FC<UserProfileDrawerProps> = ({
  user,
  pointHistory,
  leaderboard,
  onRefreshData,
  onChangeNameOrLogout,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'SUMMARY' | 'HISTORY' | 'FELLOWS'>('SUMMARY');

  const handleOpen = () => {
    setIsOpen(true);
    onRefreshData();
  };

  return (
    <>
      {/* Bottom Right Compact Pill */}
      <div className="fixed bottom-3 right-3 z-30 pointer-events-auto">
        <button
          type="button"
          onClick={handleOpen}
          className="flex items-center gap-1.5 sm:gap-3 p-1.5 sm:px-4 sm:py-2 rounded-2xl sanctuary-glass hover:border-[#d9a75a]/55 shadow-xl transition-all cursor-pointer"
          title={`${user.displayName} • ${user.totalPoints} điểm an trú`}
        >
          <div className="w-8 h-8 rounded-xl bg-[#d9a75a]/25 border border-[#d9a75a]/50 flex items-center justify-center text-[#ffe3a3] font-serif font-bold text-sm shrink-0">
            {user.displayName.charAt(0).toUpperCase()}
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-semibold text-[#fff6dc] leading-tight">
              {user.displayName}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-[#ffe3a3]">
              <Sparkles className="w-3 h-3 text-[#d9a75a]" />
              <span>{user.totalPoints} điểm an trú</span>
              <span className="text-[#8ea885]">•</span>
              <span className="text-[#b8c8b4]">{user.totalMeditationMinutes} phút thiền</span>
            </div>
          </div>
        </button>
      </div>

      {/* Modal / Drawer for User Practice Record & Mindful Leaderboard */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-end p-0 sm:p-4 bg-black/45 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              transition={{ duration: 0.25 }}
              className="w-full sm:max-w-md h-[82vh] sm:h-[600px] rounded-t-3xl sm:rounded-3xl sanctuary-glass p-6 flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[#d9a75a]/20 border border-[#d9a75a]/50 flex items-center justify-center font-serif font-bold text-lg text-[#ffe3a3]">
                    {user.displayName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="font-serif text-base font-semibold text-[#fff6dc]">
                      {user.displayName}
                    </h2>
                    <p className="text-xs text-[#b3c3af]">
                      Hành giả Thiền Viên • Duy trì {user.streakDays || 1} ngày
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full text-[#a6b7a2] hover:text-[#fff6dc] hover:bg-white/10"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Navigation Tabs */}
              <div className="grid grid-cols-3 gap-1.5 my-4 p-1 rounded-xl bg-[#0b140d]/80 border border-white/10">
                <button
                  type="button"
                  onClick={() => setActiveTab('SUMMARY')}
                  className={`py-2 rounded-lg text-xs font-medium transition-all ${
                    activeTab === 'SUMMARY'
                      ? 'bg-[#d9a75a] text-[#111d13] font-semibold'
                      : 'text-[#b7c6b3] hover:text-[#fff6dc]'
                  }`}
                >
                  Hồ sơ thực hành
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('HISTORY')}
                  className={`py-2 rounded-lg text-xs font-medium transition-all ${
                    activeTab === 'HISTORY'
                      ? 'bg-[#d9a75a] text-[#111d13] font-semibold'
                      : 'text-[#b7c6b3] hover:text-[#fff6dc]'
                  }`}
                >
                  Nhật ký điểm
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('FELLOWS')}
                  className={`py-2 rounded-lg text-xs font-medium transition-all ${
                    activeTab === 'FELLOWS'
                      ? 'bg-[#d9a75a] text-[#111d13] font-semibold'
                      : 'text-[#b7c6b3] hover:text-[#fff6dc]'
                  }`}
                >
                  Bảng Đồng Tu
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                {activeTab === 'SUMMARY' && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-2.5">
                      <div className="p-3.5 rounded-2xl bg-[#0e1a10]/85 border border-[#d9a75a]/30 text-center">
                        <Award className="w-5 h-5 text-[#d9a75a] mx-auto mb-1" />
                        <p className="text-lg font-bold text-[#ffe3a3]">{user.totalPoints}</p>
                        <p className="text-[11px] text-[#a9ba9f]">Điểm An Trú</p>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-[#0e1a10]/85 border border-white/10 text-center">
                        <Clock className="w-5 h-5 text-[#9bc497] mx-auto mb-1" />
                        <p className="text-lg font-bold text-[#fff6dc]">
                          {user.totalMeditationMinutes}p
                        </p>
                        <p className="text-[11px] text-[#a9ba9f]">Thời gian thiền</p>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-[#0e1a10]/85 border border-white/10 text-center">
                        <HandHeart className="w-5 h-5 text-[#e6b67e] mx-auto mb-1" />
                        <p className="text-lg font-bold text-[#fff6dc]">
                          {user.totalBowingCount}
                        </p>
                        <p className="text-[11px] text-[#a9ba9f]">Lượt đảnh lễ</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#0e1a10]/70 border border-white/10 space-y-2 text-xs text-[#c6d4c2]">
                      <p className="font-serif font-semibold text-[#ffe3a3]">
                        Quy tắc ghi nhận thực hành an trú:
                      </p>
                      <ul className="space-y-1.5 text-[11px] text-[#b4c4b0]">
                        <li>• Hoàn thành một lượt đảnh lễ Thiền sư: +5 điểm</li>
                        <li>• Ngồi thiền trọn vẹn 5 phút: +5 điểm</li>
                        <li>• Ngồi thiền trọn vẹn 10 phút: +10 điểm</li>
                        <li>• Ngồi thiền trọn vẹn 15 phút: +15 điểm</li>
                        <li>• Ngồi thiền trọn vẹn 30 phút: +30 điểm</li>
                      </ul>
                      <p className="text-[10px] text-[#8fa18c] italic pt-1">
                        Điểm thực hành được xác thực thời gian thực tại hệ thống máy chủ nhằm khuyến khích sự kiên trì, tĩnh tại mỗi ngày.
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === 'HISTORY' && (
                  <div className="space-y-2">
                    {pointHistory.length === 0 ? (
                      <div className="py-12 text-center text-xs text-[#8fa18c]">
                        <History className="w-7 h-7 mx-auto mb-2 opacity-50" />
                        Chưa có lịch sử ghi nhận điểm trong phiên này. Hãy chọn một tọa cụ để bắt đầu đảnh lễ hoặc ngồi thiền.
                      </div>
                    ) : (
                      pointHistory.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 rounded-xl bg-[#0e1a10]/80 border border-white/10 text-xs"
                        >
                          <div>
                            <p className="font-medium text-[#fff6dc]">{item.description}</p>
                            <p className="text-[10px] text-[#8fa18c]">
                              {new Date(item.createdAt).toLocaleString('vi-VN')}
                            </p>
                          </div>
                          <span className="px-2.5 py-1 rounded-full bg-[#d9a75a]/20 text-[#ffe3a3] font-semibold">
                            +{item.points} điểm
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {activeTab === 'FELLOWS' && (
                  <div className="space-y-2">
                    <p className="text-[11px] text-[#a9ba9f] italic mb-2">
                      Bảng đạo hữu đồng tu ghi nhận tinh thần thực hành bền bỉ, cùng lan tỏa năng lượng bình an trong Thiền Viên.
                    </p>
                    {leaderboard.length === 0 ? (
                      <div className="py-10 text-center text-xs text-[#8fa18c]">
                        <Users className="w-7 h-7 mx-auto mb-2 opacity-50" />
                        Đang cập nhật danh sách đạo hữu đồng tu...
                      </div>
                    ) : (
                      leaderboard.map((entry, idx) => (
                        <div
                          key={entry.userId}
                          className={`flex items-center justify-between p-3 rounded-xl border text-xs ${
                            entry.userId === user.id
                              ? 'bg-[#d9a75a]/15 border-[#d9a75a]/45'
                              : 'bg-[#0e1a10]/80 border-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <span className="w-5 text-center font-serif font-semibold text-[#d9a75a]">
                              {idx + 1}
                            </span>
                            <div>
                              <p className="font-medium text-[#fff6dc]">
                                {entry.displayName}
                              </p>
                              <p className="text-[10px] text-[#94a691]">
                                {entry.totalMeditationMinutes} phút thiền • {entry.totalBowingCount} lễ
                              </p>
                            </div>
                          </div>
                          <span className="font-semibold text-[#ffe3a3]">
                            {entry.totalPoints} điểm
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="pt-3 mt-2 border-t border-white/10 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onChangeNameOrLogout();
                  }}
                  className="flex items-center gap-1.5 text-xs text-[#b5c4b1] hover:text-red-300 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Đổi pháp danh / Rời phiên</span>
                </button>
                <span className="text-[10px] text-[#7c8f79]">
                  THIỀN VIÊN • An trú hiện tại
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
};
