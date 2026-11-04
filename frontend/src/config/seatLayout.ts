export interface SeatConfig {
  id: number;
  code: string; // "01" -> "50"
  zoneName: string;
  ringIndex: 1 | 2 | 3 | 4;
  posX: number; // Percentage X (0 - 100) calibrated to 1376x768 background
  posY: number; // Percentage Y (0 - 100) calibrated to 1376x768 background
  scale: number; // Perspective scale factor relative to Zen Master
}

/**
 * 50 vị trí ngồi thiền được phân bổ trải rộng khắp khoảng đất rừng tự nhiên:
 * - Cánh Tả (Left Wing): 21 vị trí (01 - 21) - Mặt hướng về bên phải vào Thiền sư
 * - Trục Trung Tâm (Center Axis): 8 vị trí (22 - 29) - Quay lưng lại, nhìn thẳng cội cây
 * - Cánh Hữu (Right Wing): 21 vị trí (30 - 50) - Mặt hướng về bên trái vào Thiền sư
 */
export const INITIAL_SEAT_LAYOUT: SeatConfig[] = [
  // ==========================================================================
  // CÁNH TẢ (LEFT WING) - 21 TỌA CỤ (01 - 21) - Mặt hướng về bên phải (vào Thiền Sư)
  // posX trong khoảng 11.5% đến 43.5%
  // ==========================================================================
  // Hàng 1 (Xa nhất, Y ~ 61.5% - 63.5%)
  { id: 1,  code: '01', zoneName: 'Cánh Tả', ringIndex: 1, posX: 39.5, posY: 61.5, scale: 0.82 },
  { id: 2,  code: '02', zoneName: 'Cánh Tả', ringIndex: 1, posX: 32.0, posY: 62.0, scale: 0.82 },
  { id: 3,  code: '03', zoneName: 'Cánh Tả', ringIndex: 1, posX: 24.5, posY: 62.8, scale: 0.82 },
  { id: 4,  code: '04', zoneName: 'Cánh Tả', ringIndex: 1, posX: 17.0, posY: 63.5, scale: 0.82 },

  // Hàng 2 (Y ~ 67.2% - 70.0%)
  { id: 5,  code: '05', zoneName: 'Cánh Tả', ringIndex: 2, posX: 42.0, posY: 67.2, scale: 0.88 },
  { id: 6,  code: '06', zoneName: 'Cánh Tả', ringIndex: 2, posX: 34.0, posY: 68.0, scale: 0.88 },
  { id: 7,  code: '07', zoneName: 'Cánh Tả', ringIndex: 2, posX: 26.0, posY: 69.0, scale: 0.88 },
  { id: 8,  code: '08', zoneName: 'Cánh Tả', ringIndex: 2, posX: 17.5, posY: 70.0, scale: 0.88 },

  // Hàng 3 (Y ~ 73.5% - 77.0%)
  { id: 9,  code: '09', zoneName: 'Cánh Tả', ringIndex: 3, posX: 43.5, posY: 73.5, scale: 0.95 },
  { id: 10, code: '10', zoneName: 'Cánh Tả', ringIndex: 3, posX: 36.0, posY: 74.2, scale: 0.95 },
  { id: 11, code: '11', zoneName: 'Cánh Tả', ringIndex: 3, posX: 28.5, posY: 75.0, scale: 0.95 },
  { id: 12, code: '12', zoneName: 'Cánh Tả', ringIndex: 3, posX: 21.0, posY: 76.0, scale: 0.95 },
  { id: 13, code: '13', zoneName: 'Cánh Tả', ringIndex: 3, posX: 13.5, posY: 77.0, scale: 0.95 },

  // Hàng 4 (Y ~ 80.5% - 83.8%)
  { id: 14, code: '14', zoneName: 'Cánh Tả', ringIndex: 4, posX: 41.5, posY: 80.5, scale: 1.02 },
  { id: 15, code: '15', zoneName: 'Cánh Tả', ringIndex: 4, posX: 33.5, posY: 81.5, scale: 1.02 },
  { id: 16, code: '16', zoneName: 'Cánh Tả', ringIndex: 4, posX: 25.0, posY: 82.5, scale: 1.02 },
  { id: 17, code: '17', zoneName: 'Cánh Tả', ringIndex: 4, posX: 16.0, posY: 83.8, scale: 1.02 },

  // Hàng 5 (Tiền cảnh rộng, Y ~ 87.2% - 89.8%)
  { id: 18, code: '18', zoneName: 'Cánh Tả', ringIndex: 4, posX: 38.0, posY: 87.2, scale: 1.10 },
  { id: 19, code: '19', zoneName: 'Cánh Tả', ringIndex: 4, posX: 29.5, posY: 88.0, scale: 1.10 },
  { id: 20, code: '20', zoneName: 'Cánh Tả', ringIndex: 4, posX: 20.5, posY: 89.0, scale: 1.10 },
  { id: 21, code: '21', zoneName: 'Cánh Tả', ringIndex: 4, posX: 11.5, posY: 89.8, scale: 1.10 },

  // ==========================================================================
  // TRỤC TRUNG TÂM (CENTER AXIS) - 8 TỌA CỤ (22 - 29) - Quay lưng lại, nhìn thẳng cội cây
  // posX trong khoảng 47.6% đến 52.8%
  // ==========================================================================
  { id: 22, code: '22', zoneName: 'Trục Trung Tâm', ringIndex: 1, posX: 48.2, posY: 63.8, scale: 0.84 },
  { id: 23, code: '23', zoneName: 'Trục Trung Tâm', ringIndex: 1, posX: 52.2, posY: 63.8, scale: 0.84 },

  { id: 24, code: '24', zoneName: 'Trục Trung Tâm', ringIndex: 2, posX: 48.0, posY: 70.8, scale: 0.92 },
  { id: 25, code: '25', zoneName: 'Trục Trung Tâm', ringIndex: 2, posX: 52.4, posY: 70.8, scale: 0.92 },

  { id: 26, code: '26', zoneName: 'Trục Trung Tâm', ringIndex: 3, posX: 47.8, posY: 78.5, scale: 1.00 },
  { id: 27, code: '27', zoneName: 'Trục Trung Tâm', ringIndex: 3, posX: 52.6, posY: 78.5, scale: 1.00 },

  { id: 28, code: '28', zoneName: 'Trục Trung Tâm', ringIndex: 4, posX: 47.6, posY: 86.8, scale: 1.10 },
  { id: 29, code: '29', zoneName: 'Trục Trung Tâm', ringIndex: 4, posX: 52.8, posY: 86.8, scale: 1.10 },

  // ==========================================================================
  // CÁNH HỮU (RIGHT WING) - 21 TỌA CỤ (30 - 50) - Mặt hướng về bên trái (vào Thiền Sư)
  // posX trong khoảng 56.5% đến 88.5%
  // ==========================================================================
  // Hàng 1 (Xa nhất, Y ~ 61.5% - 63.5%)
  { id: 30, code: '30', zoneName: 'Cánh Hữu', ringIndex: 1, posX: 60.5, posY: 61.5, scale: 0.82 },
  { id: 31, code: '31', zoneName: 'Cánh Hữu', ringIndex: 1, posX: 68.0, posY: 62.0, scale: 0.82 },
  { id: 32, code: '32', zoneName: 'Cánh Hữu', ringIndex: 1, posX: 75.5, posY: 62.8, scale: 0.82 },
  { id: 33, code: '33', zoneName: 'Cánh Hữu', ringIndex: 1, posX: 83.0, posY: 63.5, scale: 0.82 },

  // Hàng 2 (Y ~ 67.2% - 70.0%)
  { id: 34, code: '34', zoneName: 'Cánh Hữu', ringIndex: 2, posX: 58.0, posY: 67.2, scale: 0.88 },
  { id: 35, code: '35', zoneName: 'Cánh Hữu', ringIndex: 2, posX: 66.0, posY: 68.0, scale: 0.88 },
  { id: 36, code: '36', zoneName: 'Cánh Hữu', ringIndex: 2, posX: 74.0, posY: 69.0, scale: 0.88 },
  { id: 37, code: '37', zoneName: 'Cánh Hữu', ringIndex: 2, posX: 82.5, posY: 70.0, scale: 0.88 },

  // Hàng 3 (Y ~ 73.5% - 77.0%)
  { id: 38, code: '38', zoneName: 'Cánh Hữu', ringIndex: 3, posX: 56.5, posY: 73.5, scale: 0.95 },
  { id: 39, code: '39', zoneName: 'Cánh Hữu', ringIndex: 3, posX: 64.0, posY: 74.2, scale: 0.95 },
  { id: 40, code: '40', zoneName: 'Cánh Hữu', ringIndex: 3, posX: 71.5, posY: 75.0, scale: 0.95 },
  { id: 41, code: '41', zoneName: 'Cánh Hữu', ringIndex: 3, posX: 79.0, posY: 76.0, scale: 0.95 },
  { id: 42, code: '42', zoneName: 'Cánh Hữu', ringIndex: 3, posX: 86.5, posY: 77.0, scale: 0.95 },

  // Hàng 4 (Y ~ 80.5% - 83.8%)
  { id: 43, code: '43', zoneName: 'Cánh Hữu', ringIndex: 4, posX: 58.5, posY: 80.5, scale: 1.02 },
  { id: 44, code: '44', zoneName: 'Cánh Hữu', ringIndex: 4, posX: 66.5, posY: 81.5, scale: 1.02 },
  { id: 45, code: '45', zoneName: 'Cánh Hữu', ringIndex: 4, posX: 75.0, posY: 82.5, scale: 1.02 },
  { id: 46, code: '46', zoneName: 'Cánh Hữu', ringIndex: 4, posX: 84.0, posY: 83.8, scale: 1.02 },

  // Hàng 5 (Tiền cảnh rộng, Y ~ 87.2% - 89.8%)
  { id: 47, code: '47', zoneName: 'Cánh Hữu', ringIndex: 4, posX: 62.0, posY: 87.2, scale: 1.10 },
  { id: 48, code: '48', zoneName: 'Cánh Hữu', ringIndex: 4, posX: 70.5, posY: 88.0, scale: 1.10 },
  { id: 49, code: '49', zoneName: 'Cánh Hữu', ringIndex: 4, posX: 79.5, posY: 89.0, scale: 1.10 },
  { id: 50, code: '50', zoneName: 'Cánh Hữu', ringIndex: 4, posX: 88.5, posY: 89.8, scale: 1.10 },
];
