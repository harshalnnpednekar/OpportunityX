module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('match_requests', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      requesterId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      recipientId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      receiverId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      opportunityId: {
        type: Sequelize.UUID,
        allowNull: true,
        references: {
          model: 'opportunities',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'pending'
      },
      message: {
        type: Sequelize.TEXT,
        defaultValue: ''
      },
      contactPreference: {
        type: Sequelize.STRING,
        defaultValue: 'email'
      },
      contactDetail: {
        type: Sequelize.STRING,
        defaultValue: ''
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

    await queryInterface.addIndex('match_requests', ['requesterId']);
    await queryInterface.addIndex('match_requests', ['recipientId']);
    await queryInterface.addIndex('match_requests', ['opportunityId']);
    await queryInterface.addIndex('match_requests', ['status']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('match_requests');
  }
};
