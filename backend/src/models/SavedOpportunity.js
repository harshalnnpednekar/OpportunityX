const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const SavedOpportunity = sequelize.define('SavedOpportunity', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  opportunityId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  status: {
    type: DataTypes.STRING, // 'saved', 'planning', 'applied', 'accepted', 'completed'
    defaultValue: 'saved'
  },
  notes: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  reminderDate: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'saved_opportunities',
  timestamps: true,
  indexes: [
    { unique: true, fields: ['userId', 'opportunityId'] },
    { fields: ['status'] }
  ]
});

module.exports = SavedOpportunity;
