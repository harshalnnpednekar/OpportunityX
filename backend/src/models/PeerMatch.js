const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PeerMatch = sequelize.define('PeerMatch', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  opportunityId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  requesterId: {
    type: DataTypes.UUID,
    allowNull: false
  },
  receiverId: {
    type: DataTypes.UUID,
    allowNull: false
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
  tableName: 'peer_matches',
  timestamps: true,
  indexes: [
    { fields: ['opportunityId'] },
    { fields: ['requesterId'] },
    { fields: ['receiverId'] }
  ]
});

module.exports = PeerMatch;
