const PhanLoaiCanhBao = (sequelize, DataTypes) => {
  const PhanLoaiCanhBao = sequelize.define('PhanLoaiCanhBao', {
    MaPhanLoai: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    PhanLoai: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    MoTa: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    MucDoUuTien: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 3,
    },
  }, {
    tableName: 'PhanLoaiCanhBao',
    timestamps: false, // Assuming no createdAt/updatedAt columns based on SQL
  });

  return PhanLoaiCanhBao;
};

export default PhanLoaiCanhBao;