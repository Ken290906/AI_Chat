const PhienChat = (sequelize, DataTypes) => {
  const PhienChat = sequelize.define('PhienChat', {
    MaPhienChat: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    MaKH: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    MaNV: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    ThoiGianBatDau: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    ThoiGianKetThuc: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    TrangThai: {
      type: DataTypes.ENUM('DangCho', 'DangHoatDong', 'DaKetThuc'),
      allowNull: true,
      defaultValue: 'DangCho',
    },
  }, {
    tableName: 'PhienChat',
    timestamps: false, // Assuming no createdAt/updatedAt columns based on SQL
  });

  return PhienChat;
};

export default PhienChat;