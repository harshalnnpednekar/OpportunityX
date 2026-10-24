class RoadmapGenerator {
  /**
   * Generates an editable multi-phase preparation roadmap tailored to opportunity
   * @param {Object} opportunity - The opportunity record
   * @param {Date} referenceDate - Current evaluation date
   */
  static generatePlan(opportunity, referenceDate = new Date()) {
    const rawDeadline = opportunity.applicationDeadline || opportunity.deadline;
    const deadline = rawDeadline ? new Date(rawDeadline) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const totalMs = Math.max(1000 * 60 * 60 * 24 * 3, deadline.getTime() - referenceDate.getTime()); // at least 3 days

    const skills = Array.isArray(opportunity.requiredSkills) ? opportunity.requiredSkills : [];
    const skillsList = skills.slice(0, 3).join(', ') || 'relevant toolkits';
    const oppType = (opportunity.opportunityType || opportunity.category || 'opportunity').toLowerCase();
    const isTeamOriented = (opportunity.teamMin && opportunity.teamMin > 1) || oppType === 'hackathon';
    const isResearch = oppType === 'research' || oppType === 'fellowship';

    // Helper to calculate milestone date by percentage of available runway
    const getMilestoneDate = (ratio) => {
      return new Date(referenceDate.getTime() + totalMs * ratio);
    };

    const tasks = [
      // 1. Eligibility Verification
      {
        phase: 'Phase 1: Strategy & Alignment',
        title: 'Eligibility Verification & Requirement Review',
        description: `Audit explicit requirements (degree, regional boundaries, dates) for ${opportunity.title}. Confirm qualification before investing preparation effort.`,
        dueDate: getMilestoneDate(0.12),
        orderIndex: 1,
        sortOrder: 1
      },

      // 2. Team Formation / Scope Definition
      {
        phase: 'Phase 1: Strategy & Alignment',
        title: isTeamOriented ? 'Team Formation & Peer Collaboration' : 'Project Scope & Charter Definition',
        description: isTeamOriented
          ? `Connect with consented peers on OpportunityX matching ${opportunity.title} team needs (${opportunity.teamMin || 2}–${opportunity.teamMax || 4} members).`
          : 'Define personal statement, project angle, deliverables scope, and learning objectives.',
        dueDate: getMilestoneDate(0.24),
        orderIndex: 2,
        sortOrder: 2
      },

      // 3. Skill Preparation
      {
        phase: 'Phase 2: Technical Setup & Architecture',
        title: `Skill Preparation & Toolchain Immersion (${skillsList})`,
        description: skills.length > 0
          ? `Review documentation, starter repositories, and SDKs for ${skillsList} to address preparatory skill runway.`
          : 'Review recommended toolkits, starter templates, and software dependencies for the project.',
        dueDate: getMilestoneDate(0.40),
        orderIndex: 3,
        sortOrder: 3
      },

      // 4. Milestones & Architecture
      {
        phase: 'Phase 2: Technical Setup & Architecture',
        title: 'Milestones & Architecture Specification',
        description: 'Draft system architecture, database contracts, component hierarchy, or experimental methodology outline.',
        dueDate: getMilestoneDate(0.55),
        orderIndex: 4,
        sortOrder: 4
      },

      // 5. Core Implementation
      {
        phase: 'Phase 3: Core Implementation & Testing',
        title: isResearch ? 'Execute Core Methodology & Research Sprint' : 'Build Core MVP Prototype & Features',
        description: 'Complete high-priority milestone features. Focus on genuine functionality and core demonstration value.',
        dueDate: getMilestoneDate(0.72),
        orderIndex: 5,
        sortOrder: 5
      },

      // 6. Application Preparation
      {
        phase: 'Phase 3: Core Implementation & Testing',
        title: 'Application Preparation & Narrative Documentation',
        description: 'Draft pitch deck, technical README writeup, demo recording, and supplementary application responses.',
        dueDate: getMilestoneDate(0.85),
        orderIndex: 6,
        sortOrder: 6
      },

      // 7. Submission Checklist
      {
        phase: 'Phase 4: Final Submission & Polish',
        title: 'Pre-Submission Checklist & Integrity Review',
        description: 'Verify public repository permissions, application links, formatting constraints, and submission portal criteria.',
        dueDate: getMilestoneDate(0.92),
        orderIndex: 7,
        sortOrder: 7
      },

      // 8. Deadline Checkpoint
      {
        phase: 'Phase 4: Final Submission & Polish',
        title: 'Deadline Buffer & Submission Checkpoint',
        description: `Submit before the official closing time (${deadline.toLocaleDateString()}) to prevent last-minute platform congestion.`,
        dueDate: getMilestoneDate(0.98),
        orderIndex: 8,
        sortOrder: 8
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
