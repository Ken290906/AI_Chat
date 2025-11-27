const ThongBao = (sequelize, DataTypes) => {
  const ThongBao = sequelize.define('ThongBao', {
    MaThongBao: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    MaPhienChat: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    NoiDung: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    ThoiGianTao: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    TrangThai: {
      type: DataTypes.ENUM('ChuaDoc', 'DaDoc'),
      allowNull: false,
      defaultValue: 'ChuaDoc',
    },
  }, {
    tableName: 'thongbao',
    timestamps: false,
  });

  return ThongBao;
};

export default ThongBao;
