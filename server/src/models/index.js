const { sequelize } = require('../config/database');
const User = require('./User');
const Profile = require('./Profile');
const Opportunity = require('./Opportunity');
const SavedOpportunity = require('./SavedOpportunity');
const Roadmap = require('./Roadmap');
const RoadmapTask = require('./RoadmapTask');
const PeerMatch = require('./PeerMatch');
const IngestionLog = require('./IngestionLog');

// User <-> Profile (One-to-One)
User.hasOne(Profile, { foreignKey: 'userId', as: 'profile', onDelete: 'CASCADE' });
Profile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// User <-> SavedOpportunity <-> Opportunity
User.hasMany(SavedOpportunity, { foreignKey: 'userId', as: 'savedOpportunities', onDelete: 'CASCADE' });
SavedOpportunity.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Opportunity.hasMany(SavedOpportunity, { foreignKey: 'opportunityId', as: 'savedByStudents', onDelete: 'CASCADE' });
SavedOpportunity.belongsTo(Opportunity, { foreignKey: 'opportunityId', as: 'opportunity' });

// User <-> Roadmap <-> Opportunity
User.hasMany(Roadmap, { foreignKey: 'userId', as: 'roadmaps', onDelete: 'CASCADE' });
Roadmap.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Opportunity.hasMany(Roadmap, { foreignKey: 'opportunityId', as: 'roadmaps', onDelete: 'CASCADE' });
Roadmap.belongsTo(Opportunity, { foreignKey: 'opportunityId', as: 'opportunity' });

// Roadmap <-> RoadmapTask
Roadmap.hasMany(RoadmapTask, { foreignKey: 'roadmapId', as: 'tasks', onDelete: 'CASCADE' });
RoadmapTask.belongsTo(Roadmap, { foreignKey: 'roadmapId', as: 'roadmap' });

// Opportunity <-> PeerMatch
Opportunity.hasMany(PeerMatch, { foreignKey: 'opportunityId', as: 'peerMatches', onDelete: 'CASCADE' });
PeerMatch.belongsTo(Opportunity, { foreignKey: 'opportunityId', as: 'opportunity' });

// User <-> PeerMatch (Requester and Receiver)
User.hasMany(PeerMatch, { foreignKey: 'requesterId', as: 'sentMatches', onDelete: 'CASCADE' });
PeerMatch.belongsTo(User, { foreignKey: 'requesterId', as: 'requester' });

User.hasMany(PeerMatch, { foreignKey: 'receiverId', as: 'receivedMatches', onDelete: 'CASCADE' });
PeerMatch.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

module.exports = {
  sequelize,
  User,
  Profile,
  Opportunity,
  SavedOpportunity,
  Roadmap,
  RoadmapTask,
  PeerMatch,
  IngestionLog
};
