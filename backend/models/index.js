import { Sequelize, DataTypes } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Import all models
import PhanLoaiCanhBaoModel from './phanloaicanhbao.js';
import CanhBaoModel from './canhbao.js';
import KhachHangModel from './khachhang.js';
import NhanVienModel from './nhanvien.js';
import PhienChatModel from './phienchat.js';
import NhatKyXuLyModel from './nhatkyxuly.js';
import TinNhanModel from './tinnhan.js';
import SoThichModel from './sothich.js';
import TomTatPhienChatModel from './tomtatphienchat.js';
import ThongBaoModel from './thongbao.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const env = process.env.NODE_ENV || 'development';
const configPath = path.resolve(__dirname, '../config/config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))[env];

const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  logging: false, // Set to true to see SQL queries in console
});

const db = {};

// Initialize models
db.PhanLoaiCanhBao = PhanLoaiCanhBaoModel(sequelize, DataTypes);
db.CanhBao = CanhBaoModel(sequelize, DataTypes);
db.KhachHang = KhachHangModel(sequelize, DataTypes);
db.NhanVien = NhanVienModel(sequelize, DataTypes);
db.PhienChat = PhienChatModel(sequelize, DataTypes);
db.NhatKyXuLy = NhatKyXuLyModel(sequelize, DataTypes);
db.TinNhan = TinNhanModel(sequelize, DataTypes);
db.SoThich = SoThichModel(sequelize, DataTypes);
db.TomTatPhienChat = TomTatPhienChatModel(sequelize, DataTypes);
db.ThongBao = ThongBaoModel(sequelize, DataTypes);

// Apply associations
// PhanLoaiCanhBao and CanhBao
db.PhanLoaiCanhBao.hasMany(db.CanhBao, { foreignKey: 'MaPhanLoai' });
db.CanhBao.belongsTo(db.PhanLoaiCanhBao, { foreignKey: 'MaPhanLoai' });

// KhachHang and PhienChat
db.KhachHang.hasMany(db.PhienChat, { foreignKey: 'MaKH' });
db.PhienChat.belongsTo(db.KhachHang, { foreignKey: 'MaKH' });

// NhanVien and PhienChat
db.NhanVien.hasMany(db.PhienChat, { foreignKey: 'MaNV' });
db.PhienChat.belongsTo(db.NhanVien, { foreignKey: 'MaNV' });

// NhanVien and NhatKyXuLy
db.NhanVien.hasMany(db.NhatKyXuLy, { foreignKey: 'MaNV', as: 'ProcessingLogs' });
db.NhatKyXuLy.belongsTo(db.NhanVien, { foreignKey: 'MaNV', as: 'Performer' });

// PhienChat and NhatKyXuLy
db.PhienChat.hasMany(db.NhatKyXuLy, { foreignKey: 'MaPhienChat' });
db.NhatKyXuLy.belongsTo(db.PhienChat, { foreignKey: 'MaPhienChat' });

// PhienChat and TinNhan
db.PhienChat.hasMany(db.TinNhan, { foreignKey: 'MaPhienChat' });
db.TinNhan.belongsTo(db.PhienChat, { foreignKey: 'MaPhienChat' });

// PhienChat and CanhBao
db.PhienChat.hasMany(db.CanhBao, { foreignKey: 'MaPhienChat' });
db.CanhBao.belongsTo(db.PhienChat, { foreignKey: 'MaPhienChat' });

// KhachHang and SoThich
db.KhachHang.hasOne(db.SoThich, { 
  foreignKey: 'MaKH',
  as: 'SoThich' 
});
db.SoThich.belongsTo(db.KhachHang, { 
  foreignKey: 'MaKH',
  onDelete: 'CASCADE' 
});

// PhienChat và TomTatPhienChat
db.PhienChat.hasOne(db.TomTatPhienChat, { foreignKey: 'MaPhienChat', as: 'TomTat' });
db.TomTatPhienChat.belongsTo(db.PhienChat, { foreignKey: 'MaPhienChat' });
 
// PhienChat and ThongBao
db.PhienChat.hasMany(db.ThongBao, { foreignKey: 'MaPhienChat' });
db.ThongBao.belongsTo(db.PhienChat, { foreignKey: 'MaPhienChat' });
 


db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.DataTypes = DataTypes;

export default db;