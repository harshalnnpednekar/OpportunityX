const RoadmapGenerator = require('../src/services/roadmapGenerator');

describe('RoadmapGenerator', () => {
  const opportunity = {
    title: 'Global Hackathon 2026',
    opportunityType: 'hackathon',
    requiredSkills: ['React', 'Node.js', 'Python'],
    applicationDeadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days away
  };

  test('should generate structured 4-phase preparation tasks', () => {
    const plan = RoadmapGenerator.generatePlan(opportunity);
    expect(plan.title).toContain('Global Hackathon 2026');
    expect(plan.tasks.length).toBe(8);

    const phases = [...new Set(plan.tasks.map(t => t.phase))];
    expect(phases.length).toBe(4);
    expect(phases[0]).toContain('Phase 1');
    expect(phases[1]).toContain('Phase 2');
    expect(phases[2]).toContain('Phase 3');
    expect(phases[3]).toContain('Phase 4');

    // Verify tasks are ordered with chronological deadlines
    for (let i = 0; i < plan.tasks.length - 1; i++) {
      expect(new Date(plan.tasks[i].dueDate).getTime()).toBeLessThanOrEqual(
        new Date(plan.tasks[i + 1].dueDate).getTime()
      );
    }
  });
});
