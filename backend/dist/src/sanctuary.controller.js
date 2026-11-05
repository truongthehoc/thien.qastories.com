"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SanctuaryController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const sanctuary_service_1 = require("./sanctuary.service");
const sanctuary_gateway_1 = require("./gateway/sanctuary.gateway");
const fs = require("fs");
const path = require("path");
const pngjs_1 = require("pngjs");
const jpeg = require("jpeg-js");
function getProjectRoot() {
    if (fs.existsSync(path.join(process.cwd(), 'frontend')) || fs.existsSync(path.join(process.cwd(), 'start.js'))) {
        return process.cwd();
    }
    if (fs.existsSync(path.join(process.cwd(), '..', 'frontend'))) {
        return path.resolve(process.cwd(), '..');
    }
    return process.cwd();
}
function cleanVietnameseFilename(rawName) {
    const ext = path.extname(rawName) || '.mp3';
    const base = path.basename(rawName, ext);
    const cleanBase = base
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[đĐ]/g, (m) => (m === 'đ' ? 'd' : 'D'))
        .replace(/[^a-zA-Z0-9_-]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-{2,}/g, '-');
    const timestamp = Date.now().toString().slice(-6);
    return `${cleanBase || 'audio'}_${timestamp}${ext.toLowerCase()}`;
}
function autoMatteImageBuffer(buffer, originalExt) {
    try {
        const isJpg = originalExt.toLowerCase() === '.jpg' || originalExt.toLowerCase() === '.jpeg';
        let w = 0, h = 0;
        let data;
        if (isJpg) {
            const decoded = jpeg.decode(buffer, { useTArray: true });
            w = decoded.width;
            h = decoded.height;
            data = decoded.data;
        }
        else {
            const parsed = pngjs_1.PNG.sync.read(buffer);
            w = parsed.width;
            h = parsed.height;
            data = parsed.data;
            const cornerIndices = [0, (w - 1), (h - 1) * w, (h - 1) * w + (w - 1)];
            let transCount = 0;
            for (const ci of cornerIndices) {
                if (data[ci * 4 + 3] < 30)
                    transCount++;
            }
            if (transCount >= 3) {
                return { buffer, ext: '.png' };
            }
        }
        const isBgPixel = (x, y) => {
            const idx = (y * w + x) * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];
            const diff = Math.max(Math.abs(r - g), Math.abs(r - b), Math.abs(g - b));
            const bright = (r + g + b) / 3;
            if (diff <= 22 && bright >= 65)
                return true;
            if (bright >= 238 && diff <= 30)
                return true;
            return false;
        };
        const isBg = new Uint8Array(w * h);
        const visited = new Uint8Array(w * h);
        const queueX = new Int32Array(w * h);
        const queueY = new Int32Array(w * h);
        let qHead = 0;
        let qTail = 0;
        const push = (x, y) => {
            const pos = y * w + x;
            if (!visited[pos]) {
                visited[pos] = 1;
                queueX[qTail] = x;
                queueY[qTail] = y;
                qTail++;
            }
        };
        for (let x = 0; x < w; x++) {
            push(x, 0);
            push(x, h - 1);
        }
        for (let y = 0; y < h; y++) {
            push(0, y);
            push(w - 1, y);
        }
        let bgCount = 0;
        while (qHead < qTail) {
            const cx = queueX[qHead++];
            const cy = queueY[qHead++];
            if (isBgPixel(cx, cy)) {
                isBg[cy * w + cx] = 1;
                bgCount++;
                if (cx > 0)
                    push(cx - 1, cy);
                if (cx < w - 1)
                    push(cx + 1, cy);
                if (cy > 0)
                    push(cx, cy - 1);
                if (cy < h - 1)
                    push(cx, cy + 1);
            }
        }
        if (bgCount < (w * h * 0.05)) {
            return { buffer, ext: isJpg ? '.jpg' : '.png' };
        }
        const outPng = new pngjs_1.PNG({ width: w, height: h });
        for (let i = 0; i < w * h; i++) {
            const srcIdx = i * 4;
            if (isBg[i]) {
                outPng.data[srcIdx] = 0;
                outPng.data[srcIdx + 1] = 0;
                outPng.data[srcIdx + 2] = 0;
                outPng.data[srcIdx + 3] = 0;
            }
            else {
                outPng.data[srcIdx] = data[srcIdx];
                outPng.data[srcIdx + 1] = data[srcIdx + 1];
                outPng.data[srcIdx + 2] = data[srcIdx + 2];
                outPng.data[srcIdx + 3] = isJpg ? 255 : data[srcIdx + 3];
            }
        }
        return { buffer: pngjs_1.PNG.sync.write(outPng), ext: '.png' };
    }
    catch {
        return { buffer, ext: originalExt };
    }
}
let SanctuaryController = class SanctuaryController {
    constructor(sanctuaryService, gateway) {
        this.sanctuaryService = sanctuaryService;
        this.gateway = gateway;
    }
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
    getActiveAnnouncements() {
        return { announcements: this.sanctuaryService.getActiveAnnouncements() };
    }
    async enterSanctuary(body) {
        const result = await this.sanctuaryService.enterSanctuary(body.displayName, body.avatarStyle || 'monastic_brown', body.existingUserId);
        if (result.allocatedSeat) {
            this.gateway.broadcastSeatUpdate(result.allocatedSeat);
        }
        this.gateway.broadcastStats();
        return result;
    }
    getUserProfile(userId) {
        return this.sanctuaryService.getUserDetails(userId);
    }
    async occupySeat(body) {
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
    async completeActivity(body) {
        const result = await this.sanctuaryService.completeActivityAndAwardPoints({
            userId: body.userId,
            seatId: Number(body.seatId),
            sessionId: body.sessionId,
            activityType: body.activityType,
        });
        this.gateway.broadcastFullSync();
        return result;
    }
    async leaveSeat(body) {
        const released = await this.sanctuaryService.releaseSeatByUser(body.userId, 'USER_LEAVE');
        if (released.length > 0) {
            this.gateway.broadcastFullSync();
        }
        return { releasedCount: released.length };
    }
    getAdminDashboard() {
        return this.sanctuaryService.getAdminDashboardData();
    }
    adminReleaseSeat(seatId) {
        const seat = this.sanctuaryService.adminForceReleaseSeat(Number(seatId));
        this.gateway.broadcastFullSync();
        return { seat };
    }
    adminToggleSeat(seatId, body) {
        const seat = this.sanctuaryService.adminToggleSeatEnabled(Number(seatId), Boolean(body.isEnabled));
        this.gateway.broadcastFullSync();
        return { seat };
    }
    adminUpdateUserStatus(userId, body) {
        const user = this.sanctuaryService.adminUpdateUserStatus(userId, body.status, body.reason);
        this.gateway.broadcastFullSync();
        return { user };
    }
    adminLogin(body) {
        const account = this.sanctuaryService.getAdminAccount();
        const inputUsername = (body.username || '').trim().toLowerCase();
        const inputPassword = body.password || '';
        if (inputUsername === account.username.toLowerCase() &&
            inputPassword === account.password) {
            this.sanctuaryService.recordAdminLogin(account.username);
            const token = `adm_token_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
            return {
                ok: true,
                token,
                profile: this.sanctuaryService.getAdminProfile(),
                expiresIn: 86400 * 7,
            };
        }
        throw new common_1.UnauthorizedException('Tài khoản hoặc mật khẩu quản trị không chính xác.');
    }
    adminVerify() {
        return { ok: true, valid: true, profile: this.sanctuaryService.getAdminProfile() };
    }
    getAdminProfile() {
        return { profile: this.sanctuaryService.getAdminProfile() };
    }
    updateAdminProfile(body) {
        const profile = this.sanctuaryService.updateAdminProfile(body);
        return { ok: true, profile };
    }
    async purgeTestData() {
        const result = await this.sanctuaryService.purgeTestDataForOfficialLaunch();
        this.gateway.broadcastFullSync();
        return result;
    }
    uploadAudioFile(file, body) {
        let fileUrl = '';
        if (file) {
            const safeName = cleanVietnameseFilename(file.originalname);
            const root = getProjectRoot();
            const distAssetDir = path.join(root, 'frontend', 'dist', 'assets', 'audio');
            if (!fs.existsSync(distAssetDir)) {
                fs.mkdirSync(distAssetDir, { recursive: true });
            }
            fs.writeFileSync(path.join(distAssetDir, safeName), file.buffer);
            const devAssetDir = path.join(root, 'frontend', 'public', 'assets', 'audio');
            if (fs.existsSync(path.dirname(devAssetDir))) {
                if (!fs.existsSync(devAssetDir))
                    fs.mkdirSync(devAssetDir, { recursive: true });
                fs.writeFileSync(path.join(devAssetDir, safeName), file.buffer);
            }
            const backendUploadDir = path.join(root, 'uploads', 'audio');
            if (!fs.existsSync(backendUploadDir)) {
                fs.mkdirSync(backendUploadDir, { recursive: true });
            }
            fs.writeFileSync(path.join(backendUploadDir, safeName), file.buffer);
            fileUrl = `/assets/audio/${safeName}`;
        }
        else if (!body.title) {
            throw new common_1.BadRequestException('Vui lòng chọn file MP3 hoặc nhập thông tin bài nhạc.');
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
    async uploadAudioChunk(file, body) {
        if (!file || !body.uploadId) {
            throw new common_1.BadRequestException('Dữ liệu phân mảnh không hợp lệ hoặc thiếu dữ liệu âm thanh.');
        }
        try {
            const uploadId = (body.uploadId || '').replace(/[^a-zA-Z0-9_-]/g, '');
            const chunkIndex = parseInt(body.chunkIndex, 10);
            const totalChunks = parseInt(body.totalChunks, 10);
            const root = getProjectRoot();
            const tempDir = path.join(root, 'uploads', 'chunks');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            const tempFilePath = path.join(tempDir, `${uploadId}.tmp`);
            if (chunkIndex === 0 && fs.existsSync(tempFilePath)) {
                try {
                    fs.unlinkSync(tempFilePath);
                }
                catch (_) { }
            }
            fs.appendFileSync(tempFilePath, file.buffer);
            if (chunkIndex < totalChunks - 1) {
                return { ok: true, chunkIndex, totalChunks };
            }
            const safeName = cleanVietnameseFilename(body.fileName || 'audio.mp3');
            const distAssetDir = path.join(root, 'frontend', 'dist', 'assets', 'audio');
            if (!fs.existsSync(distAssetDir))
                fs.mkdirSync(distAssetDir, { recursive: true });
            const distFilePath = path.join(distAssetDir, safeName);
            const devAssetDir = path.join(root, 'frontend', 'public', 'assets', 'audio');
            const isDevDirPresent = fs.existsSync(path.dirname(devAssetDir));
            if (isDevDirPresent && !fs.existsSync(devAssetDir))
                fs.mkdirSync(devAssetDir, { recursive: true });
            const devFilePath = path.join(devAssetDir, safeName);
            const backendUploadDir = path.join(root, 'uploads', 'audio');
            if (!fs.existsSync(backendUploadDir))
                fs.mkdirSync(backendUploadDir, { recursive: true });
            const backupFilePath = path.join(backendUploadDir, safeName);
            fs.copyFileSync(tempFilePath, backupFilePath);
            fs.copyFileSync(tempFilePath, distFilePath);
            if (isDevDirPresent) {
                try {
                    fs.copyFileSync(tempFilePath, devFilePath);
                }
                catch (_) { }
            }
            try {
                fs.unlinkSync(tempFilePath);
            }
            catch (_) { }
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
        }
        catch (err) {
            throw new common_1.BadRequestException(`Lỗi xử lý file âm thanh: ${err.message || err}`);
        }
    }
    upsertAudioTrack(body) {
        const track = this.sanctuaryService.adminUpsertAudioTrack(body);
        this.gateway.broadcastFullSync();
        return { track };
    }
    deleteAudioTrack(trackId) {
        const res = this.sanctuaryService.adminDeleteAudioTrack(trackId);
        this.gateway.broadcastFullSync();
        return res;
    }
    upsertSchedule(body) {
        const schedule = this.sanctuaryService.adminUpsertSchedule(body);
        this.gateway.broadcastFullSync();
        return { schedule };
    }
    deleteSchedule(scheduleId) {
        const res = this.sanctuaryService.adminDeleteSchedule(scheduleId);
        this.gateway.broadcastFullSync();
        return res;
    }
    updateSettings(body) {
        const settings = this.sanctuaryService.adminUpdateSettings(body);
        this.gateway.broadcastFullSync();
        return { settings };
    }
    uploadCharacterImage(file, body) {
        if (!file) {
            throw new common_1.BadRequestException('Vui lòng chọn hình ảnh (PNG, JPG, WEBP) để tải lên.');
        }
        const type = body.characterType;
        if (!['zenMaster', 'practitionerRight', 'practitionerLeft', 'practitionerCenter'].includes(type)) {
            throw new common_1.BadRequestException('Loại nhân vật không hợp lệ.');
        }
        const root = getProjectRoot();
        const origExt = path.extname(file.originalname) || '.png';
        const processed = autoMatteImageBuffer(file.buffer, origExt);
        const filename = `custom-${type}-${Date.now()}${processed.ext}`;
        const distTargetDir = path.join(root, 'frontend', 'dist', 'assets', 'sanctuary');
        if (!fs.existsSync(distTargetDir)) {
            fs.mkdirSync(distTargetDir, { recursive: true });
        }
        fs.writeFileSync(path.join(distTargetDir, filename), processed.buffer);
        const devTargetDir = path.join(root, 'frontend', 'public', 'assets', 'sanctuary');
        if (fs.existsSync(path.dirname(devTargetDir))) {
            if (!fs.existsSync(devTargetDir))
                fs.mkdirSync(devTargetDir, { recursive: true });
            fs.writeFileSync(path.join(devTargetDir, filename), processed.buffer);
        }
        const uploadBackupDir = path.join(root, 'uploads', 'sanctuary');
        if (!fs.existsSync(uploadBackupDir)) {
            fs.mkdirSync(uploadBackupDir, { recursive: true });
        }
        fs.writeFileSync(path.join(uploadBackupDir, filename), processed.buffer);
        const fileUrl = `/assets/sanctuary/${filename}`;
        const updateObj = {};
        if (type === 'zenMaster')
            updateObj.zenMasterUrl = fileUrl;
        else if (type === 'practitionerRight')
            updateObj.practitionerRightUrl = fileUrl;
        else if (type === 'practitionerLeft')
            updateObj.practitionerLeftUrl = fileUrl;
        else if (type === 'practitionerCenter')
            updateObj.practitionerCenterUrl = fileUrl;
        const newSettings = this.sanctuaryService.adminUpdateSettings(updateObj);
        this.gateway.broadcastFullSync();
        return { success: true, fileUrl, settings: newSettings };
    }
    getAdminAnnouncements() {
        return { announcements: this.sanctuaryService.state.announcements || [] };
    }
    upsertAnnouncement(body) {
        const announcement = this.sanctuaryService.adminUpsertAnnouncement(body);
        this.gateway.broadcastAnnouncements();
        return { announcement };
    }
    deleteAnnouncement(id) {
        const res = this.sanctuaryService.adminDeleteAnnouncement(id);
        this.gateway.broadcastAnnouncements();
        return res;
    }
    toggleAnnouncement(id) {
        const announcement = this.sanctuaryService.adminToggleAnnouncement(id);
        this.gateway.broadcastAnnouncements();
        return { announcement };
    }
};
exports.SanctuaryController = SanctuaryController;
__decorate([
    (0, common_1.Get)('sanctuary/state'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SanctuaryController.prototype, "getInitialState", null);
__decorate([
    (0, common_1.Get)('announcements'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SanctuaryController.prototype, "getActiveAnnouncements", null);
__decorate([
    (0, common_1.Post)('sessions/enter'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SanctuaryController.prototype, "enterSanctuary", null);
__decorate([
    (0, common_1.Get)('users/:userId/profile'),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SanctuaryController.prototype, "getUserProfile", null);
__decorate([
    (0, common_1.Post)('seats/occupy'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SanctuaryController.prototype, "occupySeat", null);
__decorate([
    (0, common_1.Post)('activities/complete'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SanctuaryController.prototype, "completeActivity", null);
__decorate([
    (0, common_1.Post)('seats/leave'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], SanctuaryController.prototype, "leaveSeat", null);
__decorate([
    (0, common_1.Get)('admin/dashboard'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SanctuaryController.prototype, "getAdminDashboard", null);
__decorate([
    (0, common_1.Post)('admin/seats/:seatId/release'),
    __param(0, (0, common_1.Param)('seatId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SanctuaryController.prototype, "adminReleaseSeat", null);
__decorate([
    (0, common_1.Put)('admin/seats/:seatId/toggle'),
    __param(0, (0, common_1.Param)('seatId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SanctuaryController.prototype, "adminToggleSeat", null);
__decorate([
    (0, common_1.Put)('admin/users/:userId/status'),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], SanctuaryController.prototype, "adminUpdateUserStatus", null);
__decorate([
    (0, common_1.Post)('admin/auth/login'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SanctuaryController.prototype, "adminLogin", null);
__decorate([
    (0, common_1.Get)('admin/auth/verify'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SanctuaryController.prototype, "adminVerify", null);
__decorate([
    (0, common_1.Get)('admin/profile'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SanctuaryController.prototype, "getAdminProfile", null);
__decorate([
    (0, common_1.Put)('admin/profile'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SanctuaryController.prototype, "updateAdminProfile", null);
__decorate([
    (0, common_1.Post)('admin/system/purge-test-data'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], SanctuaryController.prototype, "purgeTestData", null);
__decorate([
    (0, common_1.Post)('admin/audio/upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: 500 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], SanctuaryController.prototype, "uploadAudioFile", null);
__decorate([
    (0, common_1.Post)('admin/audio/upload/chunk'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('chunk', {
        limits: { fileSize: 100 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], SanctuaryController.prototype, "uploadAudioChunk", null);
__decorate([
    (0, common_1.Post)('admin/audio/tracks'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SanctuaryController.prototype, "upsertAudioTrack", null);
__decorate([
    (0, common_1.Delete)('admin/audio/tracks/:trackId'),
    __param(0, (0, common_1.Param)('trackId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SanctuaryController.prototype, "deleteAudioTrack", null);
__decorate([
    (0, common_1.Post)('admin/audio/schedules'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SanctuaryController.prototype, "upsertSchedule", null);
__decorate([
    (0, common_1.Delete)('admin/audio/schedules/:scheduleId'),
    __param(0, (0, common_1.Param)('scheduleId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SanctuaryController.prototype, "deleteSchedule", null);
__decorate([
    (0, common_1.Put)('admin/settings'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SanctuaryController.prototype, "updateSettings", null);
__decorate([
    (0, common_1.Post)('admin/characters/upload'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', {
        limits: { fileSize: 50 * 1024 * 1024 },
    })),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], SanctuaryController.prototype, "uploadCharacterImage", null);
__decorate([
    (0, common_1.Get)('admin/announcements'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], SanctuaryController.prototype, "getAdminAnnouncements", null);
__decorate([
    (0, common_1.Post)('admin/announcements'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SanctuaryController.prototype, "upsertAnnouncement", null);
__decorate([
    (0, common_1.Delete)('admin/announcements/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SanctuaryController.prototype, "deleteAnnouncement", null);
__decorate([
    (0, common_1.Put)('admin/announcements/:id/toggle'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], SanctuaryController.prototype, "toggleAnnouncement", null);
exports.SanctuaryController = SanctuaryController = __decorate([
    (0, common_1.Controller)('api'),
    __metadata("design:paramtypes", [sanctuary_service_1.SanctuaryService,
        sanctuary_gateway_1.SanctuaryGateway])
], SanctuaryController);
//# sourceMappingURL=sanctuary.controller.js.map