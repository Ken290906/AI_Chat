import express from 'express';
import db from '../models/index.js';
import exceljs from 'exceljs';

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

// API XUẤT BÁO CÁO EXCEL VỚI CẤU TRÚC NHƯ HÌNH 
router.get('/export-report', async (req, res) => {
  try {
    // =======================================================
    // 1. TÍNH TOÁN DỮ LIỆU (PHẢI THỰC HIỆN TRƯỚC KHI ĐỊNH DẠNG HEADER)
    // =======================================================
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const whereToday = {
      ThoiGianBatDau: {
        [db.Sequelize.Op.gte]: today
      }
    };
    const whereWarningToday = {
      ThoiGianTao: {
        [db.Sequelize.Op.gte]: today
      }
    };

    // Lấy số lượng hội thoại xử lý (trong ngày)
    const totalChatsToday = await db.PhienChat.count({ where: whereToday });

    // Lấy số lượng khách hàng mới (phát sinh trong ngày)
    const newCustomersToday = await db.KhachHang.count({
      where: {
        NgayTao: { [db.Sequelize.Op.gte]: today }
      }
    });

    // Lấy tổng số tin nhắn (trong ngày)
    const messagesToday = await db.TinNhan.count({
      where: {
        ThoiGianGui: { [db.Sequelize.Op.gte]: today }
      }
    });

    // Lấy phân loại cảnh báo (trong ngày) - Cần phải có trước khi dùng
    const warningDistribution = await db.CanhBao.findAll({
      attributes: [
        [db.sequelize.col('PhanLoaiCanhBao.PhanLoai'), 'name'],
        [db.sequelize.fn('COUNT', db.sequelize.col('CanhBao.MaCB')), 'count']
      ],
      where: whereWarningToday,
      include: [{
        model: db.PhanLoaiCanhBao,
        attributes: []
      }],
      group: [db.sequelize.col('PhanLoaiCanhBao.PhanLoai')]
    });

    const totalWarningsToday = warningDistribution.reduce((sum, item) => sum + item.dataValues.count, 0);

    let technicalWarnings = 0;
    let userWarnings = 0;

    warningDistribution.forEach(item => {
      if (item.dataValues.name === 'Kỹ thuật') {
        technicalWarnings = item.dataValues.count;
      } else if (item.dataValues.name === 'Người dùng') {
        userWarnings = item.dataValues.count;
      }
    });

    const otherWarnings = totalWarningsToday - technicalWarnings - userWarnings;

    // Tính Tỷ lệ Cảnh báo
    const technicalRatio = totalWarningsToday > 0 ? (technicalWarnings / totalWarningsToday * 100).toFixed(1) : 0;
    const userRatio = totalWarningsToday > 0 ? (userWarnings / totalWarningsToday * 100).toFixed(1) : 0;
    const otherRatio = totalWarningsToday > 0 ? (otherWarnings / totalWarningsToday * 100).toFixed(1) : 0;


    // Lấy phân phối trạng thái phiên chat (trong ngày)
    const chatStatusData = await db.PhienChat.findAll({
      attributes: [
        'TrangThai',
        [db.sequelize.fn('COUNT', db.sequelize.col('MaPhienChat')), 'count']
      ],
      where: whereToday,
      group: ['TrangThai']
    });

    let finishedChats = 0;
    let pendingChats = 0;
    let activeChats = 0;

    chatStatusData.forEach(item => {
      if (item.dataValues.TrangThai === 'DaKetThuc') {
        finishedChats = item.dataValues.count;
      } else if (item.dataValues.TrangThai === 'DangCho') {
        pendingChats = item.dataValues.count;
      } else if (item.dataValues.TrangThai === 'DangHoatDong') {
        activeChats = item.dataValues.count;
      }
    });

    // Tính Tỷ lệ Chat Status
    const finishedRatio = totalChatsToday > 0 ? (finishedChats / totalChatsToday * 100).toFixed(1) : 0;
    const pendingRatio = totalChatsToday > 0 ? (pendingChats / totalChatsToday * 100).toFixed(1) : 0;
    const activeRatio = totalChatsToday > 0 ? (activeChats / totalChatsToday * 100).toFixed(1) : 0;

    // Xác định ngày báo cáo cuối cùng
    const reportDate = new Date().toLocaleDateString('vi-VN');

    // =======================================================
    // 2. TẠO WORKBOOK VÀ ĐỊNH DẠNG EXCEL
    // =======================================================
    const workbook = new exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Báo Cáo Tổng Hợp');

    // 3. Định dạng Header
    worksheet.mergeCells('A1:F1');
    worksheet.getCell('A1').value = 'BẢNG BÁO CÁO TỔNG HỢP HOẠT ĐỘNG TRONG NGÀY';
    worksheet.getCell('A1').font = { bold: true, size: 14, name: 'Times New Roman' };
    worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.mergeCells('A2:F2');
    worksheet.getCell('A2').value = 'Tên hệ thống: Phản hồi hội thoại & cảnh báo aiSell';
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A3:F3');
    worksheet.getCell('A3').value = `Ngày báo cáo: ${reportDate}`;
    worksheet.getCell('A3').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A4:F4');

    worksheet.getCell('A4').value = 'Người lập báo cáo: ........................';
    worksheet.getCell('A4').alignment = { horizontal: 'center' };

    // ... (Phần 4, 5, 6, 7 TẠO BẢNG DỮ LIỆU giữ nguyên như đã sửa ở câu trả lời trước)

    // 4. Định nghĩa cột và tiêu đề bảng (Áp dụng cho HÀNG 6)
    const headers = [
      'STT', 'Nhóm chỉ tiêu', 'Nội dung thống kê', 'Số lượng', 'Tỷ lệ (%)', 'Ghi chú'
    ];

    const headerRow = worksheet.getRow(6);
    headers.forEach((headerText, index) => {
      const cell = headerRow.getCell(index + 1);
      cell.value = headerText;
      cell.font = { bold: true, size: 10, name: 'Times New Roman' };
      cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
    });
    headerRow.height = 30;

    worksheet.columns = [
      { key: 'stt', width: 6 },
      { key: 'nhom', width: 20 },
      { key: 'noidung', width: 35 },
      { key: 'soluong', width: 15 },
      { key: 'tyle', width: 15 },
      { key: 'ghichu', width: 40 }
    ];

    // 5. Thêm dữ liệu (tương ứng với cấu trúc ảnh)
    let data = [];

    // --- Tổng Quan (STT 1) ---
    data.push({ stt: 1, nhom: 'Tổng quan', noidung: 'Tổng số cảnh báo trong ngày', soluong: totalWarningsToday, tyle: '100', ghichu: 'Bao gồm tất cả loại cảnh báo' });
    data.push({ stt: 1, nhom: 'Tổng quan', noidung: 'Tổng số hội thoại xử lý', soluong: totalChatsToday, tyle: '-', ghichu: 'Hội thoại đã được hệ thống ghi nhận' });
    data.push({ stt: 1, nhom: 'Tổng quan', noidung: 'Tổng số khách hàng', soluong: newCustomersToday, tyle: '-', ghichu: 'Khách hàng phát sinh trong ngày' });
    data.push({ stt: 1, nhom: 'Tổng quan', noidung: 'Tổng số tin nhắn', soluong: messagesToday, tyle: '-', ghichu: 'Tin nhắn đến và đi (trong ngày)' });

    // --- Cảnh báo (STT 2) ---
    data.push({ stt: 2, nhom: 'Cảnh báo', noidung: 'Cảnh báo kỹ thuật', soluong: technicalWarnings, tyle: technicalRatio, ghichu: 'Lỗi hệ thống, tích hợp' });
    data.push({ stt: 2, nhom: 'Cảnh báo', noidung: 'Cảnh báo người dùng', soluong: userWarnings, tyle: userRatio, ghichu: 'Phản hồi, yêu cầu từ khách' });

    // Nếu có cảnh báo khác thì thêm vào
    if (otherWarnings > 0) {
      data.push({ stt: 2, nhom: 'Cảnh báo', noidung: 'Cảnh báo khác', soluong: otherWarnings, tyle: otherRatio, ghichu: 'Các loại cảnh báo còn lại' });
    }

    // --- Phiên chat (STT 3) ---
    data.push({ stt: 3, nhom: 'Phiên chat', noidung: 'Phiên chat đã kết thúc', soluong: finishedChats, tyle: finishedRatio, ghichu: 'Hoàn tất xử lý' });
    data.push({ stt: 3, nhom: 'Phiên chat', noidung: 'Phiên chat đang chờ', soluong: pendingChats, tyle: pendingRatio, ghichu: 'Chưa có phản hồi' });
    data.push({ stt: 3, nhom: 'Phiên chat', noidung: 'Phiên chat đang hoạt động', soluong: activeChats, tyle: activeRatio, ghichu: 'Đang tương tác' });

    // Thêm các dòng dữ liệu, bắt đầu từ Hàng 7
    data.forEach(item => {
      worksheet.addRow(item);
    });

    // 6. Định dạng bảng (Merge Cells và Border)

    // --- Tổng Quan (STT 1) ---
    worksheet.mergeCells(`A7:A10`); // STT 1
    worksheet.mergeCells(`B7:B10`); // Nhóm 1

    const rowCountWarning = (otherWarnings > 0 ? 3 : 2);
    const startRowWarning = 11;
    const endRowWarning = startRowWarning + rowCountWarning - 1;
    worksheet.mergeCells(`A${startRowWarning}:A${endRowWarning}`); // STT 2
    worksheet.mergeCells(`B${startRowWarning}:B${endRowWarning}`); // Nhóm 2

    const startRowChat = endRowWarning + 1;
    const rowCountChat = 3;
    const endRowChat = startRowChat + rowCountChat - 1;
    worksheet.mergeCells(`A${startRowChat}:A${endRowChat}`); // STT 3
    worksheet.mergeCells(`B${startRowChat}:B${endRowChat}`); // Nhóm 3

    // Đặt Alignment và Border cho toàn bộ bảng dữ liệu
    for (let i = 7; i <= endRowChat; i++) {
      const row = worksheet.getRow(i);
      row.eachCell(cell => {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.font = { name: 'Times New Roman', size: 10 };

        if (cell.col === 1 || cell.col === 4 || cell.col === 5) {
          cell.alignment.horizontal = 'center';
        }
      });
      row.height = 20;
    }

    // 7. Thiết lập HTTP Header và gửi file
    const fileName = `BaoCaoTongHopHoatDong_${new Date().getTime()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${fileName}`);

    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error('Lỗi khi xuất báo cáo:', error);
    res.status(500).json({ error: 'Lỗi khi xuất báo cáo Excel' });
  }
});
export default router;