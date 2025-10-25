const NhatKyXuLy = (sequelize, DataTypes) => {
  const NhatKyXuLy = sequelize.define('NhatKyXuLy', {
    MaNhatKy: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    MaNV: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    MaPhienChat: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    HanhDong: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    GhiChu: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ThoiGian: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'NhatKyXuLy',
    timestamps: false, // Assuming no createdAt/updatedAt columns based on SQL
  });

  return NhatKyXuLy;
};

export default NhatKyXuLy;