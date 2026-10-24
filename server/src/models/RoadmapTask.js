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
  status: {
    type: DataTypes.STRING, // 'pending', 'in_progress', 'completed'
    defaultValue: 'pending'
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  orderIndex: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  phase: {
    type: DataTypes.STRING,
    defaultValue: 'Phase 1'
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  completedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'roadmap_tasks',
  timestamps: true,
  hooks: {
    beforeValidate: (t) => {
      if (t.sortOrder !== undefined && t.orderIndex === undefined) t.orderIndex = t.sortOrder;
      if (t.orderIndex !== undefined && t.sortOrder === undefined) t.sortOrder = t.orderIndex;
      if (t.isCompleted && t.status === 'pending') t.status = 'completed';
      if (!t.isCompleted && t.status === 'completed') t.status = 'pending';
    }
  },
  indexes: [
    { fields: ['roadmapId', 'sortOrder'] },
    { fields: ['status'] }
  ]
});

module.exports = RoadmapTask;
