import express from 'express';
import db from '../models/index.js'; // Import the db instance

const router = express.Router();

router.get('/access-logs', async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', startDate, endDate } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where.HanhDong = { [db.Sequelize.Op.like]: `%${search}%` };
      // Could also search in GhiChu or NhanVien.HoTen
    }
    if (startDate) {
      where.ThoiGian = { ...where.ThoiGian, [db.Sequelize.Op.gte]: new Date(startDate) };
    }
    if (endDate) {
      where.ThoiGian = { ...where.ThoiGian, [db.Sequelize.Op.lte]: new Date(endDate) };
    }

    const { count, rows } = await db.NhatKyXuLy.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['ThoiGian', 'DESC']],
      include: [{
        model: db.NhanVien,
        as: 'Performer', // Alias for the association
        attributes: ['HoTen'],
      }],
    });

    res.json({
      totalItems: count,
      totalPages: Math.ceil(count / limit),
      currentPage: parseInt(page),
      data: rows,
    });
  } catch (error) {
    console.error('Error fetching access logs:', error);
    res.status(500).json({ error: 'Failed to fetch access logs' });
  }
});

router.put('/access-logs/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { MaNV, MaPhienChat, HanhDong, GhiChu } = req.body; // Only allow updating these fields

    const [updatedRows] = await db.NhatKyXuLy.update({
      MaNV,
      MaPhienChat,
      HanhDong,
      GhiChu,
    }, {
      where: { MaNhatKy: id },
    });

    if (updatedRows > 0) {
      const updatedLog = await db.NhatKyXuLy.findByPk(id);
      res.json(updatedLog);
    } else {
      res.status(404).json({ error: 'Access log not found' });
    }
  } catch (error) {
    console.error('Error updating access log:', error);
    res.status(500).json({ error: 'Failed to update access log' });
  }
});

router.delete('/access-logs/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const deletedRows = await db.NhatKyXuLy.destroy({
      where: { MaNhatKy: id },
    });

    if (deletedRows > 0) {
      res.status(204).send(); // No content
    } else {
      res.status(404).json({ error: 'Access log not found' });
    }
  } catch (error) {
    console.error('Error deleting access log:', error);
    res.status(500).json({ error: 'Failed to delete access log' });
  }
});

export default router;