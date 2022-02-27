/* eslint-disable */
'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Menu extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Menu.hasMany(models.CartDetail, {
        foreignKey: 'dishId',
      })
      Menu.hasMany(models.OrderDetail, {
        foreignKey: 'dishId',
      })
    }
  };
  Menu.init({
    name: DataTypes.STRING,
    price: DataTypes.INTEGER,
    amount: DataTypes.INTEGER,
    sales: DataTypes.INTEGER,
    imageUrl: DataTypes.STRING,
    deleteHash: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Menu',
  });
  return Menu;
};