/* eslint-disable */
'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.removeColumn('Prizes', 'probability')
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn(
      'Prizes',
      'probability',
      {
        type: Sequelize.INTEGER,
        allowNull: true,
      }
    )
  }
};
