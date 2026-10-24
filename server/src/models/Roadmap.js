const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Roadmap = sequelize.define('Roadmap', {
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
    type: DataTypes.STRING, // 'active', 'completed', 'archived'
    defaultValue: 'active'
  },

  // Additional platform fields
  title: {
    type: DataTypes.STRING,
    defaultValue: 'Preparation Roadmap'
  },
  targetDeadline: {
    type: DataTypes.DATE,
    allowNull: true
  },
  progressPercentage: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'roadmaps',
  timestamps: true,
  indexes: [
    { fields: ['userId'] },
    { fields: ['opportunityId'] },
    { fields: ['status'] }
  ]
});

module.exports = Roadmap;
