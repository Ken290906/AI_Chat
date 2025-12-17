import express from 'express';
import db from '../models/index.js'; // Import instance cơ sở dữ liệu

const router = express.Router();

// Route GET để lấy danh sách tóm tắt phiên chat
// API: /api/chat-summaries
router.get('/chat-summaries', async (req, res) => {
  try {
    // Lấy các tham số từ query string với giá trị mặc định
    const { page = 1, limit = 10, search = '', startDate, endDate } = req.query;
    const offset = (page - 1) * limit; // Tính vị trí bắt đầu
    const Op = db.Sequelize.Op;

    // Đối tượng where để lọc dữ liệu
    const where = {};
    
    if (search) {
      // Tìm kiếm trong nội dung tóm tắt hoặc kết quả AI
      where[db.Sequelize.Op.or] = [
        { NoiDungTomTat: { [db.Sequelize.Op.like]: `%${search}%` } },
        { KetQuaTuAI: { [db.Sequelize.Op.like]: `%${search}%` } }
      ];
    }

    if (startDate || endDate) {
  // Sử dụng mảng để chứa các điều kiện lọc theo ngày
  const dateConditions = [];
  
  if (startDate) {
    dateConditions.push(
      db.sequelize.where(db.sequelize.fn('DATE', db.sequelize.col('ThoiGianTao')), '>=', startDate)
    );
  }
  
  if (endDate) {
    dateConditions.push(
      db.sequelize.where(db.sequelize.fn('DATE', db.sequelize.col('ThoiGianTao')), '<=', endDate)
    );
  }

  // Kết hợp điều kiện ngày vào đối tượng where chính
  if (where[Op.or]) {
    // Nếu đã có điều kiện search (Op.or), dùng Op.and để kết hợp cả hai
    where[Op.and] = dateConditions;
  } else {
    // Nếu không có search, gán trực tiếp mảng điều kiện vào Op.and
    where[Op.and] = dateConditions;
  }
}

    // Truy vấn cơ sở dữ liệu
    const { count, rows } = await db.TomTatPhienChat.findAndCountAll({
      where, // Điều kiện lọc
      limit: parseInt(limit), // Số bản ghi trên mỗi trang
      offset: parseInt(offset), // Vị trí bắt đầu
      order: [['ThoiGianTao', 'DESC']], // Sắp xếp theo thời gian giảm dần
      
      // Nếu bạn muốn lấy thêm thông tin Phiên Chat (VD: Tên khách hàng), 
      // hãy bỏ comment đoạn include dưới đây (yêu cầu đã thiết lập quan hệ trong model/index.js)
      /*
      include: [{
        model: db.PhienChat,
        as: 'PhienChat',
        attributes: ['MaKH', 'TrangThai'], 
      }],
      */
    });

    // Trả về kết quả dưới dạng JSON chuẩn
    res.json({
      totalItems: count, // Tổng số bản ghi
      totalPages: Math.ceil(count / limit), // Tổng số trang
      currentPage: parseInt(page), // Trang hiện tại
      data: rows, // Dữ liệu tóm tắt
    });
  } catch (error) {
    console.error('Lỗi khi lấy danh sách tóm tắt:', error);
    res.status(500).json({ error: 'Không thể lấy dữ liệu tóm tắt' });
  }
});

// Route PUT để cập nhật tóm tắt theo ID (MaPhienChat)
router.put('/chat-summaries/:id', async (req, res) => {
  try {
    const { id } = req.params; // ID ở đây chính là MaPhienChat (theo Model PK)
    const { NoiDungTomTat, KetQuaTuAI } = req.body; // Các trường cho phép sửa

    // Cập nhật bản ghi
    const [updatedRows] = await db.TomTatPhienChat.update({
      NoiDungTomTat,
      KetQuaTuAI,
      // ThoiGianTao thường không nên sửa
    }, {
      where: { MaPhienChat: id },
    });

    if (updatedRows > 0) {
      const updatedItem = await db.TomTatPhienChat.findByPk(id);
      res.json(updatedItem);
    } else {
      res.status(404).json({ error: 'Không tìm thấy bản ghi tóm tắt' });
    }
  } catch (error) {
    console.error('Lỗi khi cập nhật tóm tắt:', error);
    res.status(500).json({ error: 'Không thể cập nhật tóm tắt' });
  }
});

// Route DELETE để xóa tóm tắt theo ID
router.delete('/chat-summaries/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRows = await db.TomTatPhienChat.destroy({
      where: { MaPhienChat: id },
    });

    if (deletedRows > 0) {
      res.status(204).send(); // 204 No Content
    } else {
      res.status(404).json({ error: 'Không tìm thấy bản ghi tóm tắt để xóa' });
    }
  } catch (error) {
    console.error('Lỗi khi xóa tóm tắt:', error);
    res.status(500).json({ error: 'Không thể xóa tóm tắt' });
  }
});

export default router;