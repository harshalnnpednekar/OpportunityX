const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Profile = sequelize.define('Profile', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    unique: true
  },
  fullName: {
    type: DataTypes.STRING,
    allowNull: false
  },
  bio: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  educationLevel: {
    type: DataTypes.STRING, // 'high_school', 'undergraduate', 'graduate', 'bootcamp', 'self_taught'
    defaultValue: 'undergraduate'
  },
  university: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  major: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  graduationYear: {
    type: DataTypes.INTEGER,
    defaultValue: 2027
  },
  country: {
    type: DataTypes.STRING,
    defaultValue: 'Global'
  },
  skills: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  interests: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  formatPreference: {
    type: DataTypes.STRING, // 'all', 'virtual', 'in_person', 'hybrid'
    defaultValue: 'all'
  },
  isPublicForMatching: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  matchingBio: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  githubUrl: {
    type: DataTypes.STRING,
    defaultValue: ''
  },
  portfolioUrl: {
    type: DataTypes.STRING,
    defaultValue: ''
  }
}, {
  tableName: 'profiles',
  timestamps: true
});

module.exports = Profile;
