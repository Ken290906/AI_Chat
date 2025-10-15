'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('ProcessingLogs', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      processingLogCode: {
        type: Sequelize.STRING
      },
      resolvedAt: {
        type: Sequelize.DATE
      },
      action: {
        type: Sequelize.STRING
      },
      notes: {
        type: Sequelize.TEXT
      },
      alertCode: {
        type: Sequelize.STRING
      },
      employeeCode: {
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('ProcessingLogs');
  }
};