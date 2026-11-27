
'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {

    await queryInterface.addColumn('prospect_projects', 'entityCode', {
      type: Sequelize.STRING(30),
      allowNull: true,
      after:"prospectId",
    });

    await queryInterface.addColumn('prospect_projects', 'gstin', {
      type: Sequelize.STRING(15),
      allowNull: true,
      after:"projectStatus",
    });

    await queryInterface.addColumn('prospect_projects', 'pan', {
      type: Sequelize.STRING(10),
      allowNull: true,
      after:"gstin",
    });

    await queryInterface.addColumn('prospect_projects', 'city', {
      type: Sequelize.STRING(80),
      allowNull: true,
      after:"projectLocation",
    });

    await queryInterface.addColumn('prospect_projects', 'state', {
      type: Sequelize.STRING(80),
      allowNull: true,
      after:"city",
    });

    await queryInterface.addColumn('prospect_projects', 'pincode', {
      type: Sequelize.STRING(10),
      allowNull: true,
      after:"state",
    });

    await queryInterface.addColumn('prospect_projects', 'contactPerson', {
      type: Sequelize.STRING(100),
      allowNull: true,
      after:"pincode",
    });

    await queryInterface.addColumn('prospect_projects', 'status', {
      type: Sequelize.ENUM('ACTIVE', 'INACTIVE'),
      allowNull: false,
      defaultValue: 'ACTIVE',
      after:"contactPerson",
    });

    // 3. Rename siteAddress to projectDescription
    await queryInterface.renameColumn(
      'prospect_projects',
      'siteAddress',
      'projectDescription'
    );

    // 4. Remove unwanted columns
    await queryInterface.removeColumn('prospect_projects', 'builtUpArea');
    await queryInterface.removeColumn('prospect_projects', 'floors');
    await queryInterface.removeColumn('prospect_projects', 'basements');

    // 5. Add indexes
    await queryInterface.addIndex('prospect_projects', ['prospectId'], {
      name: 'idx_prospect_projects_prospectId',
    });

    await queryInterface.addIndex('prospect_projects', ['gstin'], {
      name: 'idx_prospect_projects_gstin',
    });

    await queryInterface.addIndex(
      'prospect_projects',
      ['prospectId', 'entityCode'],
      {
        unique: true,
        name: 'unique_prospect_entity_code',
      }
    );
  },

  async down(queryInterface, Sequelize) {

    // 1. Remove indexes
    await queryInterface.removeIndex(
      'prospect_projects',
      'idx_prospect_projects_prospectId'
    );

    await queryInterface.removeIndex(
      'prospect_projects',
      'idx_prospect_projects_gstin'
    );

    await queryInterface.removeIndex(
      'prospect_projects',
      'unique_prospect_entity_code'
    );

    // 2. Restore removed columns
    await queryInterface.addColumn('prospect_projects', 'builtUpArea', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
    });

    await queryInterface.addColumn('prospect_projects', 'floors', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('prospect_projects', 'basements', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    // 3. Rename projectDescription back to siteAddress
    await queryInterface.renameColumn(
      'prospect_projects',
      'projectDescription',
      'siteAddress'
    );

    // 4. Remove newly added columns
    await queryInterface.removeColumn('prospect_projects', 'entityCode');
    await queryInterface.removeColumn('prospect_projects', 'gstin');
    await queryInterface.removeColumn('prospect_projects', 'pan');
    await queryInterface.removeColumn('prospect_projects', 'city');
    await queryInterface.removeColumn('prospect_projects', 'state');
    await queryInterface.removeColumn('prospect_projects', 'pincode');
    await queryInterface.removeColumn('prospect_projects', 'contactPerson');
    await queryInterface.removeColumn('prospect_projects', 'status');

  },
};
