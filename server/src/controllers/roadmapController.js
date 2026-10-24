const { Roadmap, RoadmapTask, Opportunity } = require('../models');
const RoadmapGenerator = require('../services/roadmapGenerator');

/**
 * Generate a new preparation roadmap for an opportunity
 */
const generateRoadmap = async (req, res, next) => {
  try {
    const opportunityId = req.body.opportunityId || req.params.id;

    if (!opportunityId) {
      return res.status(400).json({ error: 'opportunityId is required.' });
    }

    const opportunity = await Opportunity.findByPk(opportunityId);
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found.' });
    }

    // Check if user already has an active roadmap for this opportunity
    let roadmap = await Roadmap.findOne({
      where: { userId: req.user.id, opportunityId },
      include: [{ model: RoadmapTask, as: 'tasks' }]
    });

    if (roadmap) {
      return res.json({
        message: 'Active roadmap already exists for this opportunity.',
        roadmap
      });
    }

    const plan = RoadmapGenerator.generatePlan(opportunity);

    roadmap = await Roadmap.create({
      userId: req.user.id,
      opportunityId,
      title: plan.title,
      targetDeadline: plan.targetDeadline,
      progressPercentage: 0,
      status: 'active'
    });

    // Create tasks
    const taskPromises = plan.tasks.map(t =>
      RoadmapTask.create({
        roadmapId: roadmap.id,
        phase: t.phase,
        title: t.title,
        description: t.description,
        dueDate: t.dueDate,
        isCompleted: false,
        orderIndex: t.orderIndex,
        sortOrder: t.orderIndex
      })
    );

    await Promise.all(taskPromises);

    const fullRoadmap = await Roadmap.findByPk(roadmap.id, {
      include: [
        { model: RoadmapTask, as: 'tasks' },
        { model: Opportunity, as: 'opportunity' }
      ],
      order: [[{ model: RoadmapTask, as: 'tasks' }, 'orderIndex', 'ASC']]
    });

    res.status(201).json({
      message: 'Preparation roadmap generated successfully.',
      roadmap: fullRoadmap
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get all roadmaps for logged-in user
 */
const getUserRoadmaps = async (req, res, next) => {
  try {
    const roadmaps = await Roadmap.findAll({
      where: { userId: req.user.id },
      include: [
        { model: RoadmapTask, as: 'tasks' },
        { model: Opportunity, as: 'opportunity' }
      ],
      order: [
        ['createdAt', 'DESC'],
        [{ model: RoadmapTask, as: 'tasks' }, 'orderIndex', 'ASC']
      ]
    });

    res.json({ roadmaps });
  } catch (err) {
    next(err);
  }
};

/**
 * Get single roadmap by ID
 */
const getRoadmapById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const roadmap = await Roadmap.findOne({
      where: { id, userId: req.user.id },
      include: [
        { model: RoadmapTask, as: 'tasks' },
        { model: Opportunity, as: 'opportunity' }
      ],
      order: [[{ model: RoadmapTask, as: 'tasks' }, 'orderIndex', 'ASC']]
    });

    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found.' });
    }

    res.json({ roadmap });
  } catch (err) {
    next(err);
  }
};

/**
 * Update task completion status (PATCH /api/roadmaps/:id/tasks/:taskId)
 */
const updateRoadmapTask = async (req, res, next) => {
  try {
    const roadmapId = req.params.id || req.params.roadmapId;
    const { taskId } = req.params;

    const roadmap = await Roadmap.findOne({
      where: { id: roadmapId, userId: req.user.id }
    });

    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found.' });
    }

    const task = await RoadmapTask.findOne({
      where: { id: taskId, roadmapId }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found in this roadmap.' });
    }

    const isCompleted = req.body.isCompleted !== undefined
      ? Boolean(req.body.isCompleted)
      : !task.isCompleted;

    const completedAt = isCompleted ? (req.body.completedAt || new Date()) : null;

    await task.update({
      isCompleted,
      completedAt
    });

    // Recalculate progress percentage
    const allTasks = await RoadmapTask.findAll({ where: { roadmapId } });
    const completedCount = allTasks.filter(t => t.isCompleted).length;
    const progress = allTasks.length > 0 ? Math.round((completedCount / allTasks.length) * 100) : 0;

    await roadmap.update({
      progressPercentage: progress,
      status: progress === 100 ? 'completed' : 'active'
    });

    res.json({
      message: isCompleted ? 'Task marked complete.' : 'Task marked incomplete.',
      task,
      progressPercentage: progress,
      roadmapStatus: roadmap.status
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a roadmap
 */
const deleteRoadmap = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await Roadmap.destroy({
      where: { id, userId: req.user.id }
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Roadmap not found.' });
    }

    res.json({ message: 'Roadmap deleted.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Add a custom milestone task to an existing roadmap (POST /api/roadmaps/:id/tasks)
 */
const addRoadmapTask = async (req, res, next) => {
  try {
    const roadmapId = req.params.id || req.params.roadmapId;
    const { title, phase = 'Sprint Execution', description = '', dueDate = null } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required.' });
    }

    const roadmap = await Roadmap.findOne({
      where: { id: roadmapId, userId: req.user.id }
    });

    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found.' });
    }

    const existingTasks = await RoadmapTask.findAll({
      where: { roadmapId },
      order: [['orderIndex', 'DESC']]
    });

    const nextOrder = existingTasks.length > 0 ? (existingTasks[0].orderIndex || 0) + 1 : 1;

    const task = await RoadmapTask.create({
      roadmapId,
      phase,
      title: title.trim(),
      description: description.trim(),
      dueDate: dueDate || null,
      isCompleted: false,
      orderIndex: nextOrder,
      sortOrder: nextOrder
    });

    // Recalculate progress percentage
    const allTasks = await RoadmapTask.findAll({ where: { roadmapId } });
    const completedCount = allTasks.filter(t => t.isCompleted).length;
    const progress = allTasks.length > 0 ? Math.round((completedCount / allTasks.length) * 100) : 0;

    await roadmap.update({
      progressPercentage: progress,
      status: progress === 100 ? 'completed' : 'active'
    });

    res.status(201).json({
      message: 'Milestone task added to roadmap.',
      task,
      progressPercentage: progress
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a milestone task from a roadmap (DELETE /api/roadmaps/:id/tasks/:taskId)
 */
const deleteRoadmapTask = async (req, res, next) => {
  try {
    const roadmapId = req.params.id || req.params.roadmapId;
    const { taskId } = req.params;

    const roadmap = await Roadmap.findOne({
      where: { id: roadmapId, userId: req.user.id }
    });

    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found.' });
    }

    const deleted = await RoadmapTask.destroy({
      where: { id: taskId, roadmapId }
    });

    if (!deleted) {
      return res.status(404).json({ error: 'Task not found in this roadmap.' });
    }

    // Recalculate progress percentage
    const allTasks = await RoadmapTask.findAll({ where: { roadmapId } });
    const completedCount = allTasks.filter(t => t.isCompleted).length;
    const progress = allTasks.length > 0 ? Math.round((completedCount / allTasks.length) * 100) : 0;

    await roadmap.update({
      progressPercentage: progress,
      status: progress === 100 && allTasks.length > 0 ? 'completed' : 'active'
    });

    res.json({
      message: 'Task deleted from roadmap.',
      progressPercentage: progress
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  generateRoadmap,
  getUserRoadmaps,
  getRoadmapById,
  updateRoadmapTask,
  toggleTaskCompletion: updateRoadmapTask,
  addRoadmapTask,
  deleteRoadmapTask,
  deleteRoadmap
};
