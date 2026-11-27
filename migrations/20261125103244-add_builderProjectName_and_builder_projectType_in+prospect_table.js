'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('prospects', 'builderProjectName', {
      type: Sequelize.STRING(200),
      allowNull: true,
      after:"status",
    });
    await queryInterface.addColumn('prospects', 'builderProjectType', {
      type: Sequelize.STRING(200),
      allowNull: true,
      after:"builderProjectName",
    });

    await queryInterface.changeColumn('prospects', 'status', {
      type: Sequelize.ENUM(
        'PROSPECT_CREATED',
        'DRAWINGS_RECEIVED',
        'DRAWINGS_UPLODED',
        'ESTIMATION_IN_PROGRESS',
        'ESTIMATION_COMPLETED',
        'BOQ_PREPARED',
        'BOQ_SHARED',
        'FEEDBACK_RECEIVED',
        'BOQ_APPROVED',
        'CONVERTED',
        'ON_HOLD',
        'STOPPED'
      ),
      allowNull: false,
      defaultValue: 'PROSPECT_CREATED',
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('prospects', 'builderProjectName');
    await queryInterface.removeColumn('prospects', 'builderProjectType');
    await queryInterface.changeColumn('prospects', 'status', {
      type: Sequelize.ENUM(
        'PROSPECT_CREATED',
        'DRAWINGS_RECEIVED',
        'DRAWINGS_UPLODED',
        'ESTIMATION_IN_PROGRESS',
        'ESTIMATION_COMPLETED',
        'BOQ_PREPARED',
        'BOQ_SHARED',
        'FEEDBACK_RECEIVED',
        'BOQ_APPROVED',
        'CONVERTED'
      ),
      allowNull: false,
      defaultValue: 'PROSPECT_CREATED',
    });
  }
};
