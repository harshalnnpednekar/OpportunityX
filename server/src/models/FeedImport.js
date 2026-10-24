const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const FeedImport = sequelize.define('FeedImport', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  sourceName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  sourceType: {
    type: DataTypes.STRING, // 'json', 'xml', 'api'
    allowNull: false
  },
  startedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  finishedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  recordsSeen: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  recordsCreated: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  recordsUpdated: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  duplicatesFound: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  errors: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  status: {
    type: DataTypes.STRING, // 'in_progress', 'success', 'warning', 'failed'
    defaultValue: 'success'
  },

  // Compatibility fields for existing admin ingestion logs
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
  tableName: 'feed_imports',
  timestamps: true,
  indexes: [
    { fields: ['sourceName'] },
    { fields: ['status'] },
    { fields: ['startedAt'] }
  ],
  getterMethods: {
    feedName() {
      return this.sourceName;
    },
    feedType() {
      return this.sourceType;
    }
  },
  setterMethods: {
    feedName(val) {
      this.setDataValue('sourceName', val);
    },
    feedType(val) {
      this.setDataValue('sourceType', val);
    }
  }
});

module.exports = FeedImport;
