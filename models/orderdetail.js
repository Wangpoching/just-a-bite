/* eslint-disable */
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class OrderDetail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      OrderDetail.belongsTo(models.Order, {
        foreignKey: 'serial',
        onDelete: 'CASCADE'
      })
      OrderDetail.belongsTo(models.Menu, {
        foreignKey: 'dishId',
        onDelete: 'CASCADE'
      })
    }
  };
  OrderDetail.init({
    serial: DataTypes.STRING,
    dishId: DataTypes.INTEGER,
    amount: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'OrderDetail',
  });
  return OrderDetail;
};