import express from 'express';
import { getAllThongBaos, markThongBaoAsRead } from '../controllers/thongBaoController.js';

const router = express.Router();

// GET /api/thongbao - Lấy tất cả thông báo chưa đọc
router.get('/', getAllThongBaos);

// PUT /api/thongbao/:id/read - Đánh dấu một thông báo là đã đọc
router.put('/:id/read', markThongBaoAsRead);

export default router;
