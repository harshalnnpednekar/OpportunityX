const { sequelize } = require('../config/database');
const User = require('./User');
const StudentProfile = require('./StudentProfile');
const Opportunity = require('./Opportunity');
const SavedOpportunity = require('./SavedOpportunity');
const OpportunityUpdate = require('./OpportunityUpdate');
const Notification = require('./Notification');
const Roadmap = require('./Roadmap');
const RoadmapTask = require('./RoadmapTask');
const MatchRequest = require('./MatchRequest');
const FeedImport = require('./FeedImport');

// 1. User <-> StudentProfile (One-to-One, Cascade on delete)
User.hasOne(StudentProfile, { foreignKey: 'userId', as: 'profile', onDelete: 'CASCADE' });
StudentProfile.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// 2. User <-> SavedOpportunity <-> Opportunity
User.hasMany(SavedOpportunity, { foreignKey: 'userId', as: 'savedOpportunities', onDelete: 'CASCADE' });
SavedOpportunity.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Opportunity.hasMany(SavedOpportunity, { foreignKey: 'opportunityId', as: 'savedByStudents', onDelete: 'CASCADE' });
SavedOpportunity.belongsTo(Opportunity, { foreignKey: 'opportunityId', as: 'opportunity' });

// 3. Opportunity <-> OpportunityUpdate (One-to-Many)
Opportunity.hasMany(OpportunityUpdate, { foreignKey: 'opportunityId', as: 'updates', onDelete: 'CASCADE' });
OpportunityUpdate.belongsTo(Opportunity, { foreignKey: 'opportunityId', as: 'opportunity' });

// 4. User <-> Notification (One-to-Many)
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Opportunity <-> Notification (Optional One-to-Many)
Opportunity.hasMany(Notification, { foreignKey: 'opportunityId', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(Opportunity, { foreignKey: 'opportunityId', as: 'opportunity' });

// 5. User <-> Roadmap <-> Opportunity
User.hasMany(Roadmap, { foreignKey: 'userId', as: 'roadmaps', onDelete: 'CASCADE' });
Roadmap.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Opportunity.hasMany(Roadmap, { foreignKey: 'opportunityId', as: 'roadmaps', onDelete: 'CASCADE' });
Roadmap.belongsTo(Opportunity, { foreignKey: 'opportunityId', as: 'opportunity' });

// 6. Roadmap <-> RoadmapTask (One-to-Many)
Roadmap.hasMany(RoadmapTask, { foreignKey: 'roadmapId', as: 'tasks', onDelete: 'CASCADE' });
RoadmapTask.belongsTo(Roadmap, { foreignKey: 'roadmapId', as: 'roadmap' });

// 7. User <-> MatchRequest (Requester and Recipient)
User.hasMany(MatchRequest, { foreignKey: 'requesterId', as: 'sentMatchRequests', onDelete: 'CASCADE' });
MatchRequest.belongsTo(User, { foreignKey: 'requesterId', as: 'requester' });

User.hasMany(MatchRequest, { foreignKey: 'recipientId', as: 'receivedMatchRequests', onDelete: 'CASCADE' });
MatchRequest.belongsTo(User, { foreignKey: 'recipientId', as: 'recipient' });

// Backward compatibility associations for PeerMatch naming
User.hasMany(MatchRequest, { foreignKey: 'requesterId', as: 'sentMatches', onDelete: 'CASCADE' });
User.hasMany(MatchRequest, { foreignKey: 'recipientId', as: 'receivedMatches', onDelete: 'CASCADE' });
MatchRequest.belongsTo(User, { foreignKey: 'recipientId', as: 'receiver' });

// Opportunity <-> MatchRequest (Optional)
Opportunity.hasMany(MatchRequest, { foreignKey: 'opportunityId', as: 'peerMatches', onDelete: 'CASCADE' });
Opportunity.hasMany(MatchRequest, { foreignKey: 'opportunityId', as: 'matchRequests', onDelete: 'CASCADE' });
MatchRequest.belongsTo(Opportunity, { foreignKey: 'opportunityId', as: 'opportunity' });

module.exports = {
  sequelize,
  // 10 Core Required Models
  User,
  StudentProfile,
  Opportunity,
  SavedOpportunity,
  OpportunityUpdate,
  Notification,
  Roadmap,
  RoadmapTask,
  MatchRequest,
  FeedImport,

  // Backward-compatibility aliases
  Profile: StudentProfile,
  PeerMatch: MatchRequest,
  IngestionLog: FeedImport
};
