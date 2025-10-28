const CanhBao = (sequelize, DataTypes) => {
  const CanhBao = sequelize.define('CanhBao', {
    MaCB: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    TenCB: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    MaPhanLoai: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    GhiChu: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    ThoiGianTao: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    MaPhienChat: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  }, {
    tableName: 'CanhBao',
    timestamps: false, // Assuming no createdAt/updatedAt columns based on SQL
  });

  return CanhBao;
};

export default CanhBao;