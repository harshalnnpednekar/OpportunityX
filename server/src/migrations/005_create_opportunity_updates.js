module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('opportunity_updates', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      opportunityId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'opportunities',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      updateType: {
        type: Sequelize.STRING,
        allowNull: false
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      oldValue: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      newValue: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      detectedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
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

    await queryInterface.addIndex('opportunity_updates', ['opportunityId']);
    await queryInterface.addIndex('opportunity_updates', ['updateType']);
    await queryInterface.addIndex('opportunity_updates', ['detectedAt']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('opportunity_updates');
  }
};
