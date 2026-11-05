import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SanctuarySeat } from '../../types/sanctuary';
import { ZenMasterCenter } from './ZenMasterCenter';
import { MeditationSeatNode } from './MeditationSeatNode';
import { Sparkles, ZoomIn, ZoomOut, RotateCcw, Users } from 'lucide-react';

interface ForestEnvironmentProps {
  seats: SanctuarySeat[];
  currentUserId?: string;
  selectedSeatId?: number | null;
  backgroundUrl?: string;
  zenMasterUrl?: string;
  enableNatureAnimations?: boolean;
  onSelectSeat: (seat: SanctuarySeat) => void;
}

interface ForestParticle {
  x: number;
  y: number;
  size: number;
  speedX: number;
  speedY: number;
  angle: number;
  spin: number;
  opacity: number;
  type: 'leaf' | 'sunMote';
}

export const ForestEnvironment: React.FC<ForestEnvironmentProps> = ({
  seats,
  currentUserId,
  selectedSeatId,
  backgroundUrl = '/assets/sanctuary/forest-sanctuary-bg.jpg',
  zenMasterUrl = '/assets/sanctuary/zen-master-figure.png',
  enableNatureAnimations = true,
  onSelectSeat,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Mobile / Screen Viewport Detection
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.innerWidth < 768 || window.innerWidth < window.innerHeight;
  });

  // Mobile/Tablet Camera & Pan State
  type CameraViewMode = 'OVERVIEW' | 'MASTER' | 'LEFT' | 'RIGHT' | 'MY_SEAT';
  const [cameraMode, setCameraMode] = useState<CameraViewMode>('OVERVIEW');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Multi-touch & Drag Tracking Refs
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const pinchStartDistRef = useRef<number | null>(null);
  const pinchStartZoomRef = useRef<number>(1);
  const dragStartRef = useRef<{ x: number; y: number; startPanX: number; startPanY: number }>({
    x: 0,
    y: 0,
    startPanX: 0,
    startPanY: 0,
  });
  const hasMovedRef = useRef<boolean>(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768 || window.innerWidth < window.innerHeight;
      setIsMobile(mobile);
    };
    window.addEventListener('resize', checkMobile);
    window.addEventListener('orientationchange', checkMobile);
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('orientationchange', checkMobile);
    };
  }, []);

  // Preset Camera Transitions
  const setCameraPreset = useCallback(
    (mode: CameraViewMode) => {
      setCameraMode(mode);
      const stageW = Math.max(window.innerWidth, (window.innerHeight * 16) / 9);
      const stageH = window.innerHeight;

      if (mode === 'OVERVIEW') {
        setZoomLevel(isMobile ? 0.60 : 0.95);
        setPanOffset({ x: 0, y: isMobile ? -25 : 0 });
      } else if (mode === 'MASTER') {
        setZoomLevel(isMobile ? 1.25 : 1.35);
        setPanOffset({ x: 0, y: isMobile ? 45 : 25 });
      } else if (mode === 'LEFT') {
        setZoomLevel(isMobile ? 1.05 : 1.20);
        // Stage center is 50%, Left Wing is at ~28% -> diff is +22%
        setPanOffset({ x: stageW * 0.22, y: isMobile ? -10 : 0 });
      } else if (mode === 'RIGHT') {
        setZoomLevel(isMobile ? 1.05 : 1.20);
        // Stage center is 50%, Right Wing is at ~72% -> diff is -22%
        setPanOffset({ x: -stageW * 0.22, y: isMobile ? -10 : 0 });
      } else if (mode === 'MY_SEAT') {
        const mySeat = seats.find((s) => s.occupant?.userId === currentUserId);
        if (mySeat) {
          const diffX = ((50 - mySeat.posX) / 100) * stageW;
          const diffY = ((65 - mySeat.posY) / 100) * stageH;
          setZoomLevel(isMobile ? 1.20 : 1.30);
          setPanOffset({ x: diffX, y: diffY });
        }
      }
    },
    [isMobile, seats, currentUserId]
  );

  // Active zone occupant counts
  const leftOccupants = seats.filter(
    (s) => s.zoneName === 'Cánh Tả' && s.status !== 'EMPTY' && s.occupant
  );
  const centerOccupants = seats.filter(
    (s) => s.zoneName === 'Trục Trung Tâm' && s.status !== 'EMPTY' && s.occupant
  );
  const rightOccupants = seats.filter(
    (s) => s.zoneName === 'Cánh Hữu' && s.status !== 'EMPTY' && s.occupant
  );
  const mySeat = seats.find((s) => s.occupant?.userId === currentUserId);

  // Distance helper for pinch gesture
  const getDistance = (p1: { x: number; y: number }, p2: { x: number; y: number }) => {
    return Math.hypot(p2.x - p1.x, p2.y - p1.y);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size === 1) {
      dragStartRef.current = {
        x: e.clientX,
        y: e.clientY,
        startPanX: panOffset.x,
        startPanY: panOffset.y,
      };
      hasMovedRef.current = false;
    } else if (activePointersRef.current.size === 2) {
      const pts = Array.from(activePointersRef.current.values());
      pinchStartDistRef.current = getDistance(pts[0], pts[1]);
      pinchStartZoomRef.current = zoomLevel;
      setIsDragging(true);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!activePointersRef.current.has(e.pointerId)) return;
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    // 2-finger Pinch to Zoom
    if (activePointersRef.current.size === 2 && pinchStartDistRef.current) {
      const pts = Array.from(activePointersRef.current.values());
      const currentDist = getDistance(pts[0], pts[1]);
      const factor = currentDist / pinchStartDistRef.current;
      const minZoom = isMobile ? 0.48 : 0.65;
      const maxZoom = isMobile ? 1.60 : 1.85;
      const nextZoom = Math.min(maxZoom, Math.max(minZoom, pinchStartZoomRef.current * factor));
      setZoomLevel(nextZoom);
      return;
    }

    // 1-finger or Mouse Pan
    if (activePointersRef.current.size === 1) {
      const deltaX = e.clientX - dragStartRef.current.x;
      const deltaY = e.clientY - dragStartRef.current.y;

      if (Math.hypot(deltaX, deltaY) > 6) {
        hasMovedRef.current = true;
        if (!isDragging) setIsDragging(true);
      }

      if (hasMovedRef.current) {
        const stageW = Math.max(window.innerWidth, (window.innerHeight * 16) / 9);
        const maxPanX = Math.max(180, ((stageW * zoomLevel) - window.innerWidth) / 2 + 120);
        const maxPanY = Math.max(100, (zoomLevel - 1) * 220 + 90);
        const nextX = Math.max(-maxPanX, Math.min(maxPanX, dragStartRef.current.startPanX + deltaX));
        const nextY = Math.max(-maxPanY, Math.min(maxPanY, dragStartRef.current.startPanY + deltaY));
        setPanOffset({ x: nextX, y: nextY });
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    activePointersRef.current.delete(e.pointerId);
    if (activePointersRef.current.size < 2) {
      pinchStartDistRef.current = null;
    }
    if (activePointersRef.current.size === 0) {
      setIsDragging(false);
    }
  };

  // ============================================================================
  // ORGANIC NATURE PARTICLES (Falling Canopy Leaves & Golden Sunlight Motes)
  // ============================================================================
  useEffect(() => {
    if (!enableNatureAnimations) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const resize = () => {
      const parent = canvas.parentElement;
      canvas.width = parent ? parent.clientWidth : window.innerWidth;
      canvas.height = parent ? parent.clientHeight : window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // 22 gentle falling leaves from ancient bodhi canopy & 28 golden sunlight motes
    const particles: ForestParticle[] = [
      ...Array.from({ length: 22 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: 3.5 + Math.random() * 4.5,
        speedX: 0.12 + Math.random() * 0.3,
        speedY: 0.2 + Math.random() * 0.3,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.015,
        opacity: 0.45 + Math.random() * 0.4,
        type: 'leaf' as const,
      })),
      ...Array.from({ length: 28 }, () => ({
        x: canvas.width * 0.2 + Math.random() * (canvas.width * 0.6),
        y: Math.random() * (canvas.height * 0.9),
        size: 1.2 + Math.random() * 2.2,
        speedX: (Math.random() - 0.5) * 0.16,
        speedY: -0.06 - Math.random() * 0.15,
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - 0.5) * 0.01,
        opacity: 0.25 + Math.random() * 0.45,
        type: 'sunMote' as const,
      })),
    ];

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;

      for (const p of particles) {
        p.x += p.speedX + Math.sin(p.angle) * 0.18;
        p.y += p.speedY;
        p.angle += p.spin;

        if (p.y > h + 20) {
          p.y = -15;
          p.x = Math.random() * w;
        }
        if (p.y < -20) {
          p.y = h + 15;
        }
        if (p.x > w + 20) p.x = -15;
        if (p.x < -20) p.x = w + 15;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.angle);

        if (p.type === 'leaf') {
          ctx.fillStyle = `rgba(142, 172, 108, ${p.opacity})`;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size, p.size * 0.46, 0, 0, Math.PI * 2);
          ctx.fill();
        } else {
          const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 2.2);
          grad.addColorStop(0, `rgba(255, 246, 212, ${p.opacity})`);
          grad.addColorStop(1, 'rgba(255, 246, 212, 0)');
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(0, 0, p.size * 2.2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resize);
    };
  }, [enableNatureAnimations]);

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-[#0c160e] select-none touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Interactive Sanctuary Stage Container (Full màn hình, phủ trọn vẹn 100% không gian tự nhiên) */}
      <div
        className={`absolute top-0 h-full ${
          isDragging ? 'transition-none' : 'transition-transform duration-500 ease-out'
        }`}
        style={{
          width: 'max(100vw, calc(100vh * 16 / 9))',
          left: '50%',
          transform: `translateX(-50%) translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${zoomLevel})`,
          transformOrigin: '50% 50%',
        }}
      >
        {/* 1. Base High-Resolution 2.5D Ancient Forest Sanctuary Painting (Khoảng đất bằng phẳng thanh tịnh) */}
        <img
          src={backgroundUrl}
          alt="Không gian rừng cổ thụ Thiền Viên"
          className="absolute inset-0 w-full h-full object-cover pointer-events-none"
          draggable={false}
        />

        {/* 2. Slow Organic Ambient Light Breathe Overlay (90s cycle) */}
        {enableNatureAnimations && (
          <div
            className="animate-forest-ambient absolute inset-0 pointer-events-none"
            style={{
              background:
                'radial-gradient(ellipse at 50% 32%, rgba(255, 248, 220, 0.24) 0%, rgba(217, 167, 90, 0.12) 45%, rgba(14, 28, 16, 0.15) 85%)',
              mixBlendMode: 'soft-light',
            }}
          />
        )}

        {/* 3. Volumetric God Rays & Breathing Sunlight Shafts */}
        {enableNatureAnimations && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ mixBlendMode: 'screen' }}>
            {/* Primary God Ray (Center-Left) */}
            <div
              className="animate-godray-1 absolute -top-32 left-[27%] w-[20%] h-[105%]"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255, 250, 225, 0.42) 0%, rgba(235, 195, 120, 0.18) 55%, transparent 100%)',
                filter: 'blur(20px)',
              }}
            />
            {/* Central God Ray (Illuminating Zen Master & Altar) */}
            <div
              className="animate-godray-2 absolute -top-24 left-[41%] w-[24%] h-[98%]"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255, 252, 235, 0.46) 0%, rgba(245, 210, 140, 0.20) 60%, transparent 100%)',
                filter: 'blur(24px)',
              }}
            />
            {/* Secondary God Ray (Right Forest clearing) */}
            <div
              className="animate-godray-3 absolute -top-28 left-[58%] w-[16%] h-[90%]"
              style={{
                background:
                  'linear-gradient(180deg, rgba(255, 245, 210, 0.35) 0%, rgba(225, 185, 110, 0.14) 50%, transparent 100%)',
                filter: 'blur(18px)',
              }}
            />
          </div>
        )}

        {/* 4. Deep Multi-Layered Forest Mist */}
        {enableNatureAnimations && (
          <>
            <div
              className="animate-mist-deep absolute inset-x-0 bottom-[16%] h-[40%] pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at 50% 50%, rgba(235, 245, 235, 0.22) 0%, rgba(195, 220, 200, 0.08) 55%, transparent 80%)',
                filter: 'blur(24px)',
              }}
            />
            <div
              className="animate-mist-deep absolute inset-x-0 bottom-[35%] h-[28%] pointer-events-none"
              style={{
                animationDelay: '-18s',
                background:
                  'radial-gradient(ellipse at 65% 45%, rgba(245, 248, 235, 0.14) 0%, rgba(185, 215, 190, 0.05) 50%, transparent 75%)',
                filter: 'blur(28px)',
              }}
            />
          </>
        )}

        {/* 5. Centerpiece: The Ascetic Zen Master Seated by the Ancient Bodhi Tree Base */}
        <ZenMasterCenter zenMasterUrl={zenMasterUrl} />

        {/* 6. 50 Natural Meditation Cushions (Tọa cụ Bồ đoàn #01 - #50) */}
        <div className="absolute inset-0 z-20">
          {seats.map((seat) => (
            <MeditationSeatNode
              key={seat.id}
              seat={seat}
              currentUserId={currentUserId}
              isSelected={selectedSeatId === seat.id}
              onSelectSeat={(s) => {
                // If the pointer dragged, do not open seat modal
                if (!hasMovedRef.current) {
                  onSelectSeat(s);
                }
              }}
            />
          ))}
        </div>
      </div>

      {/* 7. Canvas Particle Layer (Floating Leaves & Sunlight Motes) */}
      {enableNatureAnimations && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-25"
        />
      )}

      {/* 8. Desktop Only: Sanctuary Camera Control Bar (Trên mobile mặc định là toàn cảnh, không hiển thị khung điều hướng này) */}
      <div className="hidden sm:flex fixed bottom-6 left-1/2 -translate-x-1/2 z-30 pointer-events-auto select-none max-w-[96vw]">
        <div className="flex items-center gap-1 sm:gap-1.5 p-1 sm:p-1.5 rounded-full bg-black/65 hover:bg-black/85 backdrop-blur-md border border-[#d9a75a]/35 shadow-2xl text-xs">
          {/* Toàn Cảnh (Bao quát cả Thiền Sư và toàn bộ hành giả) */}
          <button
            type="button"
            onClick={() => setCameraPreset('OVERVIEW')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all text-[10px] sm:text-xs font-medium cursor-pointer ${
              cameraMode === 'OVERVIEW'
                ? 'bg-[#d9a75a] text-[#121f14] shadow-md font-semibold'
                : 'text-[#d8e4d5] hover:text-[#fff6dc] hover:bg-white/10'
            }`}
            title="Góc nhìn toàn cảnh (hiển thị đầy đủ Thiền Sư và toàn thể đạo hữu)"
          >
            <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" />
            <span>Toàn cảnh</span>
          </button>

          {/* Thiền Sư An Trú */}
          <button
            type="button"
            onClick={() => setCameraPreset('MASTER')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all text-[10px] sm:text-xs font-medium cursor-pointer ${
              cameraMode === 'MASTER'
                ? 'bg-[#d9a75a] text-[#121f14] shadow-md font-semibold'
                : 'text-[#d8e4d5] hover:text-[#fff6dc] hover:bg-white/10'
            }`}
            title="Tiến gần chiêm bái Thiền Sư An Trú dưới cội Bồ đề"
          >
            <span>🧘</span>
            <span>Thiền Sư</span>
          </button>

          {/* Cánh Tả */}
          <button
            type="button"
            onClick={() => setCameraPreset('LEFT')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all text-[10px] sm:text-xs font-medium cursor-pointer ${
              cameraMode === 'LEFT'
                ? 'bg-[#d9a75a] text-[#121f14] shadow-md font-semibold'
                : 'text-[#d8e4d5] hover:text-[#fff6dc] hover:bg-white/10'
            }`}
            title="Quan sát khu vực Cánh Tả"
          >
            <span>👈</span>
            <span className="hidden sm:inline">Cánh </span>
            <span>Tả</span>
            {leftOccupants.length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                  cameraMode === 'LEFT'
                    ? 'bg-[#121f14] text-[#d9a75a]'
                    : 'bg-[#d9a75a]/35 text-[#ffe3a3]'
                }`}
              >
                {leftOccupants.length}
              </span>
            )}
          </button>

          {/* Cánh Hữu */}
          <button
            type="button"
            onClick={() => setCameraPreset('RIGHT')}
            className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all text-[10px] sm:text-xs font-medium cursor-pointer ${
              cameraMode === 'RIGHT'
                ? 'bg-[#d9a75a] text-[#121f14] shadow-md font-semibold'
                : 'text-[#d8e4d5] hover:text-[#fff6dc] hover:bg-white/10'
            }`}
            title="Quan sát khu vực Cánh Hữu"
          >
            <span className="hidden sm:inline">Cánh </span>
            <span>Hữu</span>
            <span>👉</span>
            {rightOccupants.length > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                  cameraMode === 'RIGHT'
                    ? 'bg-[#121f14] text-[#d9a75a]'
                    : 'bg-[#d9a75a]/35 text-[#ffe3a3]'
                }`}
              >
                {rightOccupants.length}
              </span>
            )}
          </button>

          {/* Tọa Vị Của Tôi (Nếu đang ngồi) */}
          {mySeat && (
            <button
              type="button"
              onClick={() => setCameraPreset('MY_SEAT')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-full transition-all text-[10px] sm:text-xs font-medium cursor-pointer ${
                cameraMode === 'MY_SEAT'
                  ? 'bg-[#2a452a] text-[#ffe7b3] border border-[#d9a75a] shadow-md font-semibold'
                  : 'text-[#ffe7b3] bg-[#2a452a]/60 hover:bg-[#2a452a]/90'
              }`}
              title={`Trở về tọa cụ của tôi (#${mySeat.code})`}
            >
              <span>📍</span>
              <span className="font-mono text-[9px] sm:text-[10px]">#{mySeat.code}</span>
            </button>
          )}

          {/* Divider */}
          <div className="h-3.5 w-[1px] bg-white/15 mx-0.5 hidden sm:block" />

          {/* Manual Zoom Controls (Desktop & Quick Zoom) */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.55, z - 0.15))}
              className="p-1 rounded-full text-[#d8e4d5] hover:text-white hover:bg-white/10 transition-colors"
              title="Thu nhỏ góc nhìn"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(1.8, z + 0.15))}
              className="p-1 rounded-full text-[#d8e4d5] hover:text-white hover:bg-white/10 transition-colors"
              title="Phóng to góc nhìn"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setCameraPreset('OVERVIEW');
              }}
              className="p-1 rounded-full text-[#d8e4d5] hover:text-white hover:bg-white/10 transition-colors"
              title="Đặt lại góc nhìn mặc định"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
