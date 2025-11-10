import express from 'express';
import db from '../models/index.js';

const router = express.Router();

// API lấy tổng số phiên chat
router.get('/total-chats', async (req, res) => {
  try {
    const totalChats = await db.PhienChat.count();
    res.json({ totalChats });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy tổng số phiên chat' });
  }
});

// API lấy tổng số tin nhắn
router.get('/total-messages', async (req, res) => {
  try {
    const totalMessages = await db.TinNhan.count();
    res.json({ totalMessages });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy tổng số tin nhắn' });
  }
});

// API lấy tổng số khách hàng
router.get('/total-customers', async (req, res) => {
  try {
    const totalCustomers = await db.KhachHang.count();
    res.json({ totalCustomers });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy tổng số khách hàng' });
  }
});

// API lấy tổng số cảnh báo
router.get('/total-warnings', async (req, res) => {
  try {
    const totalWarnings = await db.CanhBao.count();
    res.json({ totalWarnings });
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy tổng số cảnh báo' });
  }
});

// API lấy dữ liệu phiên chat theo thời gian (ví dụ: 7 ngày qua)
router.get('/chats-over-time', async (req, res) => {
  try {
    const data = await db.PhienChat.findAll({
      attributes: [
        [db.sequelize.fn('DATE', db.sequelize.col('ThoiGianBatDau')), 'date'],
        [db.sequelize.fn('COUNT', db.sequelize.col('MaPhienChat')), 'count']
      ],
      where: {
        ThoiGianBatDau: {
          [db.Sequelize.Op.gte]: new Date(new Date() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      group: ['date'],
      order: [['date', 'ASC']]
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy dữ liệu phiên chat' });
  }
});

// API lấy phân phối trạng thái phiên chat
router.get('/chat-status-distribution', async (req, res) => {
  try {
    const data = await db.PhienChat.findAll({
      attributes: [
        'TrangThai',
        [db.sequelize.fn('COUNT', db.sequelize.col('MaPhienChat')), 'count']
      ],
      group: ['TrangThai']
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy phân phối trạng thái' });
  }
});

// API lấy danh sách các phiên chat gần đây
router.get('/recent-chats', async (req, res) => {
  try {
    const recentChats = await db.PhienChat.findAll({
      limit: 5,
      order: [['ThoiGianBatDau', 'DESC']],
      include: [
        { model: db.KhachHang, attributes: ['HoTen'] },
        { model: db.NhanVien, attributes: ['HoTen'] }
      ]
    });
    res.json(recentChats);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy các phiên chat gần đây' });
  }
});

// API lấy top nhân viên hỗ trợ
router.get('/top-employees', async (req, res) => {
  try {
    const topEmployees = await db.PhienChat.findAll({
      attributes: [
        'MaNV',
        [db.sequelize.fn('COUNT', db.sequelize.col('MaPhienChat')), 'chatCount']
      ],
      where: { MaNV: { [db.Sequelize.Op.ne]: null } },
      group: ['MaNV'],
      order: [[db.sequelize.literal('chatCount'), 'DESC']],
      limit: 5,
      include: [{ model: db.NhanVien, attributes: ['HoTen'] }]
    });
    res.json(topEmployees);
  } catch (error) {
    res.status(500).json({ error: 'Lỗi khi lấy top nhân viên' });
  }
});

// API lấy phân loại cảnh báo
router.get('/warning-types', async (req, res) => {
  try {
    const warningTypes = await db.CanhBao.findAll({
      attributes: [
        [db.sequelize.col('PhanLoaiCanhBao.PhanLoai'), 'name'],
        [db.sequelize.fn('COUNT', db.sequelize.col('CanhBao.MaCB')), 'value']
      ],
      include: [{
        model: db.PhanLoaiCanhBao,
        attributes: []
      }],
      group: [db.sequelize.col('PhanLoaiCanhBao.PhanLoai')]
    });
    res.json(warningTypes);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi khi lấy phân loại cảnh báo' });
  }
});

// API lấy tất cả cảnh báo
router.get('/warnings', async (req, res) => {
  try {
    const warnings = await db.CanhBao.findAll({
      include: [{
        model: db.PhanLoaiCanhBao,
        attributes: ['PhanLoai']
      }]
    });
    res.json(warnings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Lỗi khi lấy cảnh báo' });
  }
});

// API lấy hoạt động gần đây (từ nhật ký xử lý)
router.get('/recent-activities', async (req, res) => {
  try {
    const recentActivities = await db.NhatKyXuLy.findAll({
      limit: 10,
      order: [['ThoiGian', 'DESC']],
      include: [{ model: db.NhanVien, attributes: ['HoTen'], as: 'Performer' }]
    });
    res.json(recentActivities);
  } catch (error) {
    console.error("Error fetching recent activities:", error); // Added explicit logging
    res.status(500).json({ error: 'Lỗi khi lấy hoạt động gần đây' });
  }
});

// API lấy cảnh báo gần đây cho thông báo
router.get('/recent-warnings', async (req, res) => {
  try {
    const recentWarnings = await db.CanhBao.findAll({
      limit: 10,
      order: [['ThoiGianTao', 'DESC']],
      include: [{
        model: db.PhanLoaiCanhBao,
        attributes: ['PhanLoai', 'MucDoUuTien']
      }],
      attributes: ['MaCB', 'TenCB', 'ThoiGianTao', 'GhiChu']
    });
    res.json(recentWarnings);
  } catch (error) {
    console.error("Error fetching recent warnings:", error);
    res.status(500).json({ error: 'Lỗi khi lấy cảnh báo gần đây' });
  }
});

export default router;