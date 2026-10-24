const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Opportunity = sequelize.define('Opportunity', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  externalId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fingerprint: {
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  slug: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  organization: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  opportunityType: {
    type: DataTypes.STRING, // 'hackathon', 'competition', 'fellowship', 'workshop', 'research'
    allowNull: false
  },
  format: {
    type: DataTypes.STRING, // 'virtual', 'in_person', 'hybrid'
    defaultValue: 'virtual'
  },
  location: {
    type: DataTypes.STRING,
    defaultValue: 'Online'
  },
  costType: {
    type: DataTypes.STRING, // 'free', 'stipend_provided', 'paid_entry'
    defaultValue: 'free'
  },
  stipendAmount: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  prizePool: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  experienceLevel: {
    type: DataTypes.STRING, // 'beginner', 'intermediate', 'advanced', 'all'
    defaultValue: 'all'
  },
  requiredSkills: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  eligibleEducationLevels: {
    type: DataTypes.JSONB,
    defaultValue: ['all']
  },
  eligibleCountries: {
    type: DataTypes.JSONB,
    defaultValue: ['Global']
  },
  minAge: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  maxAge: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  applicationDeadline: {
    type: DataTypes.DATE,
    allowNull: true
  },
  eventStartDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  eventEndDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  applicationUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sourceFeed: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sourceFormat: {
    type: DataTypes.STRING, // 'json', 'xml'
    defaultValue: 'json'
  },
  isDemo: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  demoDisclaimer: {
    type: DataTypes.STRING,
    defaultValue: 'DEMO LISTING: Curated demonstration entry for architectural modeling. Not a live-verified registration portal.'
  },
  dataQualityFlags: {
    type: DataTypes.JSONB,
    defaultValue: [] // e.g. ['missing_prerequisites', 'ambiguous_deadline']
  },
  isDuplicate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  duplicateOfId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING, // 'active', 'expired', 'flagged'
    defaultValue: 'active'
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'opportunities',
  timestamps: true,
  indexes: [
    { fields: ['fingerprint'] },
    { fields: ['opportunityType'] },
    { fields: ['format'] },
    { fields: ['applicationDeadline'] },
    { fields: ['status'] }
  ]
});

module.exports = Opportunity;
