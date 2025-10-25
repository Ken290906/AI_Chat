const KhachHang = (sequelize, DataTypes) => {
  const KhachHang = sequelize.define('KhachHang', {
    MaKH: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    HoTen: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    Email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      unique: true,
    },
    SoDienThoai: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    NgayTao: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'KhachHang',
    timestamps: false, // Assuming no createdAt/updatedAt columns based on SQL
  });

  return KhachHang;
};

export default KhachHang;