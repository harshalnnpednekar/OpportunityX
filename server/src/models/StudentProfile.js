const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const StudentProfile = sequelize.define('StudentProfile', {
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
  skills: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  interests: {
    type: DataTypes.JSONB,
    defaultValue: []
  },
  budgetMax: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  availability: {
    type: DataTypes.STRING, // 'full_time', 'part_time', 'weekends', 'flexible'
    defaultValue: 'flexible'
  },
  preferredFormat: {
    type: DataTypes.STRING, // 'all', 'virtual', 'in_person', 'hybrid'
    defaultValue: 'all'
  },
  formatPreference: {
    type: DataTypes.STRING,
    defaultValue: 'all'
  },
  preferredLocation: {
    type: DataTypes.STRING,
    defaultValue: 'Global'
  },
  experienceLevel: {
    type: DataTypes.STRING, // 'beginner', 'intermediate', 'advanced'
    defaultValue: 'beginner'
  },
  peerMatchingConsent: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  isPublicForMatching: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  fullName: {
    type: DataTypes.STRING,
    defaultValue: ''
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
  tableName: 'student_profiles',
  timestamps: true,
  hooks: {
    beforeValidate: (p) => {
      if (p.peerMatchingConsent !== undefined && p.isPublicForMatching === undefined) {
        p.isPublicForMatching = p.peerMatchingConsent;
      }
      if (p.isPublicForMatching !== undefined && p.peerMatchingConsent === undefined) {
        p.peerMatchingConsent = p.isPublicForMatching;
      }
      if (p.preferredFormat && !p.formatPreference) {
        p.formatPreference = p.preferredFormat;
      }
      if (p.formatPreference && !p.preferredFormat) {
        p.preferredFormat = p.formatPreference;
      }
    }
  }
});

module.exports = StudentProfile;
