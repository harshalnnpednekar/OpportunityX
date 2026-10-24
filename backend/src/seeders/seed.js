const { sequelize, User, Profile, Opportunity, SavedOpportunity, Roadmap, RoadmapTask, PeerMatch, IngestionLog } = require('../models');
const FeedImporter = require('../services/feedImporter');
const RoadmapGenerator = require('../services/roadmapGenerator');

async function seed() {
  console.log('[Seed] Initializing database tables...');
  await sequelize.sync({ force: true });
  console.log('[Seed] Schema recreated.');

  // 1. Create Admin Account
  console.log('[Seed] Creating admin user...');
  const admin = await User.create({
    email: 'admin@opportunityx.edu',
    passwordHash: 'AdminPass123!',
    role: 'admin'
  });

  await Profile.create({
    userId: admin.id,
    fullName: 'OpportunityX Curator Admin',
    bio: 'Platform administrator and catalog verification curator.',
    educationLevel: 'graduate',
    university: 'MIT',
    major: 'Computer Science & AI',
    country: 'USA',
    skills: ['Data Engineering', 'System Design', 'PostgreSQL'],
    interests: ['hackathon', 'fellowship', 'research'],
    isPublicForMatching: false
  });

  // 2. Create Primary Demo Student Account
  console.log('[Seed] Creating primary demo student user...');
  const student = await User.create({
    email: 'alex.chen@university.edu',
    passwordHash: 'StudentPass123!',
    role: 'student'
  });

  const studentProfile = await Profile.create({
    userId: student.id,
    fullName: 'Alex Chen',
    bio: 'Junior undergraduate student passionate about machine learning systems, open source tooling, and climate tech hackathons.',
    educationLevel: 'undergraduate',
    university: 'UC Berkeley',
    major: 'Computer Science',
    graduationYear: 2027,
    country: 'USA',
    skills: ['Python', 'PyTorch', 'React', 'FastAPI', 'Git', 'Docker'],
    interests: ['hackathon', 'competition', 'fellowship', 'AI/ML', 'Climate'],
    formatPreference: 'all',
    isPublicForMatching: true,
    matchingBio: 'Seeking teammates with frontend design (Figma/Next.js) or systems engineering background for upcoming fall/winter hackathons!',
    githubUrl: 'https://github.com/alexchen-demo',
    portfolioUrl: 'https://alexchen.example.dev'
  });

  // 3. Create Peer Students for Consent-Based Peer Matching
  console.log('[Seed] Creating peer student profiles...');
  const peer1 = await User.create({
    email: 'maya.patel@tech.edu',
    passwordHash: 'StudentPass123!',
    role: 'student'
  });

  await Profile.create({
    userId: peer1.id,
    fullName: 'Maya Patel',
    bio: 'Undergraduate UI/UX designer and frontend engineer. Loves building accessible web applications and design systems.',
    educationLevel: 'undergraduate',
    university: 'University of Washington',
    major: 'Human-Computer Interaction',
    graduationYear: 2027,
    country: 'USA',
    skills: ['Figma', 'UI/UX Design', 'React', 'TypeScript', 'CSS/SVG', 'Accessibility (a11y)'],
    interests: ['hackathon', 'competition', 'Design'],
    formatPreference: 'virtual',
    isPublicForMatching: true,
    matchingBio: 'UX designer looking for backend/ML partners who need slick user interfaces and pitch-deck product strategy.',
    githubUrl: 'https://github.com/mayapatel-demo'
  });

  const peer2 = await User.create({
    email: 'elena.rostova@polytechnic.edu',
    passwordHash: 'StudentPass123!',
    role: 'student'
  });

  await Profile.create({
    userId: peer2.id,
    fullName: 'Elena Rostova',
    bio: 'Robotics and embedded systems builder. Experience with ROS 2, autonomous navigation, and C++.',
    educationLevel: 'graduate',
    university: 'Carnegie Mellon University',
    major: 'Robotics Engineering',
    graduationYear: 2026,
    country: 'USA',
    skills: ['C++', 'ROS', 'Python', 'Computer Vision', 'Robotics', 'Linux'],
    interests: ['hackathon', 'research', 'Autonomous Systems'],
    formatPreference: 'hybrid',
    isPublicForMatching: true,
    matchingBio: 'Robotics engineer ready to team up on hardware-software fusion or perception challenges.',
    githubUrl: 'https://github.com/elenar-demo'
  });

  const peer3 = await User.create({
    email: 'david.kim@stanford.edu',
    passwordHash: 'StudentPass123!',
    role: 'student'
  });

  await Profile.create({
    userId: peer3.id,
    fullName: 'David Kim',
    bio: 'Quantitative finance and distributed systems student. Experienced with low-latency algorithmic modeling.',
    educationLevel: 'undergraduate',
    university: 'Stanford University',
    major: 'Mathematical & Computational Science',
    graduationYear: 2028,
    country: 'USA',
    skills: ['Python', 'C++', 'Algorithms', 'Stochastic Calculus', 'Data Structures'],
    interests: ['competition', 'fellowship', 'Finance'],
    formatPreference: 'all',
    isPublicForMatching: true,
    matchingBio: 'Algorithmic competitor seeking math and systems teammates for trading challenges.'
  });

  // 4. Ingest All 3 Feeds
  console.log('[Seed] Ingesting all sample feeds (JSON + XML)...');
  const feedResults = await FeedImporter.importAllDefaultFeeds();
  console.log('[Seed] Feeds imported:', feedResults.map(r => `${r.feedName}: ${r.itemsIngested} ingested, ${r.duplicatesFlagged} duplicates, ${r.expiredFlagged} expired`));

  // 5. Seed Saved Opportunities & Roadmaps for Alex Chen
  console.log('[Seed] Setting up saved opportunities and preparation roadmap for demo student...');
  const calHacks = await Opportunity.findOne({ where: { externalId: 'hack-001' } });
  const kpcb = await Opportunity.findOne({ where: { externalId: 'comp-102' } });
  const cern = await Opportunity.findOne({ where: { externalId: 'work-201' } });

  if (calHacks) {
    // Save opportunity
    await SavedOpportunity.create({
      userId: student.id,
      opportunityId: calHacks.id,
      status: 'planning',
      notes: 'Formed preliminary thesis on renewable grid optimization. Need to confirm team stack by Nov 10.'
    });

    // Also peer1 (Maya) saved CalHacks so they can match!
    await SavedOpportunity.create({
      userId: peer1.id,
      opportunityId: calHacks.id,
      status: 'saved',
      notes: 'Looking for a ML developer to partner with for the climate track!'
    });

    // Create active preparation roadmap
    const plan = RoadmapGenerator.generatePlan(calHacks);
    const roadmap = await Roadmap.create({
      userId: student.id,
      opportunityId: calHacks.id,
      title: plan.title,
      targetDeadline: plan.targetDeadline,
      progressPercentage: 25,
      status: 'active'
    });

    for (let i = 0; i < plan.tasks.length; i++) {
      const t = plan.tasks[i];
      // Mark first two tasks completed for instant realistic progress
      const isCompleted = i < 2;
      await RoadmapTask.create({
        roadmapId: roadmap.id,
        phase: t.phase,
        title: t.title,
        description: t.description,
        dueDate: t.dueDate,
        isCompleted,
        completedAt: isCompleted ? new Date() : null,
        orderIndex: t.orderIndex
      });
    }

    // Create an incoming peer match request from Maya to Alex
    await PeerMatch.create({
      opportunityId: calHacks.id,
      requesterId: peer1.id,
      receiverId: student.id,
      status: 'pending',
      message: 'Hi Alex! I saw you are preparing for CalHacks AI & Climate track with Python/PyTorch. I am a UI/UX designer and React frontend builder. Would love to join forces!',
      contactPreference: 'email',
      contactDetail: 'maya.patel@tech.edu'
    });
  }

  if (kpcb) {
    await SavedOpportunity.create({
      userId: student.id,
      opportunityId: kpcb.id,
      status: 'saved',
      notes: 'Review essay questions regarding engineering leadership and portfolio projects.'
    });
  }

  if (cern) {
    await SavedOpportunity.create({
      userId: student.id,
      opportunityId: cern.id,
      status: 'saved',
      notes: 'Ask professor for letter of recommendation by early January.'
    });
  }

  console.log('[Seed] Seeding completed successfully!');
  console.log('[Seed] Credentials summary:');
  console.log('       Admin:   admin@opportunityx.edu / AdminPass123!');
  console.log('       Student: alex.chen@university.edu / StudentPass123!');
  process.exit(0);
}

seed().catch(err => {
  console.error('[Seed Error]:', err);
  process.exit(1);
});
