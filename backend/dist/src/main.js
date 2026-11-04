"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const logger = new common_1.Logger('ThienVienServer');
    const app = await core_1.NestFactory.create(app_module_1.AppModule, {
        cors: {
            origin: '*',
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        },
    });
    const port = process.env.PORT || 3005;
    await app.listen(port, '0.0.0.0');
    logger.log(`THIỀN VIÊN Backend & Socket.IO Server running on http://0.0.0.0:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map