const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MatchRequest = sequelize.define('MatchRequest', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  requesterId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  recipientId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  receiverId: {
    type: DataTypes.UUID,
    allowNull: true
  },
  opportunityId: {
    type: DataTypes.UUID,
    allowNull: true // optional opportunityId
  },
  status: {
    type: DataTypes.STRING, // 'pending', 'accepted', 'declined', 'cancelled'
    defaultValue: 'pending'
  },
  message: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  contactPreference: {
    type: DataTypes.STRING, // 'email', 'discord', 'github'
    defaultValue: 'email'
  },
  contactDetail: {
    type: DataTypes.STRING,
    defaultValue: ''
  }
}, {
  tableName: 'match_requests',
  timestamps: true,
  hooks: {
    beforeValidate: (m) => {
      if (m.recipientId && !m.receiverId) m.receiverId = m.recipientId;
      if (m.receiverId && !m.recipientId) m.recipientId = m.receiverId;
    }
  },
  indexes: [
    { fields: ['requesterId'] },
    { fields: ['recipientId'] },
    { fields: ['opportunityId'] },
    { fields: ['status'] }
  ]
});

module.exports = MatchRequest;
