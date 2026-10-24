class RoadmapGenerator {
  /**
   * Generates a structured multi-phase preparation roadmap tailored to opportunity
   * @param {Object} opportunity - The opportunity record
   * @param {Date} referenceDate - Current evaluation date
   */
  static generatePlan(opportunity, referenceDate = new Date()) {
    const deadline = new Date(opportunity.applicationDeadline || Date.now() + 30 * 24 * 60 * 60 * 1000);
    const totalMs = Math.max(1000 * 60 * 60 * 24 * 3, deadline.getTime() - referenceDate.getTime()); // at least 3 days
    
    const skillsList = (opportunity.requiredSkills || []).slice(0, 3).join(', ') || 'required toolkits';
    const oppType = opportunity.opportunityType || 'opportunity';
    const isHackathon = oppType === 'hackathon';
    const isResearch = oppType === 'research';

    // Helper to calculate milestone date by percentage of available runway
    const getMilestoneDate = (ratio) => {
      return new Date(referenceDate.getTime() + totalMs * ratio);
    };

    const tasks = [
      // Phase 1: Strategy & Alignment
      {
        phase: 'Phase 1: Strategy & Alignment',
        title: 'Analyze Prompt, Guidelines & Judging Rubric',
        description: `Read official terms for ${opportunity.title}. Highlight primary scoring dimensions, constraints, and submission formats.`,
        dueDate: getMilestoneDate(0.15),
        orderIndex: 1
      },
      {
        phase: 'Phase 1: Strategy & Alignment',
        title: isHackathon ? 'Assemble Collaborative Team & Assign Roles' : 'Outline Personal Statement & Project Angle',
        description: isHackathon 
          ? 'Use OpportunityX Peer Matching to connect with complementary developers/designers.'
          : 'Define your unique thesis, previous relevant coursework, and research motivations.',
        dueDate: getMilestoneDate(0.25),
        orderIndex: 2
      },

      // Phase 2: Technical Setup & Architecture
      {
        phase: 'Phase 2: Technical Setup & Architecture',
        title: `Skill Immersion & Toolchain Verification (${skillsList})`,
        description: `Review documentation, starter repositories, and SDKs for ${skillsList} to avoid mid-sprint blockers.`,
        dueDate: getMilestoneDate(0.40),
        orderIndex: 3
      },
      {
        phase: 'Phase 2: Technical Setup & Architecture',
        title: 'Design Core Architecture & Wireframe Mockups',
        description: 'Specify database schemas, API contracts, UI wireframes, or experimental design protocols.',
        dueDate: getMilestoneDate(0.55),
        orderIndex: 4
      },

      // Phase 3: Core Implementation & Milestone Testing
      {
        phase: 'Phase 3: Core Implementation & Milestone Testing',
        title: isResearch ? 'Execute Core Methodology & Analyze Data' : 'Build Working Core MVP Prototype',
        description: 'Complete high-priority features first. Focus on the core value proposition rather than superficial vanity features.',
        dueDate: getMilestoneDate(0.75),
        orderIndex: 5
      },
      {
        phase: 'Phase 3: Core Implementation & Milestone Testing',
        title: 'Run User Testing & Edge-Case Validation',
        description: 'Conduct smoke tests, stress-test responsive layout or model inference, and fix critical blocking bugs.',
        dueDate: getMilestoneDate(0.85),
        orderIndex: 6
      },

      // Phase 4: Final Submission & Polish
      {
        phase: 'Phase 4: Final Submission & Polish',
        title: 'Produce Demonstration Walkthrough & Documentation',
        description: 'Record a concise, polished 2-3 minute video demonstration highlighting problem, solution architecture, and execution.',
        dueDate: getMilestoneDate(0.92),
        orderIndex: 7
      },
      {
        phase: 'Phase 4: Final Submission & Polish',
        title: 'Final Submission Review (Buffer Day)',
        description: `Submit before the official closing time (${new Date(deadline).toLocaleDateString()}) to prevent last-minute server congestion.`,
        dueDate: getMilestoneDate(0.98),
        orderIndex: 8
      }
    ];

    return {
      title: `${opportunity.title} — Preparation Roadmap`,
      targetDeadline: deadline,
      tasks
    };
  }
}

module.exports = RoadmapGenerator;
