# THIỀN VIÊN – KHÔNG GIAN AN TRÚ (DIGITAL MEDITATION SANCTUARY)

Ứng dụng không gian thiền định trực tuyến thời gian thực (Realtime 2.5D Digital Meditation Sanctuary), nơi hành giả có thể đảnh lễ Thiền sư hoặc ngồi thiền tĩnh tâm tại 50 vị trí tọa cụ giữa rừng đại thụ.

## 1. Công nghệ sử dụng
- **Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + Framer Motion + Zustand + Web Audio API / HTML5 Audio.
- **Backend**: NestJS + Socket.IO (WebSockets Realtime) + Prisma ORM.
- **Database**: Chuẩn hóa 15 bảng MySQL (`backend/prisma/schema.prisma`) kèm cơ chế Persistent Transactional Mirror (`backend/data/sanctuary-db.json`) đảm bảo vận hành tức thì ngay cả khi máy chưa bật MySQL daemon.

## 2. Khởi chạy hệ thống
1. **Khởi động Backend (Cổng `3001`)**:
   ```bash
   npm run dev:backend
   ```
2. **Khởi động Frontend (Cổng `5173`)**:
   ```bash
   npm run dev:frontend
   ```
3. **Truy cập ứng dụng**:
   - Không gian Thiền Viên chính: `http://localhost:5173/`
   - Trang Quản trị (Microsoft 365 Admin Center Style): `http://localhost:5173/admin`

## 3. Đồng bộ với MySQL Server (khi chạy MySQL ở cổng 3306)
```bash
npm run db:generate
npm run db:push
npm run db:seed
```
