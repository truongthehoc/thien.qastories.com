"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const INITIAL_SEATS = [
    { id: 1, code: '01', zoneName: 'Liên Hoa Nội Tâm', ringIndex: 1, posX: 34.5, posY: 50.5, scale: 0.84 },
    { id: 2, code: '02', zoneName: 'Liên Hoa Nội Tâm', ringIndex: 1, posX: 38.2, posY: 53.2, scale: 0.85 },
    { id: 3, code: '03', zoneName: 'Liên Hoa Nội Tâm', ringIndex: 1, posX: 42.5, posY: 54.8, scale: 0.86 },
    { id: 4, code: '04', zoneName: 'Liên Hoa Nội Tâm', ringIndex: 1, posX: 47.2, posY: 55.4, scale: 0.86 },
    { id: 5, code: '05', zoneName: 'Liên Hoa Nội Tâm', ringIndex: 1, posX: 52.0, posY: 54.8, scale: 0.86 },
    { id: 6, code: '06', zoneName: 'Liên Hoa Nội Tâm', ringIndex: 1, posX: 56.5, posY: 53.0, scale: 0.85 },
    { id: 7, code: '07', zoneName: 'Liên Hoa Nội Tâm', ringIndex: 1, posX: 60.5, posY: 50.2, scale: 0.84 },
    { id: 8, code: '08', zoneName: 'Liên Hoa Nội Tâm', ringIndex: 1, posX: 30.8, posY: 48.2, scale: 0.83 },
    { id: 9, code: '09', zoneName: 'Tùng Lâm Tĩnh Độ', ringIndex: 2, posX: 25.5, posY: 53.0, scale: 0.88 },
    { id: 10, code: '10', zoneName: 'Tùng Lâm Tĩnh Độ', ringIndex: 2, posX: 29.8, posY: 56.2, scale: 0.89 },
    { id: 11, code: '11', zoneName: 'Tùng Lâm Tĩnh Độ', ringIndex: 2, posX: 34.4, posY: 58.6, scale: 0.90 },
    { id: 12, code: '12', zoneName: 'Tùng Lâm Tĩnh Độ', ringIndex: 2, posX: 39.2, posY: 60.2, scale: 0.91 },
    { id: 13, code: '13', zoneName: 'Tùng Lâm Tĩnh Độ', ringIndex: 2, posX: 44.2, posY: 61.2, scale: 0.91 },
    { id: 14, code: '14', zoneName: 'Tùng Lâm Tĩnh Độ', ringIndex: 2, posX: 49.4, posY: 61.0, scale: 0.91 },
    { id: 15, code: '15', zoneName: 'Tùng Lâm Tĩnh Độ', ringIndex: 2, posX: 54.6, posY: 59.8, scale: 0.90 },
    { id: 16, code: '16', zoneName: 'Tùng Lâm Tĩnh Độ', ringIndex: 2, posX: 59.5, posY: 57.6, scale: 0.89 },
    { id: 17, code: '17', zoneName: 'Tùng Lâm Tĩnh Độ', ringIndex: 2, posX: 73.5, posY: 52.0, scale: 0.87 },
    { id: 18, code: '18', zoneName: 'Tùng Lâm Tĩnh Độ', ringIndex: 2, posX: 77.8, posY: 54.8, scale: 0.88 },
    { id: 19, code: '19', zoneName: 'Tùng Lâm Tĩnh Độ', ringIndex: 2, posX: 82.0, posY: 57.5, scale: 0.89 },
    { id: 20, code: '20', zoneName: 'Tùng Lâm Tĩnh Độ', ringIndex: 2, posX: 75.2, posY: 58.4, scale: 0.90 },
    { id: 21, code: '21', zoneName: 'Trúc Lâm An Trú', ringIndex: 3, posX: 19.2, posY: 58.8, scale: 0.93 },
    { id: 22, code: '22', zoneName: 'Trúc Lâm An Trú', ringIndex: 3, posX: 23.8, posY: 61.8, scale: 0.94 },
    { id: 23, code: '23', zoneName: 'Trúc Lâm An Trú', ringIndex: 3, posX: 28.5, posY: 64.5, scale: 0.95 },
    { id: 24, code: '24', zoneName: 'Trúc Lâm An Trú', ringIndex: 3, posX: 33.4, posY: 66.5, scale: 0.96 },
    { id: 25, code: '25', zoneName: 'Trúc Lâm An Trú', ringIndex: 3, posX: 38.4, posY: 67.8, scale: 0.96 },
    { id: 26, code: '26', zoneName: 'Trúc Lâm An Trú', ringIndex: 3, posX: 43.6, posY: 68.4, scale: 0.97 },
    { id: 27, code: '27', zoneName: 'Trúc Lâm An Trú', ringIndex: 3, posX: 48.8, posY: 67.6, scale: 0.97 },
    { id: 28, code: '28', zoneName: 'Trúc Lâm An Trú', ringIndex: 3, posX: 54.0, posY: 66.0, scale: 0.96 },
    { id: 29, code: '29', zoneName: 'Trúc Lâm An Trú', ringIndex: 3, posX: 58.8, posY: 63.8, scale: 0.95 },
    { id: 30, code: '30', zoneName: 'Trúc Lâm An Trú', ringIndex: 3, posX: 76.8, posY: 63.2, scale: 0.95 },
    { id: 31, code: '31', zoneName: 'Trúc Lâm An Trú', ringIndex: 3, posX: 81.4, posY: 65.5, scale: 0.96 },
    { id: 32, code: '32', zoneName: 'Trúc Lâm An Trú', ringIndex: 3, posX: 86.2, posY: 63.0, scale: 0.95 },
    { id: 33, code: '33', zoneName: 'Trúc Lâm An Trú', ringIndex: 3, posX: 73.5, posY: 67.8, scale: 0.97 },
    { id: 34, code: '34', zoneName: 'Trúc Lâm An Trú', ringIndex: 3, posX: 78.8, posY: 70.2, scale: 0.98 },
    { id: 35, code: '35', zoneName: 'Sơn Khê Thanh Tịnh', ringIndex: 4, posX: 14.5, posY: 67.5, scale: 0.99 },
    { id: 36, code: '36', zoneName: 'Sơn Khê Thanh Tịnh', ringIndex: 4, posX: 18.8, posY: 71.2, scale: 1.00 },
    { id: 37, code: '37', zoneName: 'Sơn Khê Thanh Tịnh', ringIndex: 4, posX: 23.4, posY: 74.0, scale: 1.01 },
    { id: 38, code: '38', zoneName: 'Sơn Khê Thanh Tịnh', ringIndex: 4, posX: 28.2, posY: 76.2, scale: 1.02 },
    { id: 39, code: '39', zoneName: 'Sơn Khê Thanh Tịnh', ringIndex: 4, posX: 33.2, posY: 77.8, scale: 1.03 },
    { id: 40, code: '40', zoneName: 'Sơn Khê Thanh Tịnh', ringIndex: 4, posX: 38.4, posY: 79.0, scale: 1.04 },
    { id: 41, code: '41', zoneName: 'Sơn Khê Thanh Tịnh', ringIndex: 4, posX: 43.8, posY: 78.2, scale: 1.04 },
    { id: 42, code: '42', zoneName: 'Sơn Khê Thanh Tịnh', ringIndex: 4, posX: 49.0, posY: 76.0, scale: 1.03 },
    { id: 43, code: '43', zoneName: 'Sơn Khê Thanh Tịnh', ringIndex: 4, posX: 20.5, posY: 80.5, scale: 1.05 },
    { id: 44, code: '44', zoneName: 'Sơn Khê Thanh Tịnh', ringIndex: 4, posX: 26.2, posY: 82.8, scale: 1.06 },
    { id: 45, code: '45', zoneName: 'Sơn Khê Thanh Tịnh', ringIndex: 4, posX: 32.0, posY: 84.2, scale: 1.06 },
    { id: 46, code: '46', zoneName: 'Sơn Khê Thanh Tịnh', ringIndex: 4, posX: 68.5, posY: 75.5, scale: 1.03 },
    { id: 47, code: '47', zoneName: 'Sơn Khê Thanh Tịnh', ringIndex: 4, posX: 74.2, posY: 77.8, scale: 1.04 },
    { id: 48, code: '48', zoneName: 'Sơn Khê Thanh Tịnh', ringIndex: 4, posX: 80.0, posY: 76.2, scale: 1.03 },
    { id: 49, code: '49', zoneName: 'Sơn Khê Thanh Tịnh', ringIndex: 4, posX: 65.2, posY: 82.2, scale: 1.05 },
    { id: 50, code: '50', zoneName: 'Sơn Khê Thanh Tịnh', ringIndex: 4, posX: 72.0, posY: 84.0, scale: 1.06 },
];
async function main() {
    console.log('Seeding THIỀN VIÊN MySQL Database...');
    for (const s of INITIAL_SEATS) {
        await prisma.meditationSeat.upsert({
            where: { id: s.id },
            update: {},
            create: {
                id: s.id,
                code: s.code,
                zoneName: s.zoneName,
                ringIndex: s.ringIndex,
                posX: s.posX,
                posY: s.posY,
                scale: s.scale,
                isEnabled: true,
                currentStatus: 'EMPTY',
            },
        });
    }
    await prisma.adminUser.upsert({
        where: { username: 'admin' },
        update: {},
        create: {
            username: 'admin',
            passwordHash: 'admin123',
            fullName: 'Ban Quản Trị Thiền Viên',
            role: 'SUPER_ADMIN',
        },
    });
    console.log('Seed completed successfully.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=seed.js.map