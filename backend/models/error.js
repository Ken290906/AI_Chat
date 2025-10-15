'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Error extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Error.init({
    errorCode: DataTypes.STRING,
    occurredAt: DataTypes.DATE,
    errorType: DataTypes.STRING,
    description: DataTypes.TEXT,
    sessionCode: DataTypes.STRING  // Thêm trường sessionCode vào đây
  }, {
    sequelize,
    modelName: 'Error',
  });
  return Error;
};