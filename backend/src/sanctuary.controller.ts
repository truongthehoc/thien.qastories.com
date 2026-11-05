import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SanctuaryService } from './sanctuary.service';
import { SanctuaryGateway } from './gateway/sanctuary.gateway';
import * as fs from 'fs';
import * as path from 'path';
import { PNG } from 'pngjs';
import * as jpeg from 'jpeg-js';

function getProjectRoot(): string {
  // 1. If running from repository root (e.g. /www/wwwroot/thien.qastories.com)
  if (fs.existsSync(path.join(process.cwd(), 'frontend')) || fs.existsSync(path.join(process.cwd(), 'start.js'))) {
    return process.cwd();
  }
  // 2. If running inside backend directory
  if (fs.existsSync(path.join(process.cwd(), '..', 'frontend'))) {
    return path.resolve(process.cwd(), '..');
  }
  return process.cwd();
}

function cleanVietnameseFilename(rawName: string): string {
  const ext = path.extname(rawName) || '.mp3';
  const base = path.basename(rawName, ext);

  const cleanBase = base
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacritical marks
    .replace(/[đĐ]/g, (m) => (m === 'đ' ? 'd' : 'D'))
    .replace(/[^a-zA-Z0-9_-]+/g, '-') // Convert non-alphanumeric to dashes
    .replace(/^-+|-+$/g, '') // Trim dashes
    .replace(/-{2,}/g, '-'); // Deduplicate multiple dashes

  const timestamp = Date.now().toString().slice(-6);
  return `${cleanBase || 'audio'}_${timestamp}${ext.toLowerCase()}`;
}

function autoMatteImageBuffer(buffer: Buffer, originalExt: string): { buffer: Buffer; ext: string } {
  try {
    const isJpg = originalExt.toLowerCase() === '.jpg' || originalExt.toLowerCase() === '.jpeg';
    let w = 0, h = 0;
    let data: Uint8Array | Buffer;

    if (isJpg) {
      const decoded = jpeg.decode(buffer, { useTArray: true });
      w = decoded.width;
      h = decoded.height;
      data = decoded.data;
    } else {
      const parsed = PNG.sync.read(buffer);
      w = parsed.width;
      h = parsed.height;
      data = parsed.data;

      // If corners are already transparent, return as is
      const cornerIndices = [0, (w - 1), (h - 1) * w, (h - 1) * w + (w - 1)];
      let transCount = 0;
      for (const ci of cornerIndices) {
        if (data[ci * 4 + 3] < 30) transCount++;
      }
      if (transCount >= 3) {
        return { buffer, ext: '.png' };
      }
    }

    const isBgPixel = (x: number, y: number) => {
      const idx = (y * w + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const diff = Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b));
      const bright = (r + g + b) / 3;

      if (diff <= 22 && bright >= 65) return true;
      if (bright >= 238 && diff <= 30) return true;
      return false;
    };

    const isBg = new Uint8Array(w * h);
    const visited = new Uint8Array(w * h);
    const queueX = new Int32Array(w * h);
    const queueY = new Int32Array(w * h);
    let qHead = 0;
    let qTail = 0;

    const push = (x: number, y: number) => {
      const pos = y * w + x;
      if (!visited[pos]) {
        visited[pos] = 1;
        queueX[qTail] = x;
        queueY[qTail] = y;
        qTail++;
      }
    };

    for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
    for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }

    let bgCount = 0;
    while (qHead < qTail) {
      const cx = queueX[qHead++];
      const cy = queueY[qHead++];
      if (isBgPixel(cx, cy)) {
        isBg[cy * w + cx] = 1;
        bgCount++;
        if (cx > 0) push(cx - 1, cy);
        if (cx < w - 1) push(cx + 1, cy);
        if (cy > 0) push(cx, cy - 1);
        if (cy < h - 1) push(cx, cy + 1);
      }
    }

    if (bgCount < (w * h * 0.05)) {
      return { buffer, ext: isJpg ? '.jpg' : '.png' };
    }

    const outPng = new PNG({ width: w, height: h });
    for (let i = 0; i < w * h; i++) {
      const srcIdx = i * 4;
      if (isBg[i]) {
        outPng.data[srcIdx] = 0;
        outPng.data[srcIdx + 1] = 0;
        outPng.data[srcIdx + 2] = 0;
        outPng.data[srcIdx + 3] = 0;
      } else {
        outPng.data[srcIdx] = data[srcIdx];
        outPng.data[srcIdx + 1] = data[srcIdx + 1];
        outPng.data[srcIdx + 2] = data[srcIdx + 2];
        outPng.data[srcIdx + 3] = isJpg ? 255 : data[srcIdx + 3];
      }
    }

    return { buffer: PNG.sync.write(outPng), ext: '.png' };
  } catch {
    return { buffer, ext: originalExt };
  }
}

@Controller('api')
export class SanctuaryController {
  constructor(
    private readonly sanctuaryService: SanctuaryService,
    private readonly gateway: SanctuaryGateway
  ) {}

  // ==========================================================================
  // PUBLIC SANCTUARY ENDPOINTS
  // ==========================================================================
  @Get('sanctuary/state')
  getInitialState() {
    return {
      seats: this.sanctuaryService.state.seats,
      stats: this.sanctuaryService.getLiveStats(),
      settings: this.sanctuaryService.state.settings,
      syncedAudio: this.sanctuaryService.getSyncedAudioState(),
      audioTracks: this.sanctuaryService.state.audioTracks,
      audioSchedules: this.sanctuaryService.state.audioSchedules,
      announcements: this.sanctuaryService.getActiveAnnouncements(),
    };
  }

  @Get('announcements')
  getActiveAnnouncements() {
    return { announcements: this.sanctuaryService.getActiveAnnouncements() };
  }

  @Post('sessions/enter')
  async enterSanctuary(
    @Body()
    body: {
      displayName: string;
      avatarStyle?: string;
      existingUserId?: string;
    }
  ) {
    const result = await this.sanctuaryService.enterSanctuary(
      body.displayName,
      body.avatarStyle || 'monastic_brown',
      body.existingUserId
    );
    if (result.allocatedSeat) {
      this.gateway.broadcastSeatUpdate(result.allocatedSeat);
    }
    this.gateway.broadcastStats();
    return result;
  }

  @Get('users/:userId/profile')
  getUserProfile(@Param('userId') userId: string) {
    return this.sanctuaryService.getUserDetails(userId);
  }

  @Post('seats/occupy')
  async occupySeat(
    @Body()
    body: {
      userId: string;
      seatId?: number;
      activityType: 'MEDITATING' | 'BOWING';
      targetMinutes?: 5 | 10 | 15 | 30;
    }
  ) {
    const seatIdNum = body.seatId && Number(body.seatId) > 0 ? Number(body.seatId) : undefined;
    const result = await this.sanctuaryService.occupySeatForActivity({
      userId: body.userId,
      seatId: seatIdNum,
      activityType: body.activityType,
      targetMinutes: body.targetMinutes,
    });
    this.gateway.broadcastSeatUpdate(result.seat);
    if (result.vacatedSeats && Array.isArray(result.vacatedSeats)) {
      for (const vacated of result.vacatedSeats) {
        this.gateway.broadcastSeatUpdate(vacated);
      }
    }
    return result;
  }

  @Post('activities/complete')
  async completeActivity(
    @Body()
    body: {
      userId: string;
      seatId: number;
      sessionId: string;
      activityType: 'MEDITATING' | 'BOWING';
    }
  ) {
    const result = await this.sanctuaryService.completeActivityAndAwardPoints({
      userId: body.userId,
      seatId: Number(body.seatId),
      sessionId: body.sessionId,
      activityType: body.activityType,
    });
    this.gateway.broadcastFullSync();
    return result;
  }

  @Post('seats/leave')
  async leaveSeat(@Body() body: { userId: string }) {
    const released = await this.sanctuaryService.releaseSeatByUser(
      body.userId,
      'USER_LEAVE'
    );
    if (released.length > 0) {
      this.gateway.broadcastFullSync();
    }
    return { releasedCount: released.length };
  }

  // ==========================================================================
  // ADMIN DASHBOARD ENDPOINTS (/admin)
  // ==========================================================================
  @Get('admin/dashboard')
  getAdminDashboard() {
    return this.sanctuaryService.getAdminDashboardData();
  }

  @Post('admin/seats/:seatId/release')
  adminReleaseSeat(@Param('seatId') seatId: string) {
    const seat = this.sanctuaryService.adminForceReleaseSeat(Number(seatId));
    this.gateway.broadcastFullSync();
    return { seat };
  }

  @Put('admin/seats/:seatId/toggle')
  adminToggleSeat(
    @Param('seatId') seatId: string,
    @Body() body: { isEnabled: boolean }
  ) {
    const seat = this.sanctuaryService.adminToggleSeatEnabled(
      Number(seatId),
      Boolean(body.isEnabled)
    );
    this.gateway.broadcastFullSync();
    return { seat };
  }

  @Put('admin/users/:userId/status')
  adminUpdateUserStatus(
    @Param('userId') userId: string,
    @Body()
    body: { status: 'ACTIVE' | 'RESTRICTED' | 'BANNED'; reason?: string }
  ) {
    const user = this.sanctuaryService.adminUpdateUserStatus(
      userId,
      body.status,
      body.reason
    );
    this.gateway.broadcastFullSync();
    return { user };
  }

  // ============================================================================
  // ADMIN AUTHENTICATION & PROFILE
  // ============================================================================
  @Post('admin/auth/login')
  adminLogin(@Body() body: { username?: string; password?: string }) {
    const account = this.sanctuaryService.getAdminAccount();
    const inputUsername = (body.username || '').trim().toLowerCase();
    const inputPassword = body.password || '';

    if (
      inputUsername === account.username.toLowerCase() &&
      inputPassword === account.password
    ) {
      this.sanctuaryService.recordAdminLogin(account.username);
      const token = `adm_token_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
      return {
        ok: true,
        token,
        profile: this.sanctuaryService.getAdminProfile(),
        expiresIn: 86400 * 7,
      };
    }
    throw new UnauthorizedException('Tài khoản hoặc mật khẩu quản trị không chính xác.');
  }

  @Get('admin/auth/verify')
  adminVerify() {
    return { ok: true, valid: true, profile: this.sanctuaryService.getAdminProfile() };
  }

  @Get('admin/profile')
  getAdminProfile() {
    return { profile: this.sanctuaryService.getAdminProfile() };
  }

  @Put('admin/profile')
  updateAdminProfile(
    @Body()
    body: {
      displayName?: string;
      email?: string;
      username?: string;
      currentPassword?: string;
      newPassword?: string;
      avatarUrl?: string;
    }
  ) {
    const profile = this.sanctuaryService.updateAdminProfile(body);
    return { ok: true, profile };
  }

  @Post('admin/system/purge-test-data')
  async purgeTestData() {
    const result = await this.sanctuaryService.purgeTestDataForOfficialLaunch();
    this.gateway.broadcastFullSync();
    return result;
  }

  @Post('admin/audio/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 500 * 1024 * 1024 }, // 500 MB limit
    })
  )
  uploadAudioFile(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      title?: string;
      description?: string;
      category?: 'NHAC_THIEN' | 'TIENG_SUOI' | 'TIENG_MUA' | 'TIENG_CHUONG' | 'TUNG_KINH';
      durationSeconds?: string;
      isAmbientBg?: string;
    }
  ) {
    let fileUrl = '';
    if (file) {
      const safeName = cleanVietnameseFilename(file.originalname);

      const root = getProjectRoot();

      // 1. Save to frontend dist (production static serve)
      const distAssetDir = path.join(root, 'frontend', 'dist', 'assets', 'audio');
      if (!fs.existsSync(distAssetDir)) {
        fs.mkdirSync(distAssetDir, { recursive: true });
      }
      fs.writeFileSync(path.join(distAssetDir, safeName), file.buffer);

      // 2. Save to frontend public (dev static serve if folder exists)
      const devAssetDir = path.join(root, 'frontend', 'public', 'assets', 'audio');
      if (fs.existsSync(path.dirname(devAssetDir))) {
        if (!fs.existsSync(devAssetDir)) fs.mkdirSync(devAssetDir, { recursive: true });
        fs.writeFileSync(path.join(devAssetDir, safeName), file.buffer);
      }

      // 3. Save backup in uploads
      const backendUploadDir = path.join(root, 'uploads', 'audio');
      if (!fs.existsSync(backendUploadDir)) {
        fs.mkdirSync(backendUploadDir, { recursive: true });
      }
      fs.writeFileSync(path.join(backendUploadDir, safeName), file.buffer);

      fileUrl = `/assets/audio/${safeName}`;
    } else if (!body.title) {
      throw new BadRequestException('Vui lòng chọn file MP3 hoặc nhập thông tin bài nhạc.');
    }

    const track = this.sanctuaryService.adminUpsertAudioTrack({
      title: body.title || file?.originalname || 'Bài nhạc Thiền',
      description: body.description || '',
      category: body.category || 'NHAC_THIEN',
      fileUrl,
      durationSeconds: Number(body.durationSeconds) || 300,
      isAmbientBg: body.isAmbientBg === 'true',
      isEnabled: true,
    });

    this.gateway.broadcastFullSync();
    return { track };
  }

  @Post('admin/audio/upload/chunk')
  @UseInterceptors(
    FileInterceptor('chunk', {
      limits: { fileSize: 100 * 1024 * 1024 }, // 100 MB per chunk
    })
  )
  async uploadAudioChunk(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      uploadId: string;
      chunkIndex: string;
      totalChunks: string;
      fileName: string;
      title?: string;
      description?: string;
      category?: 'NHAC_THIEN' | 'TIENG_SUOI' | 'TIENG_MUA' | 'TIENG_CHUONG' | 'TUNG_KINH';
      durationSeconds?: string;
      isAmbientBg?: string;
    }
  ) {
    if (!file || !body.uploadId) {
      throw new BadRequestException('Dữ liệu phân mảnh không hợp lệ hoặc thiếu dữ liệu âm thanh.');
    }

    try {
      const uploadId = (body.uploadId || '').replace(/[^a-zA-Z0-9_-]/g, '');
      const chunkIndex = parseInt(body.chunkIndex, 10);
      const totalChunks = parseInt(body.totalChunks, 10);
      const root = getProjectRoot();

      // Ensure chunks directory exists
      const tempDir = path.join(root, 'uploads', 'chunks');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const tempFilePath = path.join(tempDir, `${uploadId}.tmp`);

      // If first chunk, reset any stale partial upload file
      if (chunkIndex === 0 && fs.existsSync(tempFilePath)) {
        try { fs.unlinkSync(tempFilePath); } catch (_) {}
      }

      // Synchronously append each chunk directly to target tmp file (uses only chunk size in RAM)
      fs.appendFileSync(tempFilePath, file.buffer);

      // If not the last chunk, acknowledge receipt
      if (chunkIndex < totalChunks - 1) {
        return { ok: true, chunkIndex, totalChunks };
      }

      // Last chunk received -> File is 100% complete! Assemble final MP3 file
      const safeName = cleanVietnameseFilename(body.fileName || 'audio.mp3');

      // Ensure target directories exist
      const distAssetDir = path.join(root, 'frontend', 'dist', 'assets', 'audio');
      if (!fs.existsSync(distAssetDir)) fs.mkdirSync(distAssetDir, { recursive: true });
      const distFilePath = path.join(distAssetDir, safeName);

      const devAssetDir = path.join(root, 'frontend', 'public', 'assets', 'audio');
      const isDevDirPresent = fs.existsSync(path.dirname(devAssetDir));
      if (isDevDirPresent && !fs.existsSync(devAssetDir)) fs.mkdirSync(devAssetDir, { recursive: true });
      const devFilePath = path.join(devAssetDir, safeName);

      const backendUploadDir = path.join(root, 'uploads', 'audio');
      if (!fs.existsSync(backendUploadDir)) fs.mkdirSync(backendUploadDir, { recursive: true });
      const backupFilePath = path.join(backendUploadDir, safeName);

      // Copy completed temp file to destinations
      fs.copyFileSync(tempFilePath, backupFilePath);
      fs.copyFileSync(tempFilePath, distFilePath);
      if (isDevDirPresent) {
        try { fs.copyFileSync(tempFilePath, devFilePath); } catch (_) {}
      }

      // Clean up temporary file
      try { fs.unlinkSync(tempFilePath); } catch (_) {}

      const fileUrl = `/assets/audio/${safeName}`;

      const track = this.sanctuaryService.adminUpsertAudioTrack({
        title: body.title || body.fileName || 'Bài nhạc Thiền',
        description: body.description || '',
        category: body.category || 'NHAC_THIEN',
        fileUrl,
        durationSeconds: Number(body.durationSeconds) || 300,
        isAmbientBg: body.isAmbientBg === 'true',
        isEnabled: true,
      });

      this.gateway.broadcastFullSync();
      return { track };
    } catch (err: any) {
      throw new BadRequestException(`Lỗi xử lý file âm thanh: ${err.message || err}`);
    }
  }

  @Post('admin/audio/tracks')
  upsertAudioTrack(@Body() body: Record<string, unknown>) {
    const track = this.sanctuaryService.adminUpsertAudioTrack(body);
    this.gateway.broadcastFullSync();
    return { track };
  }

  @Delete('admin/audio/tracks/:trackId')
  deleteAudioTrack(@Param('trackId') trackId: string) {
    const res = this.sanctuaryService.adminDeleteAudioTrack(trackId);
    this.gateway.broadcastFullSync();
    return res;
  }

  @Post('admin/audio/schedules')
  upsertSchedule(@Body() body: Record<string, unknown>) {
    const schedule = this.sanctuaryService.adminUpsertSchedule(body);
    this.gateway.broadcastFullSync();
    return { schedule };
  }

  @Delete('admin/audio/schedules/:scheduleId')
  deleteSchedule(@Param('scheduleId') scheduleId: string) {
    const res = this.sanctuaryService.adminDeleteSchedule(scheduleId);
    this.gateway.broadcastFullSync();
    return res;
  }

  @Put('admin/settings')
  updateSettings(@Body() body: Record<string, unknown>) {
    const settings = this.sanctuaryService.adminUpdateSettings(body);
    this.gateway.broadcastFullSync();
    return { settings };
  }

  @Post('admin/characters/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
    })
  )
  uploadCharacterImage(
    @UploadedFile() file: Express.Multer.File,
    @Body()
    body: {
      characterType: 'zenMaster' | 'practitionerRight' | 'practitionerLeft' | 'practitionerCenter';
    }
  ) {
    if (!file) {
      throw new BadRequestException('Vui lòng chọn hình ảnh (PNG, JPG, WEBP) để tải lên.');
    }

    const type = body.characterType;
    if (!['zenMaster', 'practitionerRight', 'practitionerLeft', 'practitionerCenter'].includes(type)) {
      throw new BadRequestException('Loại nhân vật không hợp lệ.');
    }

    const root = getProjectRoot();
    const origExt = path.extname(file.originalname) || '.png';
    const processed = autoMatteImageBuffer(file.buffer, origExt);
    const filename = `custom-${type}-${Date.now()}${processed.ext}`;

    // 1. Save directly to frontend dist (production static serve)
    const distTargetDir = path.join(root, 'frontend', 'dist', 'assets', 'sanctuary');
    if (!fs.existsSync(distTargetDir)) {
      fs.mkdirSync(distTargetDir, { recursive: true });
    }
    fs.writeFileSync(path.join(distTargetDir, filename), processed.buffer);

    // 2. Save directly to frontend public (dev static serve if directory exists)
    const devTargetDir = path.join(root, 'frontend', 'public', 'assets', 'sanctuary');
    if (fs.existsSync(path.dirname(devTargetDir))) {
      if (!fs.existsSync(devTargetDir)) fs.mkdirSync(devTargetDir, { recursive: true });
      fs.writeFileSync(path.join(devTargetDir, filename), processed.buffer);
    }

    // 3. Save backup to uploads
    const uploadBackupDir = path.join(root, 'uploads', 'sanctuary');
    if (!fs.existsSync(uploadBackupDir)) {
      fs.mkdirSync(uploadBackupDir, { recursive: true });
    }
    fs.writeFileSync(path.join(uploadBackupDir, filename), processed.buffer);

    const fileUrl = `/assets/sanctuary/${filename}`;

    // Update corresponding setting
    const updateObj: Record<string, string> = {};
    if (type === 'zenMaster') updateObj.zenMasterUrl = fileUrl;
    else if (type === 'practitionerRight') updateObj.practitionerRightUrl = fileUrl;
    else if (type === 'practitionerLeft') updateObj.practitionerLeftUrl = fileUrl;
    else if (type === 'practitionerCenter') updateObj.practitionerCenterUrl = fileUrl;

    const newSettings = this.sanctuaryService.adminUpdateSettings(updateObj);
    this.gateway.broadcastFullSync();

    return { success: true, fileUrl, settings: newSettings };
  }

  // ============================================================================
  // ANNOUNCEMENTS ADMIN CRUD
  // ============================================================================
  @Get('admin/announcements')
  getAdminAnnouncements() {
    return { announcements: this.sanctuaryService.state.announcements || [] };
  }

  @Post('admin/announcements')
  upsertAnnouncement(@Body() body: any) {
    const announcement = this.sanctuaryService.adminUpsertAnnouncement(body);
    this.gateway.broadcastAnnouncements();
    return { announcement };
  }

  @Delete('admin/announcements/:id')
  deleteAnnouncement(@Param('id') id: string) {
    const res = this.sanctuaryService.adminDeleteAnnouncement(id);
    this.gateway.broadcastAnnouncements();
    return res;
  }

  @Put('admin/announcements/:id/toggle')
  toggleAnnouncement(@Param('id') id: string) {
    const announcement = this.sanctuaryService.adminToggleAnnouncement(id);
    this.gateway.broadcastAnnouncements();
    return { announcement };
  }
}
