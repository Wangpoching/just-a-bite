/* eslint-disable */
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'Users',
      'identity',
      {
        type: Sequelize.INTEGER,
        allowNull: true,
      }
    )
  },    

  down: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Prizes', 'identity')
  }
};
