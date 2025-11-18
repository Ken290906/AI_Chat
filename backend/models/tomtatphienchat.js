const TomTatPhienChat = (sequelize, DataTypes) => {
  const TomTatPhienChat = sequelize.define('TomTatPhienChat', {
    MaPhienChat: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      allowNull: false,
      references: {
        model: 'PhienChat',
        key: 'MaPhienChat'
      }
    },
    NoiDungTomTat: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    KetQuaTuAI: {
      type: DataTypes.STRING(255),
      allowNull: true, // AI sẽ tự đánh giá: Thành công/Thất bại/Đang chờ
    },
    ThoiGianTao: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'tomtatphienchat',
    timestamps: false,
  });

  return TomTatPhienChat;
};

export default TomTatPhienChat;