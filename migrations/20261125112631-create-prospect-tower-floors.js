
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('prospect_tower_floors', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      towerId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'prospect_towers',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },

      floorNo: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },

      floorType: {
        type: Sequelize.ENUM(
          'BASEMENT',
          'PODIUM',
          'GROUND',
          'TYPICAL',
          'REFUGE',
          'TERRACE',
          'SERVICE'
        ),
        allowNull: false,
        defaultValue: 'TYPICAL',
      },

      floorLabel: {
        type: Sequelize.STRING(20),
        allowNull: false,
      },

      units1Rk: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      units1Bhk: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      units2Bhk: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      units3Bhk: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      units4Bhk: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },

      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
      },
    });

 
    await queryInterface.addIndex(
      'prospect_tower_floors',
      ['towerId', 'floorLabel'],
      {
        unique: true,
        name: 'unique_tower_floor_label',
      }
    );

   
    await queryInterface.addIndex(
      'prospect_tower_floors',
      ['towerId', 'floorNo'],
      {
        name: 'idx_tower_floor_number',
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('prospect_tower_floors');
  },
};
