const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Opportunity = sequelize.define('Opportunity', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  organizer: {
    type: DataTypes.STRING,
    allowNull: false
  },
  organization: {
    type: DataTypes.STRING,
    allowNull: true
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    defaultValue: 'general'
  },
  eventType: {
    type: DataTypes.STRING, // 'hackathon', 'competition', 'fellowship', 'workshop', 'research'
    allowNull: false,
    defaultValue: 'hackathon'
  },
  opportunityType: {
    type: DataTypes.STRING,
    allowNull: true
  },
  theme: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  eventStartDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  eventEndDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: true
  },
  applicationDeadline: {
    type: DataTypes.DATE,
    allowNull: true
  },
  format: {
    type: DataTypes.STRING, // 'virtual', 'in_person', 'hybrid'
    defaultValue: 'virtual'
  },
  location: {
    type: DataTypes.STRING,
    defaultValue: 'Online'
  },
  costAmount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  currency: {
    type: DataTypes.STRING,
    defaultValue: 'USD'
  },
  teamMin: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  teamMax: {
    type: DataTypes.INTEGER,
    defaultValue: 4
  },
  eligibilityText: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  requiredSkills: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  beginnerFriendly: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  sustainabilityFocused: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  sourceName: {
    type: DataTypes.STRING,
    defaultValue: 'manual'
  },
  sourceFeed: {
    type: DataTypes.STRING,
    allowNull: true
  },
  sourceUrl: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  applicationUrl: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sourceRecordId: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  externalId: {
    type: DataTypes.STRING,
    allowNull: true
  },
  lastVerifiedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING, // 'active', 'expired', 'flagged', 'draft'
    defaultValue: 'active'
  },
  missingFields: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  contradictionFlags: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  dataQualityFlags: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  normalizedFingerprint: {
    type: DataTypes.STRING,
    allowNull: false
  },
  fingerprint: {
    type: DataTypes.STRING,
    allowNull: true
  },
  trustScore: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },

  // Additional columns supporting full discovery, recommendations & simulation
  slug: {
    type: DataTypes.STRING,
    allowNull: true
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
    type: DataTypes.STRING,
    defaultValue: 'all'
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
  sourceFormat: {
    type: DataTypes.STRING,
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
  isDuplicate: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  duplicateOfId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  viewCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'opportunities',
  timestamps: true,
  hooks: {
    beforeValidate: (opp) => {
      if (opp.organizer && !opp.organization) opp.organization = opp.organizer;
      if (opp.organization && !opp.organizer) opp.organizer = opp.organization;

      if (opp.eventType && !opp.opportunityType) opp.opportunityType = opp.eventType;
      if (opp.opportunityType && !opp.eventType) opp.eventType = opp.opportunityType;

      if (opp.deadline && !opp.applicationDeadline) opp.applicationDeadline = opp.deadline;
      if (opp.applicationDeadline && !opp.deadline) opp.deadline = opp.applicationDeadline;

      if (opp.startDate && !opp.eventStartDate) opp.eventStartDate = opp.startDate;
      if (opp.eventStartDate && !opp.startDate) opp.startDate = opp.eventStartDate;

      if (opp.endDate && !opp.eventEndDate) opp.eventEndDate = opp.endDate;
      if (opp.eventEndDate && !opp.endDate) opp.endDate = opp.eventEndDate;

      if (opp.normalizedFingerprint && !opp.fingerprint) opp.fingerprint = opp.normalizedFingerprint;
      if (opp.fingerprint && !opp.normalizedFingerprint) opp.normalizedFingerprint = opp.fingerprint;
      if (!opp.normalizedFingerprint) {
        const cleanTitle = (opp.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        const cleanOrg = (opp.organizer || opp.organization || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        opp.normalizedFingerprint = `${cleanOrg}_${cleanTitle}_${Date.now()}`;
        opp.fingerprint = opp.normalizedFingerprint;
      }

      if (!opp.applicationUrl) {
        opp.applicationUrl = opp.sourceUrl || opp.websiteUrl || 'https://opportunityx.edu';
      }

      if (opp.sourceRecordId && !opp.externalId) opp.externalId = opp.sourceRecordId;
      if (opp.externalId && !opp.sourceRecordId) opp.sourceRecordId = opp.externalId;

      if (opp.sourceName && !opp.sourceFeed) opp.sourceFeed = opp.sourceName;
      if (opp.sourceFeed && !opp.sourceName) opp.sourceName = opp.sourceFeed;
    }
  },
  indexes: [
    { fields: ['normalizedFingerprint'] },
    { fields: ['eventType'] },
    { fields: ['format'] },
    { fields: ['deadline'] },
    { fields: ['status'] },
    { fields: ['category'] }
  ],
  getterMethods: {
    dataQualityFlags() {
      const stored = this.getDataValue('dataQualityFlags') || [];
      const missing = this.missingFields || [];
      const contra = this.contradictionFlags || [];
      return Array.from(new Set([...stored, ...missing, ...contra]));
    }
  },
  setterMethods: {
    dataQualityFlags(flags) {
      if (Array.isArray(flags)) {
        this.setDataValue('dataQualityFlags', flags);
        const missing = flags.filter(f => String(f).startsWith('missing_') || String(f).includes('missing'));
        const contra = flags.filter(f => !missing.includes(f));
        this.setDataValue('missingFields', missing);
        this.setDataValue('contradictionFlags', contra);
      }
    }
  }
});

module.exports = Opportunity;
