import React, { useEffect, useRef, useState } from 'react';
import { SanctuarySeat } from '../../types/sanctuary';
import { ZenMasterCenter } from './ZenMasterCenter';
import { MeditationSeatNode } from './MeditationSeatNode';
import { Sparkles, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

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

  // Mobile/Tablet Pan & Ring Focus State
  const [activeRingFilter, setActiveRingFilter] = useState<number | 'ALL'>('ALL');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragRef = useRef<{ isDragging: boolean; startX: number; startY: number }>({
    isDragging: false,
    startX: 0,
    startY: 0,
  });

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

  const [activeZoneFilter, setActiveZoneFilter] = useState<'ALL' | 'Cánh Tả' | 'Trục Trung Tâm' | 'Cánh Hữu'>('ALL');

  const handleSelectZone = (zone: 'ALL' | 'Cánh Tả' | 'Trục Trung Tâm' | 'Cánh Hữu') => {
    setActiveZoneFilter(zone);
    if (zone === 'ALL') {
      setZoomLevel(1);
      setPanOffset({ x: 0, y: 0 });
    } else if (zone === 'Cánh Tả') {
      setZoomLevel(1.15);
      setPanOffset({ x: 120, y: -20 });
    } else if (zone === 'Cánh Hữu') {
      setZoomLevel(1.15);
      setPanOffset({ x: -120, y: -20 });
    } else if (zone === 'Trục Trung Tâm') {
      setZoomLevel(1.2);
      setPanOffset({ x: 0, y: -30 });
    }
  };

  const handleQuickFindEmptySeat = () => {
    const emptySeats = seats.filter((s) => s.isEnabled && s.status === 'EMPTY');
    if (emptySeats.length > 0) {
      const chosen = emptySeats[Math.floor(Math.random() * emptySeats.length)];
      onSelectSeat(chosen);
    }
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = {
      isDragging: true,
      startX: e.clientX - panOffset.x,
      startY: e.clientY - panOffset.y,
    };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.isDragging) return;
    const stageW = Math.max(window.innerWidth, (window.innerHeight * 16) / 9);
    const maxPanX = Math.max(120, (stageW - window.innerWidth) / 2);
    const maxPanY = Math.max(60, (zoomLevel - 1) * 200 + 40);
    const nextX = Math.max(-maxPanX, Math.min(maxPanX, e.clientX - dragRef.current.startX));
    const nextY = Math.max(-maxPanY, Math.min(maxPanY, e.clientY - dragRef.current.startY));
    setPanOffset({ x: nextX, y: nextY });
  };

  const handlePointerUp = () => {
    dragRef.current.isDragging = false;
  };

  const filteredSeats =
    activeZoneFilter === 'ALL'
      ? seats
      : seats.filter((s) => s.zoneName === activeZoneFilter);

  return (
    <div
      className="relative w-screen h-screen overflow-hidden bg-[#0c160e] select-none touch-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* Interactive Sanctuary Stage Container (Giữ nguyên tỉ lệ 16:9 tự nhiên, không bị méo/kéo dài trên Mobile) */}
      <div
        className="absolute top-0 h-full transition-transform duration-300 ease-out"
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
          {filteredSeats.map((seat) => (
            <MeditationSeatNode
              key={seat.id}
              seat={seat}
              currentUserId={currentUserId}
              isSelected={selectedSeatId === seat.id}
              onSelectSeat={onSelectSeat}
            />
          ))}
        </div>
      </div>

      {/* 7. Canvas Particle Layer (Floating Leaves & Sunlight Motes) */}
      {enableNatureAnimations && (
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none z-30"
        />
      )}
    </div>
  );
};
