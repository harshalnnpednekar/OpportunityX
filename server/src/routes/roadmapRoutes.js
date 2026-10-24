const express = require('express');
const router = express.Router();
const roadmapController = require('../controllers/roadmapController');
const { requireAuth } = require('../middleware/auth');
const { validateRoadmapTaskUpdate } = require('../middleware/validators');

router.use(requireAuth);

router.post('/generate', roadmapController.generateRoadmap);
router.get('/', roadmapController.getUserRoadmaps);
router.get('/:id', roadmapController.getRoadmapById);
router.patch('/:id/tasks/:taskId', validateRoadmapTaskUpdate, roadmapController.updateRoadmapTask);
router.patch('/:roadmapId/tasks/:taskId/toggle', roadmapController.toggleTaskCompletion);
router.delete('/:id', roadmapController.deleteRoadmap);

module.exports = router;
