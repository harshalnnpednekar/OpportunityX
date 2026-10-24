const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const IngestionLog = sequelize.define('IngestionLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  feedName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  feedType: {
    type: DataTypes.STRING, // 'json', 'xml'
    allowNull: false
  },
  status: {
    type: DataTypes.STRING, // 'success', 'warning', 'failed'
    defaultValue: 'success'
  },
  totalProcessed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  itemsIngested: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  itemsUpdated: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  duplicatesFlagged: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  expiredFlagged: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  invalidSkipped: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  details: {
    type: DataTypes.JSONB,
    defaultValue: []
  }
}, {
  tableName: 'ingestion_logs',
  timestamps: true,
  indexes: [
    { fields: ['createdAt'] }
  ]
});

module.exports = IngestionLog;
