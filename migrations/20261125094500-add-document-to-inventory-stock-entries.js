'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('inventry_stock_entries', 'document', {
      type: Sequelize.BLOB('long'),
      allowNull: true,
      after:"remarks",
    });
    await queryInterface.addColumn('inventry_stock_entries', 'documentContentType', {
      type: Sequelize.STRING(100),
      allowNull: true,
      after:"document",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('inventry_stock_entries', 'documentContentType');
    await queryInterface.removeColumn('inventry_stock_entries', 'document');
  },
};
