const NhanVien = (sequelize, DataTypes) => {
  const NhanVien = sequelize.define('NhanVien', {
    MaNV: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    HoTen: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    Email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    MatKhau: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    NgayTao: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'NhanVien',
    timestamps: false, // Assuming no createdAt/updatedAt columns based on SQL
  });

  return NhanVien;
};

export default NhanVien;