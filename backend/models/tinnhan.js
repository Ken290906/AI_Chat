const TinNhan = (sequelize, DataTypes) => {
  const TinNhan = sequelize.define('TinNhan', {
    MaTinNhan: {
      type: DataTypes.BIGINT,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    MaPhienChat: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    NguoiGui: {
      type: DataTypes.ENUM('KhachHang', 'NhanVien', 'HeThong'),
      allowNull: false,
    },
    NoiDung: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    ThoiGianGui: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'TinNhan',
    timestamps: false, // Assuming no createdAt/updatedAt columns based on SQL
  });

  return TinNhan;
};

export default TinNhan;