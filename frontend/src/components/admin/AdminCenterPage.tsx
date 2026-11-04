import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { apiRequest } from '../../services/api';
import {
  SanctuarySeat,
  AudioTrackItem,
  AudioScheduleItem,
  SystemSettingsConfig,
  SanctuaryAnnouncement,
  AdminAccountProfile,
} from '../../types/sanctuary';
import {
  LayoutDashboard,
  MapPin,
  Music,
  Users,
  Settings,
  RefreshCw,
  ArrowLeft,
  Clock,
  Sparkles,
  HandHeart,
  Eye,
  Unlock,
  Power,
  Upload,
  Trash2,
  Plus,
  Ban,
  CheckCircle2,
  Save,
  RotateCcw,
  FlipHorizontal,
  Lock,
  LogOut,
  KeyRound,
  EyeOff,
  Leaf,
  Bell,
  Megaphone,
  UserCheck,
  ShieldCheck,
  UserCog,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

interface AdminDashboardData {
  stats: {
    totalOnline: number;
    meditatingCount: number;
    bowingCount: number;
    emptySeatsCount: number;
    occupiedSeatsCount: number;
    totalVisitsToday: number;
    totalMeditationMinutes: number;
    totalBows: number;
    totalPointsAwarded: number;
  };
  seats: SanctuarySeat[];
  users: Array<{
    id: string;
    displayName: string;
    avatarStyle: string;
    status: 'ACTIVE' | 'RESTRICTED' | 'BANNED';
    restrictionReason?: string;
    totalPoints: number;
    totalMeditationMinutes: number;
    totalMeditationCount: number;
    totalBowingCount: number;
    lastSeenAt: string;
  }>;
  audioTracks: AudioTrackItem[];
  audioSchedules: AudioScheduleItem[];
  announcements?: SanctuaryAnnouncement[];
  adminProfile?: AdminAccountProfile;
  settings: SystemSettingsConfig;
  activityLogs: Array<{
    id: string;
    displayName?: string;
    action: string;
    detail: string;
    createdAt: string;
  }>;
  charts: {
    dailyActivity: Array<{
      day: string;
      minutes: number;
      bows: number;
      participants: number;
    }>;
    peakHours: Array<{
      hour: string;
      count: number;
    }>;
  };
}

type AdminTab =
  | 'OVERVIEW'
  | 'SPACE'
  | 'CHARACTERS'
  | 'AUDIO'
  | 'ANNOUNCEMENTS'
  | 'USERS'
  | 'SETTINGS'
  | 'ACCOUNT';

export const AdminCenterPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('OVERVIEW');
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Audio Form States
  const [trackTitle, setTrackTitle] = useState('');
  const [trackDesc, setTrackDesc] = useState('');
  const [trackCategory, setTrackCategory] =
    useState<AudioTrackItem['category']>('NHAC_THIEN');
  const [trackDuration, setTrackDuration] = useState('300');
  const [trackIsAmbient, setTrackIsAmbient] = useState(false);
  const [selectedMp3File, setSelectedMp3File] = useState<File | null>(null);

  // Schedule Form States
  const [schedName, setSchedName] = useState('');
  const [schedStartTime, setSchedStartTime] = useState('05:00');
  const [schedEndTime, setSchedEndTime] = useState('07:00');
  const [schedDurationMin, setSchedDurationMin] = useState('120');
  const [schedTrackId, setSchedTrackId] = useState('');
  const [schedGapSec, setSchedGapSec] = useState('5');

  // Helper for Local Datetime Input
  const formatLocalInputDate = (offsetMinutes = 0) => {
    const d = new Date(Date.now() + offsetMinutes * 60 * 1000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  // Announcements Form States
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annType, setAnnType] = useState<'INFO' | 'EVENT' | 'REMINDER'>('INFO');
  const [annStartTime, setAnnStartTime] = useState(() => formatLocalInputDate(0));
  const [annEndTime, setAnnEndTime] = useState(() => formatLocalInputDate(24 * 60));
  const [annIsMarquee, setAnnIsMarquee] = useState(true);
  const [annScrollSpeed, setAnnScrollSpeed] = useState<'SLOW' | 'NORMAL' | 'FAST'>('NORMAL');
  const [annRepeatInterval, setAnnRepeatInterval] = useState('0');
  const [annDurationDisplay, setAnnDurationDisplay] = useState('30');

  // Settings Form State
  const [settingsForm, setSettingsForm] = useState<SystemSettingsConfig | null>(null);
  const [uploadingCharacter, setUploadingCharacter] = useState<string | null>(null);

  // Admin Account Profile Form States
  const [profileDisplayName, setProfileDisplayName] = useState('');
  const [profileUsername, setProfileUsername] = useState('');
  const [profileEmail, setProfileEmail] = useState('');
  const [profileCurrentPassword, setProfileCurrentPassword] = useState('');
  const [profileNewPassword, setProfileNewPassword] = useState('');
  const [profileConfirmPassword, setProfileConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Audio Upload Progress State
  const [audioUploadProgress, setAudioUploadProgress] = useState<number | null>(null);
  const [isUploadingAudio, setIsUploadingAudio] = useState(false);
  const [uploadBytesInfo, setUploadBytesInfo] = useState<{ loaded: number; total: number } | null>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // System Purge / Launch Reset State
  const [isPurging, setIsPurging] = useState(false);

  const handlePurgeTestData = async () => {
    const confirmed = window.confirm(
      'CẢNH BÁO XÓA DỮ LIỆU THỬ NGHIỆM:\n\nBạn có chắc chắn muốn xóa toàn bộ tài khoản thử nghiệm, lịch sử thiền định, đảnh lễ, điểm số và nhật ký hoạt động để đưa Thiền Viện về trạng thái thanh tịnh ban đầu sẵn sàng ra mắt không?\n\n(Lưu ý: Tài khoản Admin, bài nhạc MP3, hình ảnh và cài đặt sẽ được bảo lưu an toàn 100%).'
    );
    if (!confirmed) return;

    setIsPurging(true);
    try {
      const res = await apiRequest<{ success: boolean; message: string }>('/api/admin/system/purge-test-data', {
        method: 'POST',
      });
      showToast(res.message || 'Đã dọn sạch dữ liệu thử nghiệm!');
      fetchDashboard();
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi xóa dữ liệu thử nghiệm');
    } finally {
      setIsPurging(false);
    }
  };

  // Admin Authentication State
  const [adminToken, setAdminToken] = useState<string | null>(() =>
    localStorage.getItem('thien_vien_admin_token')
  );
  const [loginUsername, setLoginUsername] = useState('admin');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [isSubmittingLogin, setIsSubmittingLogin] = useState(false);

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setIsSubmittingLogin(true);
    try {
      const res = await apiRequest<{ ok: boolean; token: string }>('/api/admin/auth/login', {
        method: 'POST',
        body: JSON.stringify({
          username: loginUsername,
          password: loginPassword,
        }),
      });
      if (res.token) {
        localStorage.setItem('thien_vien_admin_token', res.token);
        setAdminToken(res.token);
        setLoginPassword('');
        showToast('Đăng nhập Quản Trị thành công!');
      }
    } catch (err) {
      setLoginError((err as Error).message || 'Sai tài khoản hoặc mật khẩu quản trị.');
    } finally {
      setIsSubmittingLogin(false);
    }
  };

  const handleAdminLogout = () => {
    localStorage.removeItem('thien_vien_admin_token');
    setAdminToken(null);
    showToast('Đã đăng xuất phiên làm việc quản trị.');
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const handleCharacterUpload = async (
    characterType: 'zenMaster' | 'practitionerRight' | 'practitionerLeft' | 'practitionerCenter',
    file: File
  ) => {
    setUploadingCharacter(characterType);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('characterType', characterType);

      const res = await fetch('/api/admin/characters/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || 'Tải ảnh lên thất bại');
      }

      showToast('Đã tải lên và thay đổi nhân vật thành công!');
      fetchDashboard();
    } catch (err) {
      showToast((err as Error).message);
    } finally {
      setUploadingCharacter(null);
    }
  };

  const handleResetCharacter = async (
    characterType: 'zenMaster' | 'practitionerRight' | 'practitionerLeft' | 'practitionerCenter'
  ) => {
    const defaultUrls: Record<string, string> = {
      zenMaster: '/assets/sanctuary/zen-master-figure.png',
      practitionerLeft: '/assets/sanctuary/practitioner-left.png',
      practitionerRight: '/assets/sanctuary/practitioner-right.png',
      practitionerCenter: '/assets/sanctuary/practitioner-back.png',
    };

    const updateObj: Record<string, any> = {};
    if (characterType === 'zenMaster') updateObj.zenMasterUrl = defaultUrls.zenMaster;
    else if (characterType === 'practitionerRight') {
      updateObj.practitionerRightUrl = defaultUrls.practitionerRight;
      updateObj.practitionerRightFlip = false;
    } else if (characterType === 'practitionerLeft') {
      updateObj.practitionerLeftUrl = defaultUrls.practitionerLeft;
      updateObj.practitionerLeftFlip = false;
    } else if (characterType === 'practitionerCenter') updateObj.practitionerCenterUrl = defaultUrls.practitionerCenter;

    await apiRequest('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(updateObj),
    });
    showToast('Đã khôi phục nhân vật về mặc định.');
    fetchDashboard();
  };

  const handleToggleFlip = async (
    characterType: 'practitionerLeft' | 'practitionerRight'
  ) => {
    if (!data) return;
    const key = characterType === 'practitionerLeft' ? 'practitionerLeftFlip' : 'practitionerRightFlip';
    const currentVal = Boolean(data.settings[key]);
    const nextVal = !currentVal;

    await apiRequest('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify({ [key]: nextVal }),
    });
    showToast(nextVal ? 'Đã bật lật ngang hình ảnh (đảo hướng nhìn).' : 'Đã khôi phục hướng ban đầu của hình ảnh.');
    fetchDashboard();
  };

  const fetchDashboard = async () => {
    if (!adminToken) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await apiRequest<AdminDashboardData>('/api/admin/dashboard');
      setData(res);
      if (!settingsForm) {
        setSettingsForm(res.settings);
      }
      if (!schedTrackId && res.audioTracks.length > 0) {
        setSchedTrackId(res.audioTracks[0].id);
      }
    } catch (err: any) {
      if (err?.message?.includes('401') || err?.message?.includes('Unauthorized')) {
        handleAdminLogout();
      } else {
        showToast((err as Error).message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (adminToken) {
      fetchDashboard();
      const interval = setInterval(fetchDashboard, 10000);
      return () => clearInterval(interval);
    } else {
      setIsLoading(false);
    }
  }, [adminToken]);

  const handleReleaseSeat = async (seatId: number) => {
    await apiRequest(`/api/admin/seats/${seatId}/release`, { method: 'POST' });
    showToast(`Đã giải phóng vị trí #${String(seatId).padStart(2, '0')}`);
    fetchDashboard();
  };

  const handleToggleSeat = async (seatId: number, isEnabled: boolean) => {
    await apiRequest(`/api/admin/seats/${seatId}/toggle`, {
      method: 'PUT',
      body: JSON.stringify({ isEnabled }),
    });
    showToast(
      `Đã ${isEnabled ? 'bật' : 'tắt'} vị trí #${String(seatId).padStart(2, '0')}`
    );
    fetchDashboard();
  };

  const handleMp3FileSelected = (file: File | null) => {
    setSelectedMp3File(file);
    if (!file) return;

    // 1. Tự động lấy và làm sạch tên bài hát từ tên file upload
    let cleanName = file.name.replace(/\.[^/.]+$/, '');
    cleanName = cleanName
      .replace(/^[\d_-]+/, '')
      .replace(/\s*[-_]\s*\(\s*\d+\s*Kbps\s*\)/i, '')
      .replace(/[-_]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (cleanName) {
      setTrackTitle(cleanName);
    }

    // 2. Tự động trích xuất thời lượng chính xác bằng HTML5 Audio metadata
    try {
      const objectUrl = URL.createObjectURL(file);
      const tempAudio = new Audio(objectUrl);
      tempAudio.addEventListener('loadedmetadata', () => {
        if (tempAudio.duration && !isNaN(tempAudio.duration) && isFinite(tempAudio.duration)) {
          const durSec = Math.round(tempAudio.duration);
          setTrackDuration(String(durSec));
        }
        URL.revokeObjectURL(objectUrl);
      });
      tempAudio.addEventListener('error', () => {
        URL.revokeObjectURL(objectUrl);
      });
    } catch {
      // fallback
    }
  };

  const handleUploadTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackTitle.trim()) {
      showToast('Vui lòng chọn file MP3 hoặc nhập tên bài nhạc');
      return;
    }
    if (isUploadingAudio) return;

    setIsUploadingAudio(true);
    setAudioUploadProgress(0);
    setUploadBytesInfo(null);

    try {
      if (selectedMp3File && selectedMp3File.size > 15 * 1024 * 1024) {
        // Tải lên phân mảnh (Chunked Upload) cho file lớn để vượt qua giới hạn 100MB của Cloudflare & Nginx
        const CHUNK_SIZE = 8 * 1024 * 1024; // 8 MB mỗi mảnh
        const totalChunks = Math.ceil(selectedMp3File.size / CHUNK_SIZE);
        const uploadId = `up_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        let uploadedBytesSoFar = 0;

        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(selectedMp3File.size, start + CHUNK_SIZE);
          const chunkBlob = selectedMp3File.slice(start, end);

          const formData = new FormData();
          formData.append('chunk', chunkBlob);
          formData.append('uploadId', uploadId);
          formData.append('chunkIndex', String(i));
          formData.append('totalChunks', String(totalChunks));
          formData.append('fileName', selectedMp3File.name);
          formData.append('title', trackTitle.trim());
          formData.append('description', trackDesc.trim());
          formData.append('category', trackCategory);
          formData.append('durationSeconds', trackDuration);
          formData.append('isAmbientBg', String(trackIsAmbient));

          await new Promise<void>((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/admin/audio/upload/chunk');

            xhr.upload.onprogress = (event) => {
              if (event.lengthComputable && selectedMp3File) {
                const totalLoaded = uploadedBytesSoFar + event.loaded;
                const percent = Math.min(99, Math.round((totalLoaded / selectedMp3File.size) * 100));
                setAudioUploadProgress(percent);
                setUploadBytesInfo({ loaded: totalLoaded, total: selectedMp3File.size });
              }
            };

            xhr.onload = () => {
              if (xhr.status >= 200 && xhr.status < 300) {
                uploadedBytesSoFar += chunkBlob.size;
                resolve();
              } else {
                let errorMsg = 'Lỗi truyền phân mảnh file';
                try {
                  const resJson = JSON.parse(xhr.responseText);
                  if (resJson.message) {
                    errorMsg = Array.isArray(resJson.message) ? resJson.message.join(', ') : resJson.message;
                  }
                } catch {
                  if (xhr.responseText) errorMsg = xhr.responseText;
                }
                reject(new Error(errorMsg));
              }
            };

            xhr.onerror = () => reject(new Error('Lỗi kết nối khi gửi mảnh file lên máy chủ'));
            xhr.send(formData);
          });
        }
      } else {
        // Tải lên trực tiếp cho file vừa và nhỏ
        const formData = new FormData();
        if (selectedMp3File) {
          formData.append('file', selectedMp3File);
        }
        formData.append('title', trackTitle.trim());
        formData.append('description', trackDesc.trim());
        formData.append('category', trackCategory);
        formData.append('durationSeconds', trackDuration);
        formData.append('isAmbientBg', String(trackIsAmbient));

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', '/api/admin/audio/upload');

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));
              setAudioUploadProgress(percent);
              setUploadBytesInfo({ loaded: event.loaded, total: event.total });
            }
          };

          xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
            } else {
              let errorMsg = 'Tải file âm thanh thất bại';
              try {
                const resJson = JSON.parse(xhr.responseText);
                if (resJson.message) {
                  errorMsg = Array.isArray(resJson.message) ? resJson.message.join(', ') : resJson.message;
                }
              } catch {
                if (xhr.responseText) errorMsg = xhr.responseText;
              }
              reject(new Error(errorMsg));
            }
          };

          xhr.onerror = () => reject(new Error('Lỗi kết nối mạng khi tải file âm thanh lên máy chủ'));
          xhr.send(formData);
        });
      }

      setTrackTitle('');
      setTrackDesc('');
      setSelectedMp3File(null);
      setAudioUploadProgress(100);
      showToast('Đã lưu âm thanh vào thư viện Thiền Viện!');
      fetchDashboard();
    } catch (err: any) {
      showToast(err.message || 'Lỗi tải âm thanh');
    } finally {
      setTimeout(() => {
        setIsUploadingAudio(false);
        setAudioUploadProgress(null);
        setUploadBytesInfo(null);
      }, 1500);
    }
  };

  const handleToggleTrackEnabled = async (track: AudioTrackItem) => {
    await apiRequest('/api/admin/audio/tracks', {
      method: 'POST',
      body: JSON.stringify({ id: track.id, isEnabled: !track.isEnabled }),
    });
    fetchDashboard();
  };

  const handleToggleTrackAmbient = async (track: AudioTrackItem) => {
    await apiRequest('/api/admin/audio/tracks', {
      method: 'POST',
      body: JSON.stringify({ id: track.id, isAmbientBg: !track.isAmbientBg }),
    });
    showToast(!track.isAmbientBg ? 'Đã đặt làm nhạc nền chạy xuyên suốt' : 'Đã bỏ đặt làm nhạc nền');
    fetchDashboard();
  };

  const handleDeleteTrack = async (trackId: string) => {
    await apiRequest(`/api/admin/audio/tracks/${trackId}`, { method: 'DELETE' });
    showToast('Đã xóa bài nhạc');
    fetchDashboard();
  };

  const handleAddSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveTrackId = schedTrackId || data?.audioTracks[0]?.id;
    if (!effectiveTrackId) {
      showToast('Vui lòng chọn bài nhạc cho lịch phát');
      return;
    }

    const [sH, sM] = schedStartTime.split(':').map(Number);
    const [eH, eM] = schedEndTime.split(':').map(Number);
    const startMin = (sH || 0) * 60 + (sM || 0);
    let endMin = (eH || 0) * 60 + (eM || 0);
    if (endMin <= startMin) endMin += 24 * 60;
    const durationMinutes = endMin - startMin;

    const matchedTrack = data?.audioTracks.find((t) => t.id === effectiveTrackId);
    const finalName =
      schedName.trim() ||
      `Khung giờ ${schedStartTime} - ${schedEndTime} (${matchedTrack?.title || 'Thiền'})`;

    await apiRequest('/api/admin/audio/schedules', {
      method: 'POST',
      body: JSON.stringify({
        name: finalName,
        startTime: schedStartTime,
        endTime: schedEndTime,
        durationMinutes,
        trackId: effectiveTrackId,
        gapSeconds: Number(schedGapSec) || 0,
        isRepeatDaily: true,
        isEnabled: true,
      }),
    });
    setSchedName('');
    showToast(`Đã thêm lịch phát: ${schedStartTime} - ${schedEndTime}`);
    fetchDashboard();
  };

  const handleDeleteSchedule = async (id: string) => {
    await apiRequest(`/api/admin/audio/schedules/${id}`, { method: 'DELETE' });
    showToast('Đã xóa lịch phát');
    fetchDashboard();
  };

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle.trim() && !annContent.trim()) {
      showToast('Vui lòng nhập tiêu đề hoặc nội dung thông báo');
      return;
    }
    try {
      await apiRequest('/api/admin/announcements', {
        method: 'POST',
        body: JSON.stringify({
          title: annTitle.trim(),
          content: annContent.trim(),
          type: annType,
          startTime: annStartTime,
          endTime: annEndTime,
          isMarquee: annIsMarquee,
          scrollSpeed: annScrollSpeed,
          repeatIntervalMinutes: Number(annRepeatInterval) || 0,
          durationDisplaySeconds: Number(annDurationDisplay) || 30,
          isEnabled: true,
        }),
      });
      setAnnTitle('');
      setAnnContent('');
      showToast('Đã tạo và kích hoạt thông báo thành công!');
      fetchDashboard();
    } catch (err) {
      showToast((err as Error).message);
    }
  };

  const handleDeleteAnnouncement = async (id: string) => {
    try {
      await apiRequest(`/api/admin/announcements/${id}`, { method: 'DELETE' });
      showToast('Đã xóa thông báo');
      fetchDashboard();
    } catch (err) {
      showToast((err as Error).message);
    }
  };

  const handleToggleAnnouncement = async (id: string) => {
    try {
      await apiRequest(`/api/admin/announcements/${id}/toggle`, { method: 'PUT' });
      showToast('Đã cập nhật trạng thái thông báo');
      fetchDashboard();
    } catch (err) {
      showToast((err as Error).message);
    }
  };

  const handleUpdateUserStatus = async (
    userId: string,
    status: 'ACTIVE' | 'RESTRICTED' | 'BANNED'
  ) => {
    await apiRequest(`/api/admin/users/${userId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    showToast('Đã cập nhật trạng thái người tham gia');
    fetchDashboard();
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsForm) return;
    await apiRequest('/api/admin/settings', {
      method: 'PUT',
      body: JSON.stringify(settingsForm),
    });
    showToast('Đã lưu cấu hình hệ thống và đồng bộ realtime');
    fetchDashboard();
  };

  useEffect(() => {
    if (data?.adminProfile && !profileUsername) {
      setProfileDisplayName(data.adminProfile.displayName || '');
      setProfileUsername(data.adminProfile.username || '');
      setProfileEmail(data.adminProfile.email || '');
    }
  }, [data?.adminProfile]);

  const handleSaveAdminProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (profileNewPassword && profileNewPassword !== profileConfirmPassword) {
      showToast('Mật khẩu mới và xác nhận mật khẩu không khớp.');
      return;
    }
    if (profileNewPassword && profileNewPassword.length < 6) {
      showToast('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }

    const isChangingPass = Boolean(profileNewPassword && profileNewPassword.trim().length > 0);
    const isChangingUser = Boolean(
      data?.adminProfile &&
      profileUsername.trim().toLowerCase() !== data.adminProfile.username.toLowerCase()
    );

    if ((isChangingPass || isChangingUser) && !profileCurrentPassword) {
      showToast('Vui lòng nhập Mật khẩu hiện tại để xác thực thay đổi.');
      return;
    }

    setIsSavingProfile(true);
    try {
      await apiRequest('/api/admin/profile', {
        method: 'PUT',
        body: JSON.stringify({
          displayName: profileDisplayName.trim(),
          username: profileUsername.trim(),
          email: profileEmail.trim(),
          currentPassword: profileCurrentPassword,
          newPassword: profileNewPassword,
        }),
      });
      setProfileCurrentPassword('');
      setProfileNewPassword('');
      setProfileConfirmPassword('');
      showToast('Đã cập nhật thông tin tài khoản quản trị thành công!');
      fetchDashboard();
    } catch (err) {
      showToast((err as Error).message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  if (!adminToken) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#060d08] via-[#0d1810] to-[#060d08] px-4 font-sans select-text">
        <div className="w-full max-w-md bg-[#0f1d13]/95 backdrop-blur-xl rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.85)] border border-[#d9a75a]/35 p-8 text-[#f4f1ea]">
          <div className="text-center mb-6">
            <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-[#d9a75a]/20 border border-[#d9a75a]/45 flex items-center justify-center text-[#d9a75a] shadow-inner">
              <Leaf className="w-7 h-7 text-[#d9a75a]" />
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#ffe3a3] bg-[#d9a75a]/15 border border-[#d9a75a]/30 px-3.5 py-1 rounded-full">
              Hệ thống Quản trị Bảo mật
            </span>
            <h1 className="text-2xl font-serif font-bold text-[#fff6dc] mt-3">
              {data?.settings?.adminPortalTitle || 'Thiền Viên Admin Center'}
            </h1>
            <p className="text-xs text-[#a0b59d] mt-1">
              {data?.settings?.adminPortalSubtitle || 'Không gian an trú • Khu vực Ban Quản Trị'}
            </p>
          </div>

          {loginError && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/60 border border-red-500/40 text-red-200 text-xs flex items-center gap-2">
              <Ban className="w-4 h-4 shrink-0 text-red-400" />
              <span>{loginError}</span>
            </div>
          )}

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#ffe3a3] mb-1.5 font-serif">
                Tài khoản Quản trị
              </label>
              <div className="relative">
                <Users className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8ea885]" />
                <input
                  type="text"
                  required
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-[#d9a75a]/30 text-sm text-[#fff6dc] bg-[#08120a] focus:bg-[#0c180e] focus:outline-none focus:border-[#d9a75a] focus:ring-1 focus:ring-[#d9a75a] transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#ffe3a3] mb-1.5 font-serif">
                Mật khẩu
              </label>
              <div className="relative">
                <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#8ea885]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-10 py-2.5 rounded-lg border border-[#d9a75a]/30 text-sm text-[#fff6dc] bg-[#08120a] focus:bg-[#0c180e] focus:outline-none focus:border-[#d9a75a] focus:ring-1 focus:ring-[#d9a75a] transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8ea885] hover:text-[#ffe3a3]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmittingLogin}
              className="w-full mt-2 py-2.5 px-4 rounded-full bg-gradient-to-r from-[#b8863b] via-[#d9a75a] to-[#b8863b] text-[#111d13] font-bold text-sm shadow-[0_6px_20px_rgba(217,167,90,0.45)] hover:brightness-110 active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmittingLogin ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#111d13]" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4 text-[#111d13]" />
                  <span>Đăng nhập Quản Trị</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-[#d9a75a]/20 text-center">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 text-xs text-[#ffe3a3] hover:text-white transition font-medium"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Quay về Không gian Thiền Viên</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen h-screen overflow-hidden flex bg-[#09120a] text-[#f4f1ea] font-sans select-text">
      {/* Zen Sanctuary Admin Center Left Navigation Rail */}
      <aside className="w-64 bg-[#0d1810] border-r border-[#d9a75a]/20 flex flex-col shrink-0">
        <div className="px-4 py-4 border-b border-[#d9a75a]/20 flex items-center gap-3 bg-[#0a140d]/60">
          <div className="w-10 h-10 rounded-xl bg-[#d9a75a]/20 border border-[#d9a75a]/45 flex items-center justify-center shrink-0 shadow-inner">
            <Leaf className="w-5 h-5 text-[#d9a75a]" />
          </div>
          <div className="overflow-hidden">
            <h1 className="text-sm font-serif font-bold text-[#fff6dc] truncate leading-tight tracking-wide">
              {data?.settings?.adminPortalTitle || settingsForm?.adminPortalTitle || 'Thiền Viên Admin Center'}
            </h1>
            <p className="text-[10px] text-[#8ea885] truncate mt-0.5">
              {data?.settings?.adminPortalSubtitle || settingsForm?.adminPortalSubtitle || 'Không gian an trú • Ban Điều Hành'}
            </p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
          {[
            {
              group: 'TỔNG QUAN',
              items: [
                { id: 'OVERVIEW', label: '1. Dashboard tổng quan', icon: LayoutDashboard },
              ],
            },
            {
              group: 'HÌNH ẢNH, ÂM THANH & THÔNG BÁO',
              items: [
                { id: 'CHARACTERS', label: '2. Quản lý Nhân vật', icon: Sparkles },
                { id: 'AUDIO', label: '3. Âm thanh & Lịch phát', icon: Music },
                { id: 'ANNOUNCEMENTS', label: '4. Quản lý Thông báo', icon: Bell },
              ],
            },
            {
              group: 'VẬN HÀNH THIỀN VIỆN',
              items: [
                { id: 'SPACE', label: '5. Quản lý 50 vị trí thiền', icon: MapPin },
                { id: 'USERS', label: '6. Quản lý người tham gia', icon: Users },
              ],
            },
            {
              group: 'HỆ THỐNG & TÀI KHOẢN',
              items: [
                { id: 'SETTINGS', label: '7. Cấu hình hệ thống', icon: Settings },
                { id: 'ACCOUNT', label: '8. Thông tin tài khoản', icon: ShieldCheck },
              ],
            },
          ].map((sec) => (
            <div key={sec.group} className="space-y-1">
              <span className="px-3 text-[10px] font-bold text-[#8ea885]/80 uppercase tracking-wider font-serif">
                {sec.group}
              </span>
              <div className="space-y-0.5 mt-1">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  const active = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveTab(item.id as AdminTab)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                        active
                          ? 'bg-gradient-to-r from-[#d9a75a]/25 to-[#d9a75a]/5 text-[#ffe3a3] border-l-4 border-[#d9a75a] font-semibold shadow-sm'
                          : 'text-[#a7bda4] hover:bg-[#d9a75a]/10 hover:text-[#fff6dc]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#d9a75a]' : 'text-[#8ea885]'}`} />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-[#d9a75a]/20 space-y-2 bg-[#0a140d]/50">
          {/* Quick Admin Profile Card */}
          {data?.adminProfile && (
            <button
              type="button"
              onClick={() => setActiveTab('ACCOUNT')}
              className={`w-full flex items-center gap-2.5 p-2 rounded-xl border text-left transition-all cursor-pointer ${
                activeTab === 'ACCOUNT'
                  ? 'bg-[#d9a75a]/25 border-[#d9a75a] text-[#ffe3a3] shadow-sm'
                  : 'bg-[#060c07]/80 border-[#d9a75a]/20 hover:border-[#d9a75a]/50 text-[#c8d9c5]'
              }`}
            >
              <div className="w-8 h-8 rounded-lg bg-[#d9a75a]/20 border border-[#d9a75a]/45 flex items-center justify-center shrink-0 text-[#d9a75a]">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div className="overflow-hidden flex-1 min-w-0">
                <p className="text-xs font-serif font-bold text-[#fff6dc] truncate">
                  {data.adminProfile.displayName || data.adminProfile.username}
                </p>
                <p className="text-[10px] text-[#8ea885] truncate">
                  @{data.adminProfile.username} • Admin
                </p>
              </div>
            </button>
          )}

          <button
            type="button"
            onClick={handleAdminLogout}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-red-500/30 text-red-300 hover:bg-red-500/15 text-xs font-medium transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Đăng xuất Quản trị</span>
          </button>
          <Link
            to="/"
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-gradient-to-r from-[#172c1c] to-[#25422b] hover:brightness-110 text-[#fff6dc] border border-[#d9a75a]/30 text-xs font-medium transition-all shadow-sm"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Trở về Không gian Thiền</span>
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden bg-[#0a130b]">
        {/* Top Command Bar */}
        <header className="h-14 bg-[#0d1810] border-b border-[#d9a75a]/20 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold font-serif text-[#fff6dc] tracking-wide">
              {activeTab === 'OVERVIEW' && '1. Dashboard tổng quan & Thống kê thời gian thực'}
              {activeTab === 'CHARACTERS' && '2. Quản lý & Tải lên thay đổi hình ảnh Nhân vật Thiền'}
              {activeTab === 'AUDIO' && '3. Quản lý Âm thanh, Playlist & Lập lịch phát'}
              {activeTab === 'ANNOUNCEMENTS' && '4. Quản lý Thông báo, Chạy chữ & Lịch hiển thị'}
              {activeTab === 'SPACE' && '5. Quản lý Không gian & Trạng thái 50 tọa cụ'}
              {activeTab === 'USERS' && '6. Quản lý Người tham gia & Lịch sử thực hành'}
              {activeTab === 'SETTINGS' && '7. Cấu hình Hệ thống & Quy tắc tính điểm'}
              {activeTab === 'ACCOUNT' && '8. Thông tin Tài khoản Quản trị & Cập nhật Bảo mật'}
            </h2>
            {toast && (
              <span className="px-3 py-1 rounded-full bg-[#d9a75a]/20 text-[#ffe3a3] border border-[#d9a75a]/40 text-xs font-medium animate-pulse">
                {toast}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={fetchDashboard}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#d9a75a]/30 hover:bg-[#d9a75a]/15 text-xs text-[#ffe3a3] transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#d9a75a]' : 'text-[#8ea885]'}`} />
            <span>Làm mới dữ liệu</span>
          </button>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {data && activeTab === 'OVERVIEW' && (
            <>
              {/* 8 KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  {
                    label: 'Tổng lượt truy cập hôm nay',
                    val: data.stats.totalVisitsToday,
                    icon: Eye,
                  },
                  {
                    label: 'Số người đang online',
                    val: data.stats.totalOnline,
                    icon: Users,
                  },
                  {
                    label: 'Số người đang ngồi thiền',
                    val: data.stats.meditatingCount,
                    icon: Sparkles,
                  },
                  {
                    label: 'Số người đang đảnh lễ',
                    val: data.stats.bowingCount,
                    icon: HandHeart,
                  },
                  {
                    label: 'Vị trí đang sử dụng',
                    val: `${data.stats.occupiedSeatsCount} / 50`,
                    icon: MapPin,
                  },
                  {
                    label: 'Tổng thời gian thiền',
                    val: `${data.stats.totalMeditationMinutes} phút`,
                    icon: Clock,
                  },
                  {
                    label: 'Tổng lượt đảnh lễ',
                    val: data.stats.totalBows,
                    icon: HandHeart,
                  },
                  {
                    label: 'Tổng điểm đã ghi nhận',
                    val: data.stats.totalPointsAwarded,
                    icon: CheckCircle2,
                  },
                ].map((kpi, idx) => {
                  const Icon = kpi.icon;
                  return (
                    <div
                      key={idx}
                      className="bg-[#111f14]/90 p-4 rounded-xl border border-[#d9a75a]/25 shadow-lg flex items-start justify-between"
                    >
                      <div>
                        <p className="text-xs text-[#a0b59d]">{kpi.label}</p>
                        <p className="text-2xl font-bold font-serif text-[#ffe3a3] mt-1">
                          {kpi.val}
                        </p>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#d9a75a]/15 border border-[#d9a75a]/30 text-[#d9a75a]">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 4 Analytics Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1 & 2: Meditation Minutes & Bowing Activity by Day */}
                <div className="bg-[#111f14]/90 p-5 rounded-xl border border-[#d9a75a]/25 shadow-lg">
                  <h3 className="text-xs font-semibold font-serif uppercase tracking-wider text-[#d9a75a] mb-4">
                    Thời lượng thiền (phút) & Lượt đảnh lễ theo ngày
                  </h3>
                  <div className="flex items-end justify-between h-44 gap-3 pt-4 px-2">
                    {data.charts.dailyActivity.map((item) => {
                      const maxMin = 600;
                      const heightPct = Math.min(100, Math.round((item.minutes / maxMin) * 100));
                      return (
                        <div
                          key={item.day}
                          className="flex-1 flex flex-col items-center gap-1.5"
                        >
                          <span className="text-[10px] font-medium text-[#ffe3a3]">
                            {item.minutes}p
                          </span>
                          <div className="w-full h-32 bg-[#09120a]/80 border border-[#d9a75a]/15 rounded-t flex items-end overflow-hidden">
                            <div
                              className="w-full bg-gradient-to-t from-[#b8863b] to-[#d9a75a] rounded-t transition-all shadow-[0_0_12px_rgba(217,167,90,0.35)]"
                              style={{ height: `${heightPct}%` }}
                            />
                          </div>
                          <span className="text-[11px] font-semibold text-[#c3d6c0]">
                            {item.day}
                          </span>
                          <span className="text-[10px] text-[#ffe3a3]">
                            {item.bows} lễ
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Chart 3 & 4: Peak Participation Hours */}
                <div className="bg-[#111f14]/90 p-5 rounded-xl border border-[#d9a75a]/25 shadow-lg">
                  <h3 className="text-xs font-semibold font-serif uppercase tracking-wider text-[#d9a75a] mb-4">
                    Thống kê khung giờ có nhiều đạo hữu tham gia nhất
                  </h3>
                  <div className="flex items-end justify-between h-44 gap-2.5 pt-4 px-2">
                    {data.charts.peakHours.map((item) => {
                      const pct = Math.min(100, Math.round((item.count / 50) * 100));
                      return (
                        <div
                          key={item.hour}
                          className="flex-1 flex flex-col items-center gap-1.5"
                        >
                          <span className="text-[10px] font-medium text-[#c3d6c0]">
                            {item.count}
                          </span>
                          <div className="w-full h-32 bg-[#09120a]/80 border border-[#d9a75a]/15 rounded-t flex items-end overflow-hidden">
                            <div
                              className="w-full bg-gradient-to-t from-[#254d2b] to-[#5a9c63] rounded-t transition-all shadow-[0_0_12px_rgba(90,156,99,0.35)]"
                              style={{ height: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-semibold text-[#c3d6c0]">
                            {item.hour}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Recent Activity Logs */}
              <div className="bg-[#111f14]/90 p-5 rounded-xl border border-[#d9a75a]/25 shadow-lg">
                <h3 className="text-xs font-semibold font-serif uppercase tracking-wider text-[#d9a75a] mb-3">
                  Nhật ký hoạt động thời gian thực (activity_logs)
                </h3>
                <div className="divide-y divide-[#d9a75a]/15 max-h-64 overflow-y-auto">
                  {data.activityLogs.map((log) => (
                    <div
                      key={log.id}
                      className="py-2.5 px-2 rounded-lg hover:bg-[#d9a75a]/5 flex items-center justify-between text-xs transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="px-2 py-0.5 rounded bg-[#d9a75a]/20 text-[#ffe3a3] border border-[#d9a75a]/30 font-mono text-[10px]">
                          {log.action}
                        </span>
                        <span className="text-[#e2ede0]">{log.detail}</span>
                      </div>
                      <span className="text-[#8ea885] text-[11px]">
                        {new Date(log.createdAt).toLocaleTimeString('vi-VN')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* TAB 2: SPACE MANAGEMENT (50 SEATS) */}
          {data && activeTab === 'SPACE' && (
            <div className="bg-[#111f14]/90 p-5 rounded-xl border border-[#d9a75a]/25 shadow-lg space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold font-serif text-[#fff6dc]">
                    Trạng thái 50 vị trí ngồi thiền (Bồ đoàn #01 – #50)
                  </h3>
                  <p className="text-xs text-[#a0b59d] mt-0.5">
                    Admin có thể giải phóng vị trí đang bị chiếm hoặc bật/tắt từng vị trí trong không gian.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2.5">
                {data.seats.map((seat) => {
                  const occupied = seat.status !== 'EMPTY' && seat.occupant;
                  return (
                    <div
                      key={seat.id}
                      className={`p-3 rounded-xl border text-xs flex flex-col justify-between transition-all ${
                        !seat.isEnabled
                          ? 'bg-[#070e08]/90 border-[#8a8886]/20 opacity-40 text-[#8a8886]'
                          : occupied
                          ? 'bg-[#d9a75a]/20 border-2 border-[#d9a75a] text-[#ffe3a3] shadow-[0_0_15px_rgba(217,167,90,0.25)]'
                          : 'bg-[#09140b] border border-[#d9a75a]/20 text-[#c2d4bf] hover:border-[#d9a75a]/45'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between font-bold">
                          <span className="font-serif">#{seat.code}</span>
                          <span className="text-[10px] font-normal text-[#8ea885]">
                            Vòng {seat.ringIndex}
                          </span>
                        </div>
                        <p className="text-[11px] font-medium mt-1 truncate">
                          {!seat.isEnabled
                            ? 'Đã tạm tắt'
                            : occupied
                            ? seat.occupant?.displayName
                            : 'Trống'}
                        </p>
                        {occupied && (
                          <p className="text-[10px] text-[#ffd27d] font-semibold">
                            {seat.status === 'MEDITATING' ? 'Đang thiền' : 'Đảnh lễ'}
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1 mt-2 pt-2 border-t border-white/10">
                        {occupied && (
                          <button
                            type="button"
                            onClick={() => handleReleaseSeat(seat.id)}
                            title="Giải phóng vị trí"
                            className="flex-1 py-1 rounded bg-red-900/80 hover:bg-red-800 text-white text-[10px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                          >
                            <Unlock className="w-3 h-3" />
                            <span>Giải phóng</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleToggleSeat(seat.id, !seat.isEnabled)}
                          title={seat.isEnabled ? 'Tắt vị trí này' : 'Bật vị trí này'}
                          className="p-1 rounded bg-[#0a140d] border border-[#d9a75a]/30 text-[#ffe3a3] hover:bg-[#d9a75a]/15 transition-colors cursor-pointer"
                        >
                          <Power className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: CHARACTERS MANAGEMENT (Upload & Customize Avatars) */}
          {data && activeTab === 'CHARACTERS' && (
            <div className="space-y-6">
              <div className="bg-[#111f14]/90 p-5 rounded-xl border border-[#d9a75a]/25 shadow-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-5 h-5 text-[#d9a75a]" />
                  <h3 className="text-sm font-bold font-serif text-[#fff6dc]">
                    Tùy chỉnh & Tải lên Hình ảnh Nhân vật Thiền
                  </h3>
                </div>
                <p className="text-xs text-[#a0b59d]">
                  Hệ thống cho phép Admin trực tiếp tải lên hình ảnh mới cho Thiền sư và các hướng ngồi thiền của hành giả.
                  Hình ảnh khuyến nghị: định dạng PNG tách nền trong suốt, dung lượng dưới 5MB. Mọi thay đổi được lưu và đồng bộ realtime ngay lập tức.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  {
                    id: 'zenMaster' as const,
                    title: '1. Thiền Sư Trung Tâm',
                    subtitle: 'Vị Thiền sư khổ hạnh tĩnh tọa dưới cội Bồ đề đại thụ',
                    currentUrl: data.settings.zenMasterUrl || '/assets/sanctuary/zen-master-figure.png',
                    defaultUrl: '/assets/sanctuary/zen-master-figure.png',
                    facingNote: 'Tọa thiền kiết già chính diện dưới cội đại thụ',
                    canFlip: false,
                    isFlipped: false,
                  },
                  {
                    id: 'practitionerLeft' as const,
                    title: '2. Người Thiền Vị Trí Bên Trái (Cánh Tả)',
                    subtitle: 'Dành cho các tọa cụ bên trái cội cây (posX < 47.0%)',
                    currentUrl: data.settings.practitionerLeftUrl || '/assets/sanctuary/practitioner-left.png',
                    defaultUrl: '/assets/sanctuary/practitioner-left.png',
                    facingNote: 'Mặt hướng về bên phải vào Thiền sư',
                    canFlip: true,
                    isFlipped: Boolean(data.settings.practitionerLeftFlip),
                  },
                  {
                    id: 'practitionerRight' as const,
                    title: '3. Người Thiền Vị Trí Bên Phải (Cánh Hữu)',
                    subtitle: 'Dành cho các tọa cụ bên phải cội cây (posX > 53.8%)',
                    currentUrl: data.settings.practitionerRightUrl || '/assets/sanctuary/practitioner-right.png',
                    defaultUrl: '/assets/sanctuary/practitioner-right.png',
                    facingNote: 'Mặt hướng về bên trái vào Thiền sư',
                    canFlip: true,
                    isFlipped: Boolean(data.settings.practitionerRightFlip),
                  },
                  {
                    id: 'practitionerCenter' as const,
                    title: '4. Người Thiền Vị Trí Chính Giữa (Trục Trung Tâm)',
                    subtitle: 'Dành cho các tọa cụ trục trung tâm (47.0% ≤ posX ≤ 53.8%)',
                    currentUrl: data.settings.practitionerCenterUrl || '/assets/sanctuary/practitioner-back.png',
                    defaultUrl: '/assets/sanctuary/practitioner-back.png',
                    facingNote: 'Quay lưng lại màn hình, nhìn thẳng cội bồ đề',
                    canFlip: false,
                    isFlipped: false,
                  },
                ].map((char) => (
                  <div
                    key={char.id}
                    className="bg-[#111f14]/90 p-5 rounded-xl border border-[#d9a75a]/25 shadow-lg flex flex-col justify-between space-y-4"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <h4 className="text-sm font-bold font-serif text-[#fff6dc]">{char.title}</h4>
                        <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full border border-[#d9a75a]/35 bg-[#d9a75a]/15 text-[#ffe3a3]">
                          {char.facingNote}
                        </span>
                      </div>
                      <p className="text-xs text-[#a0b59d] mb-3">{char.subtitle}</p>

                      {/* Character Dark Preview Box */}
                      <div className="relative w-full h-52 rounded-xl bg-[#08120a] border border-[#d9a75a]/25 overflow-hidden flex items-center justify-center p-3 shadow-inner">
                        {/* Radial forest glow */}
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{
                            background: 'radial-gradient(circle at 50% 60%, rgba(217, 167, 90, 0.18) 0%, transparent 70%)',
                          }}
                        />
                        <img
                          src={char.currentUrl}
                          alt={char.title}
                          style={{
                            transform: char.isFlipped ? 'scaleX(-1)' : 'none',
                          }}
                          className="h-full w-auto max-w-full object-contain drop-shadow-[0_8px_16px_rgba(0,0,0,0.8)] transition-transform hover:scale-105"
                        />
                        {char.isFlipped && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[#ffd27d] border border-[#ffd27d]/40 text-[10px] font-medium flex items-center gap-1 pointer-events-none select-none">
                            <FlipHorizontal className="w-3 h-3" />
                            <span>Đang lật ngang</span>
                          </div>
                        )}
                        {uploadingCharacter === char.id && (
                          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex flex-col items-center justify-center text-white text-xs gap-2">
                            <RefreshCw className="w-5 h-5 animate-spin text-[#d9a75a]" />
                            <span>Đang tải lên và xử lý...</span>
                          </div>
                        )}
                      </div>

                      <div className="mt-2 text-[11px] text-[#8ea885] truncate">
                        Đường dẫn hiện tại: <span className="font-mono text-[#ffe3a3]">{char.currentUrl}</span>
                      </div>
                    </div>

                    {/* Action buttons: Upload File, Flip & Reset */}
                    <div className="pt-2 border-t border-white/10 flex items-center gap-2 flex-wrap">
                      <label className="flex-1 cursor-pointer min-w-[130px]">
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) handleCharacterUpload(char.id, f);
                          }}
                        />
                        <span className="flex items-center justify-center gap-1.5 w-full py-2 px-2.5 rounded-full bg-gradient-to-r from-[#b8863b] via-[#d9a75a] to-[#b8863b] text-[#111d13] text-xs font-bold shadow-[0_4px_16px_rgba(217,167,90,0.35)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Tải ảnh mới</span>
                        </span>
                      </label>

                      {char.canFlip && (
                        <button
                          type="button"
                          onClick={() => handleToggleFlip(char.id as 'practitionerLeft' | 'practitionerRight')}
                          title="Lật ngang hình ảnh (đảo hướng nhìn)"
                          className={`flex items-center gap-1.5 py-2 px-3 rounded-full border text-xs font-medium transition-colors cursor-pointer ${
                            char.isFlipped
                              ? 'bg-[#d9a75a]/25 border-[#d9a75a] text-[#ffe3a3]'
                              : 'bg-[#0a140d] border-[#d9a75a]/30 hover:bg-[#d9a75a]/15 text-[#ffe3a3]'
                          }`}
                        >
                          <FlipHorizontal className="w-3.5 h-3.5" />
                          <span>{char.isFlipped ? 'Bỏ lật' : 'Lật ảnh'}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleResetCharacter(char.id)}
                        title="Khôi phục ảnh mặc định"
                        className="flex items-center gap-1.5 py-2 px-3 rounded-full bg-[#0a140d] border border-[#d9a75a]/30 hover:bg-[#d9a75a]/15 text-xs text-[#ffe3a3] font-medium transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5 text-[#8ea885]" />
                        <span>Mặc định</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

                    {/* TAB 4: AUDIO & SCHEDULE MANAGEMENT */}
          {data && activeTab === 'AUDIO' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Audio Tracks Library & MP3 Upload */}
              <div className="bg-[#111f14]/90 p-5 rounded-xl border border-[#d9a75a]/25 shadow-lg space-y-4">
                <div>
                  <h3 className="text-sm font-bold font-serif text-[#fff6dc]">
                    6.1. Danh sách Âm thanh & Upload MP3
                  </h3>
                  <p className="text-[11px] text-[#ffe3a3] mt-0.5">
                    ✨ Tên bài hát và thời lượng sẽ tự động đọc từ file MP3 được chọn.
                  </p>
                </div>

                <form
                  onSubmit={handleUploadTrack}
                  className="p-4 rounded-xl bg-[#09120a]/80 border border-[#d9a75a]/25 space-y-3 text-xs"
                >
                  <div className="grid grid-cols-1 gap-2">
                    <label className="block font-medium font-serif text-[#ffe3a3]">
                      Chọn file MP3 từ máy tính
                    </label>
                    <input
                      type="file"
                      accept="audio/mp3,audio/*"
                      disabled={isUploadingAudio}
                      onChange={(e) => handleMp3FileSelected(e.target.files?.[0] || null)}
                      className="w-full text-xs text-[#c2d4bf] file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#d9a75a]/20 file:text-[#ffe3a3] hover:file:bg-[#d9a75a]/30 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                  </div>

                  {/* Thanh tiến độ Upload thời gian thực */}
                  {isUploadingAudio && audioUploadProgress !== null && (
                    <div className="p-3.5 rounded-xl bg-[#09170e] border border-[#d9a75a]/40 space-y-2 shadow-inner">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 text-[#d9a75a] animate-spin shrink-0" />
                          <span className="font-semibold text-[#ffe3a3]">
                            {audioUploadProgress < 100
                              ? 'Đang truyền file âm thanh lên máy chủ...'
                              : 'Đã truyền xong 100%! Đang xử lý & lưu trữ...'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] font-mono">
                          {uploadBytesInfo && (
                            <span className="text-[#a8c2a3]">
                              {formatFileSize(uploadBytesInfo.loaded)} / {formatFileSize(uploadBytesInfo.total)}
                            </span>
                          )}
                          <span className="font-bold text-[#ffd074] px-2 py-0.5 rounded bg-[#d9a75a]/25 border border-[#d9a75a]/35">
                            {audioUploadProgress}%
                          </span>
                        </div>
                      </div>

                      {/* Animated Progress Bar */}
                      <div className="w-full h-2.5 bg-[#040805] rounded-full overflow-hidden border border-[#d9a75a]/30 p-0.5">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-[#b8863b] via-[#f59e0b] to-[#ffe3a3] transition-all duration-200 ease-out shadow-[0_0_12px_rgba(245,158,11,0.6)]"
                          style={{ width: `${Math.max(4, audioUploadProgress)}%` }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium font-serif text-[#ffe3a3] mb-1">Tên bài nhạc (Tự động nhận diện)</label>
                      <input
                        type="text"
                        value={trackTitle}
                        onChange={(e) => setTrackTitle(e.target.value)}
                        placeholder="VD: Tiếng Chuông Chùa Mai..."
                        className="w-full px-3 py-1.5 rounded-lg border border-[#d9a75a]/30 bg-[#070e08] text-[#fff6dc] focus:border-[#d9a75a]"
                      />
                    </div>
                    <div>
                      <label className="block font-medium font-serif text-[#ffe3a3] mb-1">Phân loại</label>
                      <select
                        value={trackCategory}
                        onChange={(e) =>
                          setTrackCategory(e.target.value as AudioTrackItem['category'])
                        }
                        className="w-full px-3 py-1.5 rounded-lg border border-[#d9a75a]/30 bg-[#070e08] text-[#fff6dc] focus:border-[#d9a75a]"
                      >
                        <option value="NHAC_THIEN">Nhạc thiền</option>
                        <option value="TIENG_SUOI">Tiếng suối</option>
                        <option value="TIENG_MUA">Tiếng mưa</option>
                        <option value="TIENG_CHUONG">Tiếng chuông</option>
                        <option value="TUNG_KINH">Tụng kinh</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium font-serif text-[#ffe3a3] mb-1">Thời lượng (giây - tự nhận diện)</label>
                      <input
                        type="number"
                        value={trackDuration}
                        onChange={(e) => setTrackDuration(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-[#d9a75a]/30 bg-[#070e08] text-[#fff6dc] focus:border-[#d9a75a]"
                      />
                    </div>
                    <div className="flex items-center pt-5">
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-[#c2d4bf]">
                        <input
                          type="checkbox"
                          checked={trackIsAmbient}
                          onChange={(e) => setTrackIsAmbient(e.target.checked)}
                          className="rounded text-[#d9a75a] focus:ring-0 accent-[#d9a75a]"
                        />
                        <span>Đặt làm nhạc nền chính (luôn phát)</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-1">
                    <button
                      type="submit"
                      disabled={isUploadingAudio}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#b8863b] via-[#d9a75a] to-[#b8863b] text-[#111d13] font-bold text-xs shadow-[0_4px_16px_rgba(217,167,90,0.35)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isUploadingAudio ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Đang tải lên ({audioUploadProgress ?? 0}%)...</span>
                        </>
                      ) : (
                        <>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Lưu bài nhạc vào thư viện</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>

                <div className="divide-y divide-[#d9a75a]/15">
                  {data.audioTracks.map((track) => {
                    const mins = Math.floor(track.durationSeconds / 60);
                    const secs = track.durationSeconds % 60;
                    const durationStr = `${mins}:${secs.toString().padStart(2, '0')}`;
                    const categoryLabels: Record<string, string> = {
                      NHAC_THIEN: 'Nhạc thiền',
                      TIENG_SUOI: 'Tiếng suối',
                      TIENG_MUA: 'Tiếng mưa',
                      TIENG_CHUONG: 'Tiếng chuông',
                      TUNG_KINH: 'Tụng kinh',
                    };
                    const categoryName = categoryLabels[track.category] || track.category;
                    const rawFileName = track.fileUrl ? track.fileUrl.split('/').pop() : '';

                    return (
                      <div
                        key={track.id}
                        className="py-2.5 px-1.5 rounded-lg hover:bg-white/[0.02] flex items-center justify-between gap-3 text-xs transition-colors"
                      >
                        {/* Cột trái: Tên bài & Metadata thu gọn trên 1 khối gọn gàng */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p
                              className="font-semibold text-[#fff6dc] font-serif truncate max-w-[180px] sm:max-w-[280px]"
                              title={track.title}
                            >
                              {track.title}
                            </p>
                            {track.isAmbientBg && (
                              <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#d9a75a]/25 text-[#ffd074] border border-[#d9a75a]/40">
                                ★ Nhạc nền
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-[#8ea885] mt-0.5 flex-wrap">
                            <span className="px-1.5 py-0.5 rounded bg-black/40 border border-white/5 text-[10px] text-[#c2d4bf]">
                              {categoryName}
                            </span>
                            <span>•</span>
                            <span>{durationStr} ({track.durationSeconds}s)</span>
                            {rawFileName && (
                              <>
                                <span>•</span>
                                <a
                                  href={track.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[#d9a75a]/75 hover:text-[#ffd074] hover:underline truncate max-w-[150px] text-[10px] font-mono"
                                  title={`Tải / Nghe thử: ${rawFileName}`}
                                >
                                  {rawFileName}
                                </a>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Cột phải: Các nút thao tác thẳng hàng trên 1 dòng duy nhất */}
                        <div className="shrink-0 flex items-center gap-1.5">
                          {/* Nút Nhạc nền (Toggle) */}
                          <button
                            type="button"
                            onClick={() => handleToggleTrackAmbient(track)}
                            title={track.isAmbientBg ? 'Đang là nhạc nền chính (nhấp để hủy)' : 'Nhấp để đặt làm nhạc nền chính'}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer flex items-center gap-1 ${
                              track.isAmbientBg
                                ? 'bg-[#d9a75a]/30 border border-[#d9a75a] text-[#ffe3a3] shadow-[0_0_8px_rgba(217,167,90,0.3)] font-semibold'
                                : 'bg-[#0a140d] border border-[#d9a75a]/30 text-[#c2d4bf] hover:bg-[#d9a75a]/20 hover:text-[#ffe3a3]'
                            }`}
                          >
                            <span>★</span>
                            <span className="hidden sm:inline">{track.isAmbientBg ? 'Nhạc nền' : 'Đặt nền'}</span>
                          </button>

                          {/* Nút Trạng thái Bật/Tắt */}
                          <button
                            type="button"
                            onClick={() => handleToggleTrackEnabled(track)}
                            className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                              track.isEnabled
                                ? 'bg-emerald-950/70 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/80'
                                : 'bg-stone-900 border border-stone-700 text-stone-400 hover:bg-stone-800'
                            }`}
                          >
                            {track.isEnabled ? 'Đang bật' : 'Đã tắt'}
                          </button>

                          {/* Nút Xóa */}
                          <button
                            type="button"
                            onClick={() => handleDeleteTrack(track.id)}
                            title="Xóa bài nhạc"
                            className="p-1.5 rounded-full text-red-400/80 hover:text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Right Column: Schedule Settings (startTime -> endTime, Loop & Ambient Fallback) */}
              <div className="bg-[#111f14]/90 p-5 rounded-xl border border-[#d9a75a]/25 shadow-lg space-y-4">
                <div>
                  <h3 className="text-sm font-bold font-serif text-[#fff6dc]">
                    6.2. Cài đặt Lịch phát nhạc đồng bộ (Theo khung giờ)
                  </h3>
                  <p className="text-[11px] text-[#a0b59d] mt-0.5">
                    Hệ thống tự động phát bài được chọn theo khung giờ và lặp lại liên tục. Hết giờ sẽ tự động phát lại nhạc nền.
                  </p>
                </div>

                <form
                  onSubmit={handleAddSchedule}
                  className="p-4 rounded-xl bg-[#09120a]/80 border border-[#d9a75a]/25 space-y-3 text-xs"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium font-serif text-[#ffe3a3] mb-1">Chọn bài nhạc từ danh sách</label>
                      <select
                        value={schedTrackId}
                        onChange={(e) => setSchedTrackId(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-[#d9a75a]/30 bg-[#070e08] text-[#fff6dc] font-medium focus:border-[#d9a75a]"
                      >
                        {data.audioTracks.map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.title} ({t.durationSeconds}s) {t.isAmbientBg ? '★' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-medium font-serif text-[#ffe3a3] mb-1">Tên khung giờ (Tùy chọn)</label>
                      <input
                        type="text"
                        value={schedName}
                        onChange={(e) => setSchedName(e.target.value)}
                        placeholder={`VD: Thời khóa (${schedStartTime} - ${schedEndTime})`}
                        className="w-full px-3 py-1.5 rounded-lg border border-[#d9a75a]/30 bg-[#070e08] text-[#fff6dc] focus:border-[#d9a75a]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium font-serif text-[#ffe3a3] mb-1">Giờ bắt đầu phát</label>
                      <input
                        type="time"
                        value={schedStartTime}
                        onChange={(e) => setSchedStartTime(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-[#d9a75a]/30 bg-[#070e08] text-[#fff6dc] font-mono focus:border-[#d9a75a]"
                      />
                    </div>
                    <div>
                      <label className="block font-medium font-serif text-[#ffe3a3] mb-1">Giờ kết thúc phát</label>
                      <input
                        type="time"
                        value={schedEndTime}
                        onChange={(e) => setSchedEndTime(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-[#d9a75a]/30 bg-[#070e08] text-[#fff6dc] font-mono focus:border-[#d9a75a]"
                      />
                    </div>
                  </div>

                  <div className="bg-[#d9a75a]/10 p-2.5 rounded-lg border border-[#d9a75a]/30 text-[11px] text-[#ffe3a3]">
                    🔁 <strong>Quy tắc lặp:</strong> Nếu thời lượng bài nhạc ngắn hơn khung giờ, bài nhạc sẽ tự động lặp lại liên tục cho tới khi kết thúc lịch. Khi lịch kết thúc, hệ thống tự động quay về bài nhạc nền.
                  </div>

                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-gradient-to-r from-[#b8863b] via-[#d9a75a] to-[#b8863b] text-[#111d13] font-bold text-xs shadow-[0_4px_16px_rgba(217,167,90,0.35)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Lưu vào Lịch phát đồng bộ</span>
                  </button>
                </form>

                <div className="divide-y divide-[#d9a75a]/15">
                  {data.audioSchedules.length === 0 ? (
                    <div className="py-6 text-center text-xs text-[#8ea885]">
                      Chưa có lịch phát nào. Hệ thống hiện đang phát Nhạc nền mặc định liên tục.
                    </div>
                  ) : (
                    data.audioSchedules.map((sched) => {
                      const matchedTrack = data.audioTracks.find(
                        (t) => t.id === sched.trackId
                      );

                      // Check if schedule is currently active right now
                      const now = new Date();
                      const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
                      const [sH, sM] = (sched.startTime || '00:00').split(':').map(Number);
                      const startSec = (sH || 0) * 3600 + (sM || 0) * 60;
                      let endSec = startSec + (sched.durationMinutes || 30) * 60;
                      if (sched.endTime) {
                        const [eH, eM] = sched.endTime.split(':').map(Number);
                        endSec = (eH || 0) * 3600 + (eM || 0) * 60;
                        if (endSec <= startSec) endSec += 86400;
                      }
                      const isNowActive =
                        endSec > 86400
                          ? nowSec >= startSec || nowSec < endSec - 86400
                          : nowSec >= startSec && nowSec < endSec;
                      return (
                        <div
                          key={sched.id}
                          className="py-3 flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <span className="px-2.5 py-1 rounded-full bg-[#d9a75a]/20 text-[#ffe3a3] border border-[#d9a75a]/35 font-mono font-bold">
                              {sched.startTime} → {sched.endTime || `${sched.durationMinutes}m`}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-semibold font-serif text-[#fff6dc]">{sched.name}</p>
                                {isNowActive && sched.isEnabled ? (
                                  <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/60 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                    Đang phát Realtime
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-full bg-stone-900 border border-stone-700 text-stone-400 text-[10px]">
                                    Chờ tới giờ phát
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#8ea885] mt-0.5">
                                Bài phát: <strong className="text-[#ffe3a3]">{matchedTrack?.title || 'Mặc định'}</strong> • Lặp lại suốt khung giờ
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteSchedule(sched.id)}
                            className="p-1.5 rounded-full text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                            title="Xóa lịch phát này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ANNOUNCEMENTS MANAGEMENT */}
          {data && activeTab === 'ANNOUNCEMENTS' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: Form to Create/Publish Announcement */}
              <div className="bg-[#111f14]/90 p-5 rounded-xl border border-[#d9a75a]/25 shadow-lg space-y-4">
                <div>
                  <h3 className="text-sm font-bold font-serif text-[#fff6dc] flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-[#d9a75a]" />
                    <span>4.1. Thêm Thông báo Mới & Thiết lập Hiệu ứng</span>
                  </h3>
                  <p className="text-[11px] text-[#a0b59d] mt-0.5">
                    Tạo thông báo hiển thị dải ruy-băng tinh tế trên Trang chính. Hỗ trợ chữ chạy (Marquee), thời gian xuất hiện/kết thúc và chu kỳ lặp lại.
                  </p>
                </div>

                <form
                  onSubmit={handleCreateAnnouncement}
                  className="p-4 rounded-xl bg-[#09120a]/80 border border-[#d9a75a]/25 space-y-3.5 text-xs"
                >
                  <div>
                    <label className="block font-medium font-serif text-[#ffe3a3] mb-1">
                      Tiêu đề thông báo
                    </label>
                    <input
                      type="text"
                      value={annTitle}
                      onChange={(e) => setAnnTitle(e.target.value)}
                      placeholder="VD: Khóa Thiền Tĩnh Tâm, Thông Điệp An Trú..."
                      className="w-full px-3 py-1.5 rounded-lg border border-[#d9a75a]/30 bg-[#070e08] text-[#fff6dc] focus:border-[#d9a75a]"
                    />
                  </div>

                  <div>
                    <label className="block font-medium font-serif text-[#ffe3a3] mb-1">
                      Nội dung thông báo (Hiển thị trực tiếp trên trang chính)
                    </label>
                    <textarea
                      rows={2}
                      value={annContent}
                      onChange={(e) => setAnnContent(e.target.value)}
                      placeholder="Nhập nội dung thông báo hoặc thông điệp thiền gửi đến toàn thể đại chúng..."
                      className="w-full px-3 py-1.5 rounded-lg border border-[#d9a75a]/30 bg-[#070e08] text-[#fff6dc] focus:border-[#d9a75a] resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium font-serif text-[#ffe3a3] mb-1">
                        Phân loại thông báo
                      </label>
                      <select
                        value={annType}
                        onChange={(e) => setAnnType(e.target.value as any)}
                        className="w-full px-3 py-1.5 rounded-lg border border-[#d9a75a]/30 bg-[#070e08] text-[#fff6dc] focus:border-[#d9a75a]"
                      >
                        <option value="INFO">Tin tức / Thông tri (INFO)</option>
                        <option value="EVENT">Sự kiện Thiền viện (EVENT)</option>
                        <option value="REMINDER">Lời nhắc Tĩnh tâm (REMINDER)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-medium font-serif text-[#ffe3a3] mb-1">
                        Tốc độ chữ chạy (Marquee)
                      </label>
                      <select
                        value={annScrollSpeed}
                        onChange={(e) => setAnnScrollSpeed(e.target.value as any)}
                        disabled={!annIsMarquee}
                        className="w-full px-3 py-1.5 rounded-lg border border-[#d9a75a]/30 bg-[#070e08] text-[#fff6dc] focus:border-[#d9a75a] disabled:opacity-40"
                      >
                        <option value="SLOW">Chậm rãi (35 giây)</option>
                        <option value="NORMAL">Bình thường (22 giây)</option>
                        <option value="FAST">Nhanh (14 giây)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium font-serif text-[#ffe3a3] mb-1">
                        Thời gian bắt đầu xuất hiện
                      </label>
                      <input
                        type="datetime-local"
                        value={annStartTime}
                        onChange={(e) => setAnnStartTime(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-[#d9a75a]/30 bg-[#070e08] text-[#fff6dc] font-mono focus:border-[#d9a75a]"
                      />
                    </div>
                    <div>
                      <label className="block font-medium font-serif text-[#ffe3a3] mb-1">
                        Thời gian kết thúc
                      </label>
                      <input
                        type="datetime-local"
                        value={annEndTime}
                        onChange={(e) => setAnnEndTime(e.target.value)}
                        className="w-full px-3 py-1.5 rounded-lg border border-[#d9a75a]/30 bg-[#070e08] text-[#fff6dc] font-mono focus:border-[#d9a75a]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block font-medium font-serif text-[#ffe3a3] mb-1">
                        Chu kỳ lặp lại (Phút)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={annRepeatInterval}
                        onChange={(e) => setAnnRepeatInterval(e.target.value)}
                        placeholder="0 = Hiển thị liên tục"
                        className="w-full px-3 py-1.5 rounded-lg border border-[#d9a75a]/30 bg-[#070e08] text-[#fff6dc] focus:border-[#d9a75a]"
                      />
                      <p className="text-[10px] text-[#8ea885] mt-0.5">
                        0: Luôn hiển thị • &gt;0: Hiện rồi lặp lại sau X phút
                      </p>
                    </div>

                    <div className="flex flex-col justify-center pt-2">
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-[#c2d4bf]">
                        <input
                          type="checkbox"
                          checked={annIsMarquee}
                          onChange={(e) => setAnnIsMarquee(e.target.checked)}
                          className="rounded text-[#d9a75a] focus:ring-0 accent-[#d9a75a]"
                        />
                        <span>Hiệu ứng chữ chạy ngang (Marquee)</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex items-center justify-end pt-2">
                    <button
                      type="submit"
                      className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-gradient-to-r from-[#b8863b] via-[#d9a75a] to-[#b8863b] text-[#111d13] font-bold text-xs shadow-[0_4px_16px_rgba(217,167,90,0.35)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Phát hành Thông báo Mới</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Right Column: List of Announcements with Status */}
              <div className="bg-[#111f14]/90 p-5 rounded-xl border border-[#d9a75a]/25 shadow-lg space-y-4">
                <div>
                  <h3 className="text-sm font-bold font-serif text-[#fff6dc] flex items-center gap-2">
                    <Bell className="w-4 h-4 text-[#d9a75a]" />
                    <span>4.2. Danh sách Thông báo Hiện có ({data.announcements?.length || 0})</span>
                  </h3>
                  <p className="text-[11px] text-[#a0b59d] mt-0.5">
                    Quản lý bật/tắt, trạng thái phát thời gian thực và xóa thông báo.
                  </p>
                </div>

                <div className="divide-y divide-[#d9a75a]/15 max-h-[580px] overflow-y-auto pr-1">
                  {(!data.announcements || data.announcements.length === 0) ? (
                    <div className="py-8 text-center text-xs text-[#8ea885]">
                      Chưa có thông báo nào được thiết lập. Hãy tạo thông báo đầu tiên ở biểu mẫu bên trái!
                    </div>
                  ) : (
                    data.announcements.map((ann) => {
                      const now = new Date();
                      const start = new Date(ann.startTime);
                      const end = new Date(ann.endTime);
                      const isTimeActive = now >= start && now <= end;
                      const isExpired = now > end;

                      return (
                        <div
                          key={ann.id}
                          className="py-3.5 flex items-start justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold font-serif text-[#fff6dc] truncate">
                                {ann.title}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  ann.type === 'EVENT'
                                    ? 'bg-amber-950/60 text-amber-300 border border-amber-500/40'
                                    : ann.type === 'REMINDER'
                                    ? 'bg-purple-950/60 text-purple-300 border border-purple-500/40'
                                    : 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/40'
                                }`}
                              >
                                {ann.type}
                              </span>

                              {isTimeActive && ann.isEnabled ? (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/60 text-[10px] font-bold flex items-center gap-1 animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                  Đang phát Realtime
                                </span>
                              ) : isExpired ? (
                                <span className="px-2 py-0.5 rounded-full bg-stone-900 border border-stone-700 text-stone-500 text-[10px]">
                                  Đã hết hạn
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-stone-900 border border-stone-700 text-stone-400 text-[10px]">
                                  Chờ đến giờ
                                </span>
                              )}

                              {ann.isMarquee && (
                                <span className="px-1.5 py-0.5 rounded bg-[#d9a75a]/15 text-[#ffe3a3] border border-[#d9a75a]/30 text-[10px]">
                                  Chữ chạy ({ann.scrollSpeed || 'NORMAL'})
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-[#c2d4bf] line-clamp-2 italic">
                              "{ann.content}"
                            </p>

                            <div className="text-[10px] text-[#8ea885] flex items-center gap-3 flex-wrap">
                              <span>
                                ⏳ Từ: <strong className="text-[#ffe3a3]">{ann.startTime.replace('T', ' ')}</strong>
                              </span>
                              <span>
                                ➔ Đến: <strong className="text-[#ffe3a3]">{ann.endTime.replace('T', ' ')}</strong>
                              </span>
                              {ann.repeatIntervalMinutes > 0 && (
                                <span>
                                  🔁 Lặp lại: <strong>mỗi {ann.repeatIntervalMinutes} phút</strong>
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 pt-1">
                            <button
                              type="button"
                              onClick={() => handleToggleAnnouncement(ann.id)}
                              className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors cursor-pointer ${
                                ann.isEnabled
                                  ? 'bg-emerald-950/60 border border-emerald-500/40 text-emerald-300'
                                  : 'bg-stone-900 border border-stone-700 text-stone-400'
                              }`}
                            >
                              {ann.isEnabled ? 'Đang bật' : 'Đã tắt'}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteAnnouncement(ann.id)}
                              className="p-1.5 rounded-full text-red-400 hover:bg-red-500/20 transition-colors cursor-pointer"
                              title="Xóa thông báo này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: USER MANAGEMENT */}
          {data && activeTab === 'USERS' && (
            <div className="bg-[#111f14]/90 p-5 rounded-xl border border-[#d9a75a]/25 shadow-lg">
              <h3 className="text-sm font-bold font-serif text-[#fff6dc] mb-4">
                Danh sách Người tham gia & Lịch sử tích lũy
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#d9a75a]/25 text-[#d9a75a] bg-[#09120a] font-serif">
                      <th className="py-2.5 px-3">Tên hiển thị</th>
                      <th className="py-2.5 px-3">Số lần đảnh lễ</th>
                      <th className="py-2.5 px-3">Tổng thời gian thiền</th>
                      <th className="py-2.5 px-3">Tổng điểm</th>
                      <th className="py-2.5 px-3">Trạng thái</th>
                      <th className="py-2.5 px-3 text-right">Thao tác quản trị</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#d9a75a]/15">
                    {data.users.map((u) => (
                      <tr key={u.id} className="hover:bg-[#d9a75a]/5 transition-colors">
                        <td className="py-3 px-3 font-semibold text-[#fff6dc]">
                          {u.displayName}
                        </td>
                        <td className="py-3 px-3 text-[#c2d4bf]">{u.totalBowingCount} lượt</td>
                        <td className="py-3 px-3 text-[#c2d4bf]">{u.totalMeditationMinutes} phút</td>
                        <td className="py-3 px-3 font-bold text-[#ffe3a3]">
                          {u.totalPoints} điểm
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                                : 'bg-red-950/60 border-red-500/40 text-red-300'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right space-x-2">
                          {u.status === 'ACTIVE' ? (
                            <button
                              type="button"
                              onClick={() => handleUpdateUserStatus(u.id, 'BANNED')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-950/60 border border-red-500/40 text-red-300 hover:bg-red-900/60 font-medium transition-colors cursor-pointer"
                            >
                              <Ban className="w-3 h-3" />
                              <span>Khóa vi phạm</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleUpdateUserStatus(u.id, 'ACTIVE')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900/60 font-medium transition-colors cursor-pointer"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              <span>Mở khóa</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

                    {/* TAB 6: SYSTEM SETTINGS */}
          {settingsForm && activeTab === 'SETTINGS' && (
            <form
              onSubmit={handleSaveSettings}
              className="bg-[#111f14]/90 p-6 rounded-xl border border-[#d9a75a]/25 shadow-lg max-w-3xl space-y-5 text-xs text-[#fff6dc]"
            >
              <h3 className="text-sm font-bold font-serif text-[#fff6dc] border-b border-[#d9a75a]/25 pb-2">
                Cấu hình Không gian, Tên Cổng Quản Trị & Quy tắc điểm
              </h3>

              {/* ADMIN SIDEBAR TITLE & SUBTITLE CONFIGURATION */}
              <div className="bg-[#09120a]/80 p-4 rounded-xl border border-[#d9a75a]/35 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-[#d9a75a]/20 border border-[#d9a75a]/45 flex items-center justify-center text-[#d9a75a]">
                    <Leaf className="w-3.5 h-3.5" />
                  </div>
                  <h4 className="font-serif font-bold text-xs text-[#ffe3a3]">
                    Cấu hình Tiêu đề & Logo Cổng Quản Trị (Header Sidebar)
                  </h4>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-semibold font-serif text-[#ffe3a3] mb-1">
                      Tên cổng quản trị (Tiêu đề lớn)
                    </label>
                    <input
                      type="text"
                      value={settingsForm.adminPortalTitle || ''}
                      placeholder="Thiền Viên Admin Center"
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, adminPortalTitle: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#070e08] border border-[#d9a75a]/30 text-[#fff6dc] focus:border-[#d9a75a]"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold font-serif text-[#ffe3a3] mb-1">
                      Mô tả phụ cổng quản trị
                    </label>
                    <input
                      type="text"
                      value={settingsForm.adminPortalSubtitle || ''}
                      placeholder="Không gian an trú • Ban Điều Hành"
                      onChange={(e) =>
                        setSettingsForm({ ...settingsForm, adminPortalSubtitle: e.target.value })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#070e08] border border-[#d9a75a]/30 text-[#fff6dc] focus:border-[#d9a75a]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold font-serif text-[#ffe3a3] mb-1">Tên không gian thiền (Trang khách)</label>
                  <input
                    type="text"
                    value={settingsForm.sanctuaryName}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, sanctuaryName: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#070e08] border border-[#d9a75a]/30 text-[#fff6dc] focus:border-[#d9a75a]"
                  />
                </div>
                <div>
                  <label className="block font-semibold font-serif text-[#ffe3a3] mb-1">Tiêu đề màn hình chào</label>
                  <input
                    type="text"
                    value={settingsForm.welcomeTitle}
                    onChange={(e) =>
                      setSettingsForm({ ...settingsForm, welcomeTitle: e.target.value })
                    }
                    className="w-full px-3 py-2 rounded-lg bg-[#070e08] border border-[#d9a75a]/30 text-[#fff6dc] focus:border-[#d9a75a]"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold font-serif text-[#ffe3a3] mb-1">Nội dung lời chào</label>
                <textarea
                  rows={2}
                  value={settingsForm.welcomeMessage}
                  onChange={(e) =>
                    setSettingsForm({ ...settingsForm, welcomeMessage: e.target.value })
                  }
                  className="w-full px-3 py-2 rounded-lg bg-[#070e08] border border-[#d9a75a]/30 text-[#fff6dc] focus:border-[#d9a75a]"
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div>
                  <label className="block font-semibold font-serif text-[#ffe3a3] mb-1">Điểm Đảnh lễ</label>
                  <input
                    type="number"
                    value={settingsForm.bowingPoints}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        bowingPoints: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-[#070e08] border border-[#d9a75a]/30 text-[#fff6dc] focus:border-[#d9a75a]"
                  />
                </div>
                <div>
                  <label className="block font-semibold font-serif text-[#ffe3a3] mb-1">Thiền 5 phút</label>
                  <input
                    type="number"
                    value={settingsForm.meditation5Points}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        meditation5Points: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-[#070e08] border border-[#d9a75a]/30 text-[#fff6dc] focus:border-[#d9a75a]"
                  />
                </div>
                <div>
                  <label className="block font-semibold font-serif text-[#ffe3a3] mb-1">Thiền 10 phút</label>
                  <input
                    type="number"
                    value={settingsForm.meditation10Points}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        meditation10Points: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-[#070e08] border border-[#d9a75a]/30 text-[#fff6dc] focus:border-[#d9a75a]"
                  />
                </div>
                <div>
                  <label className="block font-semibold font-serif text-[#ffe3a3] mb-1">Thiền 15 phút</label>
                  <input
                    type="number"
                    value={settingsForm.meditation15Points}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        meditation15Points: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-[#070e08] border border-[#d9a75a]/30 text-[#fff6dc] focus:border-[#d9a75a]"
                  />
                </div>
                <div>
                  <label className="block font-semibold font-serif text-[#ffe3a3] mb-1">Thiền 30 phút</label>
                  <input
                    type="number"
                    value={settingsForm.meditation30Points}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        meditation30Points: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-[#070e08] border border-[#d9a75a]/30 text-[#fff6dc] focus:border-[#d9a75a]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block font-semibold font-serif text-[#ffe3a3] mb-1">
                    Số lượng vị trí kích hoạt (1-50)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={settingsForm.activeSeatCount}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        activeSeatCount: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-[#070e08] border border-[#d9a75a]/30 text-[#fff6dc] focus:border-[#d9a75a]"
                  />
                </div>
                <div>
                  <label className="block font-semibold font-serif text-[#ffe3a3] mb-1">
                    Tự động giải phóng khi mất mạng (giây)
                  </label>
                  <input
                    type="number"
                    value={settingsForm.seatTimeoutSeconds}
                    onChange={(e) =>
                      setSettingsForm({
                        ...settingsForm,
                        seatTimeoutSeconds: Number(e.target.value),
                      })
                    }
                    className="w-full px-3 py-1.5 rounded-lg bg-[#070e08] border border-[#d9a75a]/30 text-[#fff6dc] focus:border-[#d9a75a]"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-[#c2d4bf]">
                    <input
                      type="checkbox"
                      checked={settingsForm.enableNatureAnimations}
                      onChange={(e) =>
                        setSettingsForm({
                          ...settingsForm,
                          enableNatureAnimations: e.target.checked,
                        })
                      }
                      className="rounded text-[#d9a75a] focus:ring-0 accent-[#d9a75a]"
                    />
                    <span>Bật hiệu ứng sương mờ, lá rơi & suối chảy</span>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#b8863b] via-[#d9a75a] to-[#b8863b] text-[#111d13] font-bold text-xs shadow-[0_6px_20px_rgba(217,167,90,0.4)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Lưu & Áp dụng cấu hình ngay lập tức</span>
              </button>
            </form>
          )}

          {/* VÙNG KHỞI TẠO HỆ THỐNG: RESET & XÓA DỮ LIỆU THỬ NGHIỆM ĐỂ TRIỂN KHAI CHÍNH THỨC */}
          {activeTab === 'SETTINGS' && (
            <div className="bg-[#18090a]/90 p-6 rounded-xl border border-red-500/35 shadow-xl max-w-3xl space-y-4 text-xs">
              <div className="flex items-center gap-2.5 text-red-400">
                <AlertTriangle className="w-5 h-5 shrink-0" />
                <h3 className="text-sm font-bold font-serif text-red-200">
                  Dọn Sạch Lịch Sử Thử Nghiệm & Sẵn Sàng Vận Hành Chính Thức
                </h3>
              </div>
              <p className="text-[11px] text-[#fca5a5]/80 leading-relaxed">
                Khi chuẩn bị bàn giao hoặc mở cửa Thiền Viện cho đại chúng, bạn có thể bấm nút dưới đây để xóa toàn bộ các tài khoản tạo thử, lịch sử ngồi thiền, đảnh lễ, lịch sử tích lũy điểm và lượt truy cập thử nghiệm.
                <br />
                <span className="font-semibold text-amber-200/90 mt-1 block">
                  ✨ An toàn tuyệt đối: Toàn bộ kho nhạc MP3, lịch phát nhạc, hình ảnh Thiền sư/Thiền sinh và tài khoản Admin sẽ được bảo lưu nguyên vẹn.
                </span>
              </p>
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handlePurgeTestData}
                  disabled={isPurging}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-red-800 via-red-600 to-red-800 text-white font-bold text-xs shadow-[0_4px_16px_rgba(239,68,68,0.35)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isPurging ? 'Đang dọn dẹp hệ thống...' : 'Xóa sạch dữ liệu thử nghiệm (Reset hệ thống về 0)'}</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 8: ACCOUNT PROFILE MANAGEMENT */}
          {activeTab === 'ACCOUNT' && (
            <div className="space-y-6 max-w-4xl">
              {/* Executive Overview Profile Banner */}
              <div className="bg-[#111f14]/90 p-6 rounded-2xl border border-[#d9a75a]/30 shadow-xl relative overflow-hidden">
                <div
                  className="absolute -right-10 -bottom-10 w-60 h-60 pointer-events-none opacity-10"
                  style={{
                    background: 'radial-gradient(circle, rgba(217,167,90,0.8) 0%, transparent 70%)',
                  }}
                />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 relative z-10">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#b8863b] via-[#d9a75a] to-[#7a5521] p-[2px] shadow-lg shrink-0">
                      <div className="w-full h-full rounded-2xl bg-[#0a140d] flex items-center justify-center text-[#ffe3a3]">
                        <ShieldCheck className="w-8 h-8 text-[#d9a75a]" />
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h3 className="text-lg font-bold font-serif text-[#fff6dc]">
                          {data?.adminProfile?.displayName || 'Ban Điều Hành Thiền Viện'}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full bg-[#d9a75a]/20 border border-[#d9a75a]/40 text-[#ffe3a3] text-[10px] font-bold tracking-wide uppercase">
                          {data?.adminProfile?.role || 'Tổng Quản Trị Viên'}
                        </span>
                      </div>
                      <p className="text-xs text-[#a0b59d] mt-1 flex items-center gap-2">
                        <span>Tài khoản: <strong className="text-[#ffe3a3]">@{data?.adminProfile?.username || loginUsername}</strong></span>
                        <span>•</span>
                        <span>Email: <strong className="text-[#ffe3a3]">{data?.adminProfile?.email || 'admin@thienvien.org'}</strong></span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-start sm:items-end text-[11px] text-[#8ea885] space-y-1">
                    <div>
                      Đăng nhập gần nhất:{' '}
                      <strong className="text-[#ffe3a3]">
                        {data?.adminProfile?.lastLoginAt
                          ? new Date(data.adminProfile.lastLoginAt).toLocaleString('vi-VN')
                          : 'Vừa mới'}
                      </strong>
                    </div>
                    <div>
                      Cập nhật gần nhất:{' '}
                      <strong className="text-[#ffe3a3]">
                        {data?.adminProfile?.updatedAt
                          ? new Date(data.adminProfile.updatedAt).toLocaleString('vi-VN')
                          : 'Mới khởi tạo'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form to Update Profile & Change Password */}
              <form onSubmit={handleSaveAdminProfile} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Card 1: Basic Admin Info */}
                  <div className="bg-[#111f14]/90 p-5 rounded-xl border border-[#d9a75a]/25 shadow-lg space-y-4">
                    <div className="border-b border-[#d9a75a]/20 pb-2.5 flex items-center gap-2">
                      <UserCog className="w-4 h-4 text-[#d9a75a]" />
                      <h4 className="text-xs font-bold font-serif uppercase tracking-wider text-[#ffe3a3]">
                        8.1. Thông tin Cá nhân & Đăng nhập
                      </h4>
                    </div>

                    <div className="space-y-3.5 text-xs">
                      <div>
                        <label className="block font-medium font-serif text-[#ffe3a3] mb-1">
                          Tên hiển thị Quản trị viên
                        </label>
                        <input
                          type="text"
                          required
                          value={profileDisplayName}
                          onChange={(e) => setProfileDisplayName(e.target.value)}
                          placeholder="VD: Ban Quản Trị Thiền Viện..."
                          className="w-full px-3 py-2 rounded-lg bg-[#070e08] border border-[#d9a75a]/30 text-[#fff6dc] focus:border-[#d9a75a] focus:outline-none"
                        />
                        <p className="text-[10px] text-[#8ea885] mt-1">
                          Tên này sẽ xuất hiện trên thanh điều hướng và nhật ký hệ thống.
                        </p>
                      </div>

                      <div>
                        <label className="block font-medium font-serif text-[#ffe3a3] mb-1">
                          Tên đăng nhập (Username)
                        </label>
                        <input
                          type="text"
                          required
                          value={profileUsername}
                          onChange={(e) => setProfileUsername(e.target.value)}
                          placeholder="admin"
                          className="w-full px-3 py-2 rounded-lg bg-[#070e08] border border-[#d9a75a]/30 text-[#fff6dc] focus:border-[#d9a75a] focus:outline-none font-mono"
                        />
                        <p className="text-[10px] text-[#8ea885] mt-1">
                          Dùng để đăng nhập vào trang Quản trị. Nếu thay đổi, vui lòng nhập mật khẩu hiện tại bên dưới.
                        </p>
                      </div>

                      <div>
                        <label className="block font-medium font-serif text-[#ffe3a3] mb-1">
                          Email liên hệ quản trị
                        </label>
                        <input
                          type="email"
                          value={profileEmail}
                          onChange={(e) => setProfileEmail(e.target.value)}
                          placeholder="admin@thienvien.org"
                          className="w-full px-3 py-2 rounded-lg bg-[#070e08] border border-[#d9a75a]/30 text-[#fff6dc] focus:border-[#d9a75a] focus:outline-none font-mono"
                        />
                        <p className="text-[10px] text-[#8ea885] mt-1">
                          Email nhận các thông báo hệ thống và sao lưu dữ liệu.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Card 2: Security & Password Change */}
                  <div className="bg-[#111f14]/90 p-5 rounded-xl border border-[#d9a75a]/25 shadow-lg space-y-4">
                    <div className="border-b border-[#d9a75a]/20 pb-2.5 flex items-center gap-2">
                      <Lock className="w-4 h-4 text-[#d9a75a]" />
                      <h4 className="text-xs font-bold font-serif uppercase tracking-wider text-[#ffe3a3]">
                        8.2. Đổi Mật Khẩu & Xác Thực
                      </h4>
                    </div>

                    <div className="space-y-3.5 text-xs">
                      <div>
                        <label className="block font-medium font-serif text-[#ffe3a3] mb-1">
                          Mật khẩu hiện tại <span className="text-amber-400 font-normal">*(Bắt buộc khi đổi username hoặc mật khẩu)</span>
                        </label>
                        <div className="relative">
                          <input
                            type={showCurrentPass ? 'text' : 'password'}
                            value={profileCurrentPassword}
                            onChange={(e) => setProfileCurrentPassword(e.target.value)}
                            placeholder="Nhập mật khẩu đang dùng..."
                            className="w-full pl-3 pr-10 py-2 rounded-lg bg-[#070e08] border border-[#d9a75a]/30 text-[#fff6dc] focus:border-[#d9a75a] focus:outline-none font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPass(!showCurrentPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8ea885] hover:text-[#ffe3a3]"
                          >
                            {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block font-medium font-serif text-[#ffe3a3] mb-1">
                          Mật khẩu mới (Bỏ trống nếu không đổi)
                        </label>
                        <div className="relative">
                          <input
                            type={showNewPass ? 'text' : 'password'}
                            value={profileNewPassword}
                            onChange={(e) => setProfileNewPassword(e.target.value)}
                            placeholder="Tối thiểu 6 ký tự..."
                            className="w-full pl-3 pr-10 py-2 rounded-lg bg-[#070e08] border border-[#d9a75a]/30 text-[#fff6dc] focus:border-[#d9a75a] focus:outline-none font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPass(!showNewPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8ea885] hover:text-[#ffe3a3]"
                          >
                            {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block font-medium font-serif text-[#ffe3a3] mb-1">
                          Xác nhận mật khẩu mới
                        </label>
                        <div className="relative">
                          <input
                            type={showConfirmPass ? 'text' : 'password'}
                            value={profileConfirmPassword}
                            onChange={(e) => setProfileConfirmPassword(e.target.value)}
                            placeholder="Nhập lại mật khẩu mới..."
                            className="w-full pl-3 pr-10 py-2 rounded-lg bg-[#070e08] border border-[#d9a75a]/30 text-[#fff6dc] focus:border-[#d9a75a] focus:outline-none font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPass(!showConfirmPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8ea885] hover:text-[#ffe3a3]"
                          >
                            {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Advice Notice */}
                <div className="p-4 rounded-xl bg-[#09120a] border border-[#d9a75a]/25 text-xs text-[#a0b59d] space-y-1">
                  <p className="font-semibold text-[#ffe3a3] font-serif flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-[#d9a75a]" />
                    <span>Lưu ý bảo mật Tài khoản Quản trị:</span>
                  </p>
                  <p>
                    • Sau khi đổi mật khẩu hoặc tên đăng nhập thành công, phiên đăng nhập hiện tại sẽ tiếp tục có hiệu lực. Bạn có thể sử dụng thông tin mới cho các lần đăng nhập tiếp theo.
                  </p>
                  <p>
                    • Dữ liệu quản trị được đồng bộ và lưu trữ bảo mật trên tệp lưu trữ persistent transactional mirror tại máy chủ.
                  </p>
                </div>

                {/* Submit Action Button */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (data?.adminProfile) {
                        setProfileDisplayName(data.adminProfile.displayName || '');
                        setProfileUsername(data.adminProfile.username || '');
                        setProfileEmail(data.adminProfile.email || '');
                      }
                      setProfileCurrentPassword('');
                      setProfileNewPassword('');
                      setProfileConfirmPassword('');
                    }}
                    className="px-4 py-2 rounded-full border border-[#d9a75a]/30 text-[#8ea885] hover:text-[#fff6dc] hover:bg-[#d9a75a]/10 text-xs font-medium transition cursor-pointer"
                  >
                    Hủy thay đổi
                  </button>

                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-[#b8863b] via-[#d9a75a] to-[#b8863b] text-[#111d13] font-bold text-xs shadow-[0_6px_20px_rgba(217,167,90,0.4)] hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isSavingProfile ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin text-[#111d13]" />
                        <span>Đang lưu...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        <span>Lưu & Cập nhật Thông tin Tài khoản</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
