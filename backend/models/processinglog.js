'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class ProcessingLog extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  ProcessingLog.init({
    processingLogCode: DataTypes.STRING,
    resolvedAt: DataTypes.DATE,
    action: DataTypes.STRING,
    notes: DataTypes.TEXT,
    alertCode: DataTypes.STRING,
    employeeCode: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'ProcessingLog',
  });
  return ProcessingLog;
};