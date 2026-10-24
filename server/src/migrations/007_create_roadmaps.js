module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('roadmaps', {
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
      status: {
        type: Sequelize.STRING,
        defaultValue: 'active'
      },
      title: {
        type: Sequelize.STRING,
        defaultValue: 'Preparation Roadmap'
      },
      targetDeadline: {
        type: Sequelize.DATE,
        allowNull: true
      },
      progressPercentage: {
        type: Sequelize.INTEGER,
        defaultValue: 0
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

    await queryInterface.addIndex('roadmaps', ['userId']);
    await queryInterface.addIndex('roadmaps', ['opportunityId']);
    await queryInterface.addIndex('roadmaps', ['status']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('roadmaps');
  }
};
