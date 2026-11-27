
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('prospect_towers', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },

      prospectProjectId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'prospect_projects',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },

      towerName: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },

      occupancy: {
        type: Sequelize.STRING(30),
        allowNull: true,
      },

      status: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },

      heightM: {
        type: Sequelize.DECIMAL(8, 2),
        allowNull: true,
      },

      floors: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },

      basements: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      podiums: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },

      builtUpArea: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
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


    await queryInterface.addIndex('prospect_towers', ['prospectProjectId'], {
      name: 'idx_prospect_towers_project_id',
    });

    await queryInterface.addIndex(
      'prospect_towers',
      ['prospectProjectId', 'towerName'],
      {
        unique: true,
        name: 'unique_prospect_project_tower_name',
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable('prospect_towers');
  },
};
