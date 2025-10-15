'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class AlertCategory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  AlertCategory.init({
    categoryCode: DataTypes.STRING,
    categoryName: DataTypes.STRING,
    description: DataTypes.TEXT,
    priority: DataTypes.INTEGER,
    alertCode: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'AlertCategory',
  });
  return AlertCategory;
};