import express from 'express';
import db from '../models/index.js'; // Import instance cơ sở dữ liệu

const router = express.Router();

// Route GET để lấy danh sách nhật ký truy cập
router.get('/access-logs', async (req, res) => {
  try {
    // Lấy các tham số từ query string với giá trị mặc định
    const { page = 1, limit = 10, search = '', startDate, endDate } = req.query;
    const offset = (page - 1) * limit; // Tính vị trí bắt đầu

    // Đối tượng where để lọc dữ liệu
    const where = {};
    if (search) {
      // Tìm kiếm theo hành động (tìm kiếm gần đúng)
      where.HanhDong = { [db.Sequelize.Op.like]: `%${search}%` };
      // Có thể mở rộng tìm kiếm trong GhiChu hoặc NhanVien.HoTen
    }
    if (startDate) {
      // Lọc từ ngày bắt đầu (lớn hơn hoặc bằng)
      where.ThoiGian = { ...where.ThoiGian, [db.Sequelize.Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      // Lọc đến ngày kết thúc (nhỏ hơn hoặc bằng)
      where.ThoiGian = { ...where.ThoiGian, [db.Sequelize.Op.lte]: new Date(endDate) };
    }

    // Truy vấn cơ sở dữ liệu để lấy dữ liệu và tổng số bản ghi
    const { count, rows } = await db.NhatKyXuLy.findAndCountAll({
      where, // Điều kiện lọc
      limit: parseInt(limit), // Số bản ghi trên mỗi trang
      offset: parseInt(offset), // Vị trí bắt đầu
      order: [['ThoiGian', 'DESC']], // Sắp xếp theo thời gian giảm dần
      include: [{
        model: db.NhanVien,
        as: 'Performer', // Alias cho quan hệ
        attributes: ['HoTen'], // Chỉ lấy trường Họ tên
      }],
    });

    // Trả về kết quả dưới dạng JSON
    res.json({
      totalItems: count, // Tổng số bản ghi
      totalPages: Math.ceil(count / limit), // Tổng số trang
      currentPage: parseInt(page), // Trang hiện tại
      data: rows, // Dữ liệu nhật ký
    });
  } catch (error) {
    console.error('Lỗi khi lấy nhật ký truy cập:', error);
    res.status(500).json({ error: 'Không thể lấy nhật ký truy cập' });
  }
});

// Route PUT để cập nhật nhật ký truy cập theo ID
router.put('/access-logs/:id', async (req, res) => {
  try {
    const { id } = req.params; // Lấy ID từ URL parameter
    const { MaNV, MaPhienChat, HanhDong, GhiChu } = req.body; // Chỉ cho phép cập nhật các trường này

    // Cập nhật bản ghi trong cơ sở dữ liệu
    const [updatedRows] = await db.NhatKyXuLy.update({
      MaNV,
      MaPhienChat,
      HanhDong,
      GhiChu,
    }, {
      where: { MaNhatKy: id }, // Điều kiện: theo mã nhật ký
    });

    // Kiểm tra xem có bản ghi nào được cập nhật không
    if (updatedRows > 0) {
      // Lấy bản ghi đã được cập nhật
      const updatedLog = await db.NhatKyXuLy.findByPk(id);
      res.json(updatedLog); // Trả về bản ghi đã cập nhật
    } else {
      res.status(404).json({ error: 'Không tìm thấy nhật ký truy cập' });
    }
  } catch (error) {
    console.error('Lỗi khi cập nhật nhật ký truy cập:', error);
    res.status(500).json({ error: 'Không thể cập nhật nhật ký truy cập' });
  }
});

// Route DELETE để xóa nhật ký truy cập theo ID
router.delete('/access-logs/:id', async (req, res) => {
  try {
    const { id } = req.params; // Lấy ID từ URL parameter

    // Xóa bản ghi từ cơ sở dữ liệu
    const deletedRows = await db.NhatKyXuLy.destroy({
      where: { MaNhatKy: id }, // Điều kiện: theo mã nhật ký
    });

    // Kiểm tra xem có bản ghi nào được xóa không
    if (deletedRows > 0) {
      res.status(204).send(); // Trả về mã 204 - No Content
    } else {
      res.status(404).json({ error: 'Không tìm thấy nhật ký truy cập' });
    }
  } catch (error) {
    console.error('Lỗi khi xóa nhật ký truy cập:', error);
    res.status(500).json({ error: 'Không thể xóa nhật ký truy cập' });
  }
});

export default router;