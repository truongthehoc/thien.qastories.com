"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
const fs = require("fs");
const prisma_module_1 = require("./prisma/prisma.module");
const sanctuary_service_1 = require("./sanctuary.service");
const sanctuary_controller_1 = require("./sanctuary.controller");
const sanctuary_gateway_1 = require("./gateway/sanctuary.gateway");
const frontendDistPath = fs.existsSync((0, path_1.join)(process.cwd(), 'frontend', 'dist'))
    ? (0, path_1.join)(process.cwd(), 'frontend', 'dist')
    : fs.existsSync((0, path_1.join)(process.cwd(), '..', 'frontend', 'dist'))
        ? (0, path_1.join)(process.cwd(), '..', 'frontend', 'dist')
        : (0, path_1.join)(process.cwd(), 'uploads');
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(process.cwd(), 'uploads'),
                serveRoot: '/uploads',
            }),
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: frontendDistPath,
                exclude: ['/api/(.*)', '/socket.io/(.*)', '/uploads/(.*)'],
            }),
        ],
        controllers: [sanctuary_controller_1.SanctuaryController],
        providers: [sanctuary_service_1.SanctuaryService, sanctuary_gateway_1.SanctuaryGateway],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map