module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if column exists first to be safe
    const tableInfo = await queryInterface.describeTable('users');
    if (!tableInfo.status) {
      await queryInterface.addColumn('users', 'status', {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'active'
      });
      await queryInterface.addIndex('users', ['status']);
    }
  },

  down: async (queryInterface) => {
    const tableInfo = await queryInterface.describeTable('users');
    if (tableInfo.status) {
      await queryInterface.removeColumn('users', 'status');
    }
  }
};
