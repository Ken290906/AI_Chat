const SoThich = (sequelize, DataTypes) => {
  // Sửa tên Model thành 'SoThich' cho đồng bộ
  const SoThich = sequelize.define('SoThich', { 
    MaKH: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'KhachHang', // Tên Model KhachHang
        key: 'MaKH'
      }
    },
    GhiChu: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    UpdatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'sothich', // Tên bảng từ ERD
    timestamps: true,
    createdAt: false, 
    updatedAt: 'UpdatedAt' 
  });

  return SoThich; // Trả về Model 'SoThich'
};

export default SoThich;