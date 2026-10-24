const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const RoadmapTask = sequelize.define('RoadmapTask', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  roadmapId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  phase: {
    type: DataTypes.STRING,
    allowNull: false
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  dueDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
}, {
  tableName: 'roadmap_tasks',
  timestamps: true,
  indexes: [
    { fields: ['roadmapId', 'orderIndex'] }
  ]
});

module.exports = RoadmapTask;
