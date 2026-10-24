module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('opportunities', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      organizer: {
        type: Sequelize.STRING,
        allowNull: false
      },
      organization: {
        type: Sequelize.STRING,
        allowNull: true
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      category: {
        type: Sequelize.STRING,
        defaultValue: 'general'
      },
      eventType: {
        type: Sequelize.STRING,
        allowNull: false
      },
      opportunityType: {
        type: Sequelize.STRING,
        allowNull: true
      },
      theme: {
        type: Sequelize.STRING,
        defaultValue: ''
      },
      startDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      eventStartDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      endDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      eventEndDate: {
        type: Sequelize.DATE,
        allowNull: true
      },
      deadline: {
        type: Sequelize.DATE,
        allowNull: true
      },
      applicationDeadline: {
        type: Sequelize.DATE,
        allowNull: true
      },
      format: {
        type: Sequelize.STRING,
        defaultValue: 'virtual'
      },
      location: {
        type: Sequelize.STRING,
        defaultValue: 'Online'
      },
      costAmount: {
        type: Sequelize.DECIMAL(10, 2),
        defaultValue: 0.00
      },
      currency: {
        type: Sequelize.STRING,
        defaultValue: 'USD'
      },
      teamMin: {
        type: Sequelize.INTEGER,
        defaultValue: 1
      },
      teamMax: {
        type: Sequelize.INTEGER,
        defaultValue: 4
      },
      eligibilityText: {
        type: Sequelize.TEXT,
        defaultValue: ''
      },
      requiredSkills: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      beginnerFriendly: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      sustainabilityFocused: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      sourceName: {
        type: Sequelize.STRING,
        defaultValue: 'manual'
      },
      sourceFeed: {
        type: Sequelize.STRING,
        allowNull: true
      },
      sourceUrl: {
        type: Sequelize.STRING,
        defaultValue: ''
      },
      applicationUrl: {
        type: Sequelize.STRING,
        allowNull: false
      },
      sourceRecordId: {
        type: Sequelize.STRING,
        defaultValue: ''
      },
      externalId: {
        type: Sequelize.STRING,
        allowNull: true
      },
      lastVerifiedAt: {
        type: Sequelize.DATE,
        allowNull: true
      },
      status: {
        type: Sequelize.STRING,
        defaultValue: 'active'
      },
      missingFields: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      contradictionFlags: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      dataQualityFlags: {
        type: Sequelize.JSONB,
        defaultValue: []
      },
      normalizedFingerprint: {
        type: Sequelize.STRING,
        allowNull: false
      },
      fingerprint: {
        type: Sequelize.STRING,
        allowNull: true
      },
      trustScore: {
        type: Sequelize.INTEGER,
        defaultValue: 100
      },
      slug: {
        type: Sequelize.STRING,
        allowNull: true
      },
      costType: {
        type: Sequelize.STRING,
        defaultValue: 'free'
      },
      stipendAmount: {
        type: Sequelize.STRING,
        defaultValue: ''
      },
      prizePool: {
        type: Sequelize.STRING,
        defaultValue: ''
      },
      experienceLevel: {
        type: Sequelize.STRING,
        defaultValue: 'all'
      },
      eligibleEducationLevels: {
        type: Sequelize.JSONB,
        defaultValue: ['all']
      },
      eligibleCountries: {
        type: Sequelize.JSONB,
        defaultValue: ['Global']
      },
      minAge: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      maxAge: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      sourceFormat: {
        type: Sequelize.STRING,
        defaultValue: 'json'
      },
      isDemo: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      demoDisclaimer: {
        type: Sequelize.STRING,
        defaultValue: 'DEMO LISTING: Curated demonstration entry for architectural modeling. Not a live-verified registration portal.'
      },
      isDuplicate: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      duplicateOfId: {
        type: Sequelize.UUID,
        allowNull: true
      },
      viewCount: {
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

    await queryInterface.addIndex('opportunities', ['normalizedFingerprint']);
    await queryInterface.addIndex('opportunities', ['eventType']);
    await queryInterface.addIndex('opportunities', ['format']);
    await queryInterface.addIndex('opportunities', ['deadline']);
    await queryInterface.addIndex('opportunities', ['status']);
    await queryInterface.addIndex('opportunities', ['category']);
    await queryInterface.addIndex('opportunities', ['trustScore']);
  },

  down: async (queryInterface) => {
    await queryInterface.dropTable('opportunities');
  }
};
