module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('saved_opportunities', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
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
      reminderEnabled: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      savedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'saved'
      },
      notes: {
        type: Sequelize.TEXT,
        defaultValue: ''
      },
      reminderDate: {
        type: Sequelize.DATE,
        allowNull: true
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

    await queryInterface.addIndex('saved_opportunities', ['userId', 'opportunityId'], {
      unique: true,
      name: 'unique_user_opportunity_saved_idx'
    });
    await queryInterface.addIndex('saved_opportunities', ['status']);
    await queryInterface.addIndex('saved_opportunities', ['reminderEnabled']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('saved_opportunities');
  }
};
