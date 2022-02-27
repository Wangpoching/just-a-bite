/* eslint-disable */
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Order extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Order.belongsTo(models.User, {
        foreignKey: 'userId',
        onDelete: 'CASCADE'
      })
      Order.hasMany(models.OrderDetail, {
        foreignKey: 'serial'
      })
    }
  };
  Order.init({
    serial: DataTypes.STRING,
    userId: DataTypes.INTEGER,
    amount: DataTypes.INTEGER,
    status: DataTypes.INTEGER,
    name: DataTypes.STRING,
    phone: DataTypes.STRING,
    mail: DataTypes.STRING,
    address: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Order',
  });
  return Order;
};