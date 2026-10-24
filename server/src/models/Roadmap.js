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
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  targetDeadline: {
    type: DataTypes.DATE,
    allowNull: false
  },
  progressPercentage: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  status: {
    type: DataTypes.STRING, // 'active', 'completed', 'archived'
    defaultValue: 'active'
  }
}, {
  tableName: 'roadmaps',
  timestamps: true
});

module.exports = Roadmap;
