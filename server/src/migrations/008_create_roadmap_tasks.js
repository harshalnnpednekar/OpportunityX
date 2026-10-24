module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('roadmap_tasks', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      roadmapId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'roadmaps',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        defaultValue: ''
      },
      dueDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'pending'
      },
      sortOrder: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      orderIndex: {
        type: Sequelize.INTEGER,
        defaultValue: 0
      },
      phase: {
        type: Sequelize.STRING,
        defaultValue: 'Phase 1'
      },
      isCompleted: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      completedAt: {
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

    await queryInterface.addIndex('roadmap_tasks', ['roadmapId', 'sortOrder']);
    await queryInterface.addIndex('roadmap_tasks', ['status']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('roadmap_tasks');
  }
};
