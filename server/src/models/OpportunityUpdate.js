const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OpportunityUpdate = sequelize.define('OpportunityUpdate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  opportunityId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  updateType: {
    type: DataTypes.STRING, // 'deadline_extended', 'prize_updated', 'status_changed', 'details_modified'
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  oldValue: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  newValue: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  detectedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  tableName: 'opportunity_updates',
  timestamps: true,
  indexes: [
    { fields: ['opportunityId'] },
    { fields: ['updateType'] },
    { fields: ['detectedAt'] }
  ]
});

module.exports = OpportunityUpdate;
