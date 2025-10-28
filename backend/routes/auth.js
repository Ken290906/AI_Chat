import express from 'express';
import db from '../models/index.js';

const router = express.Router();

// Route để lấy thông tin khách hàng theo ID
router.get('/client/:clientId', async (req, res) => {
  try {
    console.log(`🔹 Getting client info: ${req.params.clientId}`);
    
    const client = await db.KhachHang.findByPk(req.params.clientId, {
      attributes: ['MaKH', 'HoTen', 'Email', 'SoDienThoai']
    });
    
    if (!client) {
      console.log(`❌ Client not found: ${req.params.clientId}`);
      return res.status(404).json({ error: 'Khách hàng không tồn tại' });
    }
    
    console.log(`✅ Client found: ${client.HoTen}`);
    res.json(client);
  } catch (error) {
    console.error('❌ Lỗi lấy thông tin khách hàng:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Route để lấy thông tin nhân viên theo ID
router.get('/employee/:employeeId', async (req, res) => {
  try {
    console.log(`🔹 Getting employee info: ${req.params.employeeId}`);
    
    const employee = await db.NhanVien.findByPk(req.params.employeeId, {
      attributes: ['MaNV', 'HoTen', 'Email']
    });
    
    if (!employee) {
      console.log(`❌ Employee not found: ${req.params.employeeId}`);
      return res.status(404).json({ error: 'Nhân viên không tồn tại' });
    }
    
    console.log(`✅ Employee found: ${employee.HoTen}`);
    res.json(employee);
  } catch (error) {
    console.error('❌ Lỗi lấy thông tin nhân viên:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

// Route để xác thực nhân viên (fake login)
router.post('/employee/login', async (req, res) => {
  try {
    const { employeeId, password } = req.body;
    
    console.log(`🔹 Employee login attempt: ${employeeId}`);
    
    const employee = await db.NhanVien.findByPk(employeeId);
    
    if (!employee || employee.MatKhau !== password) {
      console.log(`❌ Login failed for employee: ${employeeId}`);
      return res.status(401).json({ error: 'Sai ID nhân viên hoặc mật khẩu' });
    }
    
    console.log(`✅ Login successful: ${employee.HoTen}`);
    
    res.json({
      success: true,
      employee: {
        MaNV: employee.MaNV,
        HoTen: employee.HoTen,
        Email: employee.Email
      }
    });
  } catch (error) {
    console.error('❌ Lỗi đăng nhập nhân viên:', error);
    res.status(500).json({ error: 'Lỗi server' });
  }
});

export default router;