module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('student_profiles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      skills: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      interests: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      budgetMax: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      availability: {
        type: Sequelize.STRING,
        defaultValue: 'flexible'
      },
      preferredFormat: {
        type: Sequelize.STRING,
        defaultValue: 'all'
      },
      formatPreference: {
        type: Sequelize.STRING,
        defaultValue: 'all'
      },
      preferredLocation: {
        type: Sequelize.STRING,
        defaultValue: 'Global'
      },
      experienceLevel: {
        type: Sequelize.STRING,
        defaultValue: 'beginner'
      },
      peerMatchingConsent: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      isPublicForMatching: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      fullName: {
        type: Sequelize.STRING,
        defaultValue: ''
      },
      bio: {
        type: Sequelize.TEXT,
        defaultValue: ''
      },
      educationLevel: {
        type: Sequelize.STRING,
        defaultValue: 'undergraduate'
      },
      university: {
        type: Sequelize.STRING,
        defaultValue: ''
      },
      major: {
        type: Sequelize.STRING,
        defaultValue: ''
      },
      graduationYear: {
        type: Sequelize.INTEGER,
        defaultValue: 2027
      },
      country: {
        type: Sequelize.STRING,
        defaultValue: 'Global'
      },
      matchingBio: {
        type: Sequelize.TEXT,
        defaultValue: ''
      },
      githubUrl: {
        type: Sequelize.STRING,
        defaultValue: ''
      },
      portfolioUrl: {
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

    await queryInterface.addIndex('student_profiles', ['userId'], { unique: true });
    await queryInterface.addIndex('student_profiles', ['peerMatchingConsent']);
    await queryInterface.addIndex('student_profiles', ['educationLevel']);
    await queryInterface.addIndex('student_profiles', ['preferredFormat']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('student_profiles');
  }
};
