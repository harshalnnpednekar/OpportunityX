/**
 * Comprehensive Database Seeder
 * Populates ~30 demo opportunities across 3 sample feeds,
 * demo users, profiles, saved opportunities, updates, notifications,
 * roadmaps, tasks, and peer match requests.
 * Safe to rerun repeatedly.
 */
const {
  sequelize,
  User,
  StudentProfile,
  Opportunity,
  SavedOpportunity,
  OpportunityUpdate,
  Notification,
  Roadmap,
  RoadmapTask,
  MatchRequest,
  FeedImport
} = require('../models');
const FeedImporter = require('../services/feedImporter');
const RoadmapGenerator = require('../services/roadmapGenerator');

async function seed() {
  console.log('[Seed] Verifying database connection...');
  await sequelize.authenticate();
  console.log('[Seed] Database connection verified.');

  // 1. Create or Find Admin Account
  console.log('[Seed] Setting up Admin user...');
  const [admin] = await User.findOrCreate({
    where: { email: 'admin@opportunityx.edu' },
    defaults: {
      name: 'OpportunityX Curator Admin',
      passwordHash: 'AdminPass123!',
      role: 'admin'
    }
  });

  await StudentProfile.findOrCreate({
    where: { userId: admin.id },
    defaults: {
      fullName: 'OpportunityX Curator Admin',
      bio: 'Platform administrator and catalog verification curator.',
      educationLevel: 'graduate',
      university: 'MIT',
      major: 'Computer Science & AI',
      country: 'USA',
      skills: ['Data Engineering', 'System Design', 'PostgreSQL'],
      interests: ['hackathon', 'fellowship', 'research'],
      budgetMax: 500.00,
      availability: 'flexible',
      preferredFormat: 'all',
      preferredLocation: 'USA',
      experienceLevel: 'advanced',
      peerMatchingConsent: false
    }
  });

  // 2. Create or Find Primary Demo Student Account (Alex Chen)
  console.log('[Seed] Setting up primary demo student user (Alex Chen)...');
  const [student] = await User.findOrCreate({
    where: { email: 'alex.chen@university.edu' },
    defaults: {
      name: 'Alex Chen',
      passwordHash: 'StudentPass123!',
      role: 'student'
    }
  });

  await StudentProfile.findOrCreate({
    where: { userId: student.id },
    defaults: {
      fullName: 'Alex Chen',
      bio: 'Junior undergraduate student passionate about machine learning systems, open source tooling, and climate tech hackathons.',
      educationLevel: 'undergraduate',
      university: 'UC Berkeley',
      major: 'Computer Science',
      graduationYear: 2027,
      country: 'USA',
      skills: ['Python', 'PyTorch', 'React', 'FastAPI', 'Git', 'Docker'],
      interests: ['hackathon', 'competition', 'fellowship', 'AI/ML', 'Climate'],
      budgetMax: 200.00,
      availability: 'part_time',
      preferredFormat: 'all',
      preferredLocation: 'Global',
      experienceLevel: 'intermediate',
      peerMatchingConsent: true,
      matchingBio: 'Seeking teammates with frontend design (Figma/Next.js) or systems engineering background for upcoming fall/winter hackathons!',
      githubUrl: 'https://github.com/alexchen-demo',
      portfolioUrl: 'https://alexchen.example.dev'
    }
  });

  // 3. Create or Find Peer Students
  console.log('[Seed] Setting up peer student profiles...');
  const peersData = [
    {
      email: 'maya.patel@tech.edu',
      name: 'Maya Patel',
      profile: {
        fullName: 'Maya Patel',
        bio: 'Undergraduate UI/UX designer and frontend engineer. Loves building accessible web applications.',
        educationLevel: 'undergraduate',
        university: 'University of Washington',
        major: 'Human-Computer Interaction',
        graduationYear: 2027,
        country: 'USA',
        skills: ['Figma', 'UI/UX Design', 'React', 'TypeScript', 'CSS/SVG', 'Accessibility (a11y)'],
        interests: ['hackathon', 'competition', 'Design'],
        budgetMax: 100.00,
        availability: 'weekends',
        preferredFormat: 'virtual',
        preferredLocation: 'USA',
        experienceLevel: 'intermediate',
        peerMatchingConsent: true,
        matchingBio: 'UX designer looking for backend/ML partners who need slick user interfaces.',
        githubUrl: 'https://github.com/mayapatel-demo'
      }
    },
    {
      email: 'elena.rostova@polytechnic.edu',
      name: 'Elena Rostova',
      profile: {
        fullName: 'Elena Rostova',
        bio: 'Robotics and embedded systems builder. Experience with ROS 2 and autonomous navigation.',
        educationLevel: 'graduate',
        university: 'Carnegie Mellon University',
        major: 'Robotics Engineering',
        graduationYear: 2026,
        country: 'USA',
        skills: ['C++', 'ROS', 'Python', 'Computer Vision', 'Robotics', 'Linux'],
        interests: ['hackathon', 'research', 'Autonomous Systems'],
        budgetMax: 300.00,
        availability: 'flexible',
        preferredFormat: 'hybrid',
        preferredLocation: 'USA',
        experienceLevel: 'advanced',
        peerMatchingConsent: true,
        matchingBio: 'Robotics engineer ready to team up on hardware-software fusion or perception challenges.',
        githubUrl: 'https://github.com/elenar-demo'
      }
    },
    {
      email: 'david.kim@stanford.edu',
      name: 'David Kim',
      profile: {
        fullName: 'David Kim',
        bio: 'Quantitative finance and distributed systems student.',
        educationLevel: 'undergraduate',
        university: 'Stanford University',
        major: 'Mathematical & Computational Science',
        graduationYear: 2028,
        country: 'USA',
        skills: ['Python', 'C++', 'Algorithms', 'Stochastic Calculus', 'Data Structures'],
        interests: ['competition', 'fellowship', 'Finance'],
        budgetMax: 150.00,
        availability: 'part_time',
        preferredFormat: 'all',
        preferredLocation: 'USA',
        experienceLevel: 'intermediate',
        peerMatchingConsent: true,
        matchingBio: 'Algorithmic competitor seeking math and systems teammates for trading challenges.'
      }
    }
  ];

  const seededPeers = [];
  for (const p of peersData) {
    const [peerUser] = await User.findOrCreate({
      where: { email: p.email },
      defaults: {
        name: p.name,
        passwordHash: 'StudentPass123!',
        role: 'student'
      }
    });

    await StudentProfile.findOrCreate({
      where: { userId: peerUser.id },
      defaults: p.profile
    });

    seededPeers.push(peerUser);
  }

  // 4. Ingest All 3 Feeds (~30 opportunities)
  console.log('[Seed] Ingesting all sample feeds (JSON + XML)...');
  const feedResults = await FeedImporter.importAllDefaultFeeds();
  console.log(
    '[Seed] Feeds imported:',
    feedResults.map(r => `${r.feedName}: ${r.itemsIngested} ingested, ${r.duplicatesFlagged} duplicates, ${r.expiredFlagged} expired`)
  );

  // 5. Setup Saved Opportunities, Roadmaps, Updates & Notifications
  console.log('[Seed] Setting up relational workflow entities for demo student...');
  const calHacks = await Opportunity.findOne({ where: { sourceRecordId: 'hack-001' } });
  const kpcb = await Opportunity.findOne({ where: { sourceRecordId: 'comp-102' } });
  const cern = await Opportunity.findOne({ where: { sourceRecordId: 'work-201' } });

  if (calHacks) {
    // 5a. SavedOpportunity
    await SavedOpportunity.findOrCreate({
      where: {
        userId: student.id,
        opportunityId: calHacks.id
      },
      defaults: {
        reminderEnabled: true,
        savedAt: new Date(),
        status: 'planning',
        notes: 'Formed preliminary thesis on renewable grid optimization. Need to confirm team stack by Nov 10.'
      }
    });

    // Peer 1 (Maya) also saves CalHacks
    await SavedOpportunity.findOrCreate({
      where: {
        userId: seededPeers[0].id,
        opportunityId: calHacks.id
      },
      defaults: {
        reminderEnabled: true,
        savedAt: new Date(),
        status: 'saved',
        notes: 'Looking for a ML developer to partner with for the climate track!'
      }
    });

    // 5b. OpportunityUpdate
    await OpportunityUpdate.findOrCreate({
      where: {
        opportunityId: calHacks.id,
        updateType: 'deadline_extended'
      },
      defaults: {
        message: 'Application deadline extended by 48 hours due to global registration volume.',
        oldValue: { deadline: '2026-11-13T23:59:59Z' },
        newValue: { deadline: '2026-11-15T23:59:59Z' },
        detectedAt: new Date()
      }
    });

    // 5c. Notification
    await Notification.findOrCreate({
      where: {
        userId: student.id,
        opportunityId: calHacks.id,
        type: 'deadline_reminder'
      },
      defaults: {
        message: 'Upcoming deadline: CalHacks AI & Climate Challenge registration closes in 5 days.',
        readAt: null
      }
    });

    // 5d. Roadmap & Tasks
    let roadmap = await Roadmap.findOne({
      where: {
        userId: student.id,
        opportunityId: calHacks.id
      }
    });

    if (!roadmap) {
      const plan = RoadmapGenerator.generatePlan(calHacks);
      roadmap = await Roadmap.create({
        userId: student.id,
        opportunityId: calHacks.id,
        title: plan.title,
        targetDeadline: plan.targetDeadline,
        progressPercentage: 25,
        status: 'active'
      });

      for (let i = 0; i < plan.tasks.length; i++) {
        const t = plan.tasks[i];
        const isCompleted = i < 2;
        await RoadmapTask.create({
          roadmapId: roadmap.id,
          phase: t.phase,
          title: t.title,
          description: t.description,
          dueDate: t.dueDate,
          status: isCompleted ? 'completed' : 'pending',
          sortOrder: t.orderIndex || i,
          isCompleted,
          completedAt: isCompleted ? new Date() : null
        });
      }
    }

    // 5e. MatchRequest (Maya -> Alex)
    await MatchRequest.findOrCreate({
      where: {
        requesterId: seededPeers[0].id,
        recipientId: student.id,
        opportunityId: calHacks.id
      },
      defaults: {
        status: 'pending',
        message: 'Hi Alex! I saw you are preparing for CalHacks AI & Climate track with Python/PyTorch. I am a UI/UX designer and React frontend builder. Would love to join forces!',
        contactPreference: 'email',
        contactDetail: 'maya.patel@tech.edu'
      }
    });
  }

  if (kpcb) {
    await SavedOpportunity.findOrCreate({
      where: {
        userId: student.id,
        opportunityId: kpcb.id
      },
      defaults: {
        reminderEnabled: false,
        savedAt: new Date(),
        status: 'saved',
        notes: 'Review essay questions regarding engineering leadership and portfolio projects.'
      }
    });
  }

  if (cern) {
    await SavedOpportunity.findOrCreate({
      where: {
        userId: student.id,
        opportunityId: cern.id
      },
      defaults: {
        reminderEnabled: true,
        savedAt: new Date(),
        status: 'saved',
        notes: 'Ask professor for letter of recommendation by early January.'
      }
    });
  }

  console.log('[Seed] Seeding completed successfully!');
  console.log('[Seed] Credentials summary:');
  console.log('       Admin:   admin@opportunityx.edu / AdminPass123!');
  console.log('       Student: alex.chen@university.edu / StudentPass123!');
}

if (require.main === module) {
  seed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed Error]:', err);
      process.exit(1);
    });
}

module.exports = seed;
