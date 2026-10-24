const { SavedOpportunity, Opportunity } = require('../models');
const { Op } = require('sequelize');

/**
 * Get all saved opportunities for logged in student
 */
const getSavedOpportunities = async (req, res, next) => {
  try {
    const { status } = req.query;
    const where = { userId: req.user.id };
    if (status && status !== 'all') {
      where.status = status;
    }

    const saved = await SavedOpportunity.findAll({
      where,
      include: [{
        model: Opportunity,
        as: 'opportunity'
      }],
      order: [
        [{ model: Opportunity, as: 'opportunity' }, 'applicationDeadline', 'ASC']
      ]
    });

    res.json({ saved });
  } catch (err) {
    next(err);
  }
};

/**
 * Save / Bookmark an opportunity
 */
const saveOpportunity = async (req, res, next) => {
  try {
    const { opportunityId, status = 'saved', notes = '', reminderDate = null } = req.body;

    if (!opportunityId) {
      return res.status(400).json({ error: 'opportunityId is required.' });
    }

    const opportunity = await Opportunity.findByPk(opportunityId);
    if (!opportunity) {
      return res.status(404).json({ error: 'Opportunity not found.' });
    }

    const [saved, created] = await SavedOpportunity.findOrCreate({
      where: { userId: req.user.id, opportunityId },
      defaults: {
        userId: req.user.id,
        opportunityId,
        status,
        notes,
        reminderDate
      }
    });

    if (!created) {
      await saved.update({ status, notes, reminderDate });
    }

    const reloaded = await SavedOpportunity.findByPk(saved.id, {
      include: [{ model: Opportunity, as: 'opportunity' }]
    });

    res.status(created ? 201 : 200).json({
      message: created ? 'Opportunity saved to your tracker.' : 'Tracking status updated.',
      saved: reloaded
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update saved status or notes
 */
const updateSaved = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, notes, reminderDate } = req.body;

    const saved = await SavedOpportunity.findOne({
      where: { id, userId: req.user.id }
    });

    if (!saved) {
      return res.status(404).json({ error: 'Saved record not found.' });
    }

    await saved.update({
      status: status !== undefined ? status : saved.status,
      notes: notes !== undefined ? notes : saved.notes,
      reminderDate: reminderDate !== undefined ? reminderDate : saved.reminderDate
    });

    res.json({
      message: 'Status updated.',
      saved
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Remove saved opportunity
 */
const removeSaved = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);

    const where = {
      userId: req.user.id
    };

    if (isUuid) {
      where[Op.or] = [{ id }, { opportunityId: id }];
    } else {
      where.id = id;
    }

    const deleted = await SavedOpportunity.destroy({ where });
    if (!deleted) {
      return res.status(404).json({ error: 'Saved record not found.' });
    }

    res.json({ message: 'Opportunity removed from saved list.' });
  } catch (err) {
    next(err);
  }
};

/**
 * Get deadline timeline & notifications
 */
const getDeadlineTimeline = async (req, res, next) => {
  try {
    const saved = await SavedOpportunity.findAll({
      where: { userId: req.user.id },
      include: [{
        model: Opportunity,
        as: 'opportunity'
      }],
      order: [
        [{ model: Opportunity, as: 'opportunity' }, 'applicationDeadline', 'ASC']
      ]
    });

    const now = new Date();
    const timeline = {
      critical: [],   // < 3 days
      approaching: [],// 3 - 7 days
      upcoming: [],   // 7 - 14 days
      later: [],      // > 14 days
      past: []        // past deadline
    };

    saved.forEach(item => {
      if (!item.opportunity) return;
      const deadline = new Date(item.opportunity.applicationDeadline);
      const diffMs = deadline.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      const entry = {
        savedId: item.id,
        opportunityId: item.opportunity.id,
        title: item.opportunity.title,
        organization: item.opportunity.organization,
        opportunityType: item.opportunity.opportunityType,
        applicationDeadline: item.opportunity.applicationDeadline,
        status: item.status,
        daysRemaining: diffDays
      };

      if (diffDays < 0) {
        timeline.past.push(entry);
      } else if (diffDays <= 3) {
        timeline.critical.push(entry);
      } else if (diffDays <= 7) {
        timeline.approaching.push(entry);
      } else if (diffDays <= 14) {
        timeline.upcoming.push(entry);
      } else {
        timeline.later.push(entry);
      }
    });

    const totalActiveDeadlines = timeline.critical.length + timeline.approaching.length + timeline.upcoming.length + timeline.later.length;

    res.json({
      totalActiveDeadlines,
      timeline
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getSavedOpportunities,
  saveOpportunity,
  updateSaved,
  removeSaved,
  getDeadlineTimeline
};
