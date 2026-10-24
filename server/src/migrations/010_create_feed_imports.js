module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('feed_imports', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      sourceName: {
        type: Sequelize.STRING,
        allowNull: false
      },
      sourceType: {
        type: Sequelize.STRING,
        allowNull: false
      },
      startedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      finishedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      recordsSeen: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      recordsCreated: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      recordsUpdated: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      duplicatesFound: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      errors: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'success'
      },
      totalProcessed: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      itemsIngested: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      itemsUpdated: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      duplicatesFlagged: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      expiredFlagged: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      invalidSkipped: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      details: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    await queryInterface.addIndex('feed_imports', ['sourceName']);
    await queryInterface.addIndex('feed_imports', ['status']);
    await queryInterface.addIndex('feed_imports', ['startedAt']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('feed_imports');
  }
};
