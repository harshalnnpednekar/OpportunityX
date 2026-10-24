const { Notification, Opportunity, SavedOpportunity } = require('../models');
const { Op } = require('sequelize');

/**
 * Helper to scan saved opportunities and generate in-app deadline reminders
 * for deadlines approaching within 7 days.
 */
const syncDeadlineReminders = async (userId) => {
  try {
    const saved = await SavedOpportunity.findAll({
      where: { userId },
      include: [{ model: Opportunity, as: 'opportunity' }]
    });

    const now = new Date();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    for (const item of saved) {
      if (!item.opportunity) continue;
      const rawDeadline = item.opportunity.applicationDeadline || item.opportunity.deadline;
      if (!rawDeadline) continue;

      const deadline = new Date(rawDeadline);
      const diffMs = deadline.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      // Approaching deadline within 7 days and not past
      if (diffDays >= 0 && diffDays <= 7) {
        // Prevent spam: Check if notification was already created in last 24 hours
        const recentNotif = await Notification.findOne({
          where: {
            userId,
            opportunityId: item.opportunity.id,
            type: 'deadline_reminder',
            createdAt: { [Op.gte]: oneDayAgo }
          }
        });

        if (!recentNotif) {
          const urgencyLabel = diffDays === 0 ? 'closes today' : diffDays === 1 ? 'closes tomorrow' : `closes in ${diffDays} days`;
          await Notification.create({
            userId,
            opportunityId: item.opportunity.id,
            type: 'deadline_reminder',
            message: `Approaching Deadline: "${item.opportunity.title}" ${urgencyLabel} (${deadline.toLocaleDateString()}). Complete your application!`
          });
        }
      }
    }
  } catch (err) {
    console.error('Error generating in-app deadline reminders:', err.message);
  }
};

/**
 * Get all notifications for logged-in user (GET /api/notifications)
 */
const getNotifications = async (req, res, next) => {
  try {
    // Automatically evaluate approaching deadlines for in-app reminders
    await syncDeadlineReminders(req.user.id);

    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      include: [{ model: Opportunity, as: 'opportunity', attributes: ['id', 'title', 'category'] }],
      order: [['createdAt', 'DESC']]
    });

    const unreadCount = notifications.filter(n => !n.readAt).length;

    res.json({
      total: notifications.length,
      unreadCount,
      notifications
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Manually trigger deadline reminder evaluation
 * (POST /api/notifications/refresh-reminders)
 */
const refreshReminders = async (req, res, next) => {
  try {
    await syncDeadlineReminders(req.user.id);

    const notifications = await Notification.findAll({
      where: { userId: req.user.id },
      include: [{ model: Opportunity, as: 'opportunity', attributes: ['id', 'title', 'category'] }],
      order: [['createdAt', 'DESC']]
    });

    const unreadCount = notifications.filter(n => !n.readAt).length;

    res.json({
      message: 'Deadline reminders refreshed.',
      total: notifications.length,
      unreadCount,
      notifications
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Mark a notification as read (PATCH /api/notifications/:id/read)
 */
const markAsRead = async (req, res, next) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findOne({
      where: { id, userId: req.user.id }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found.' });
    }

    if (!notification.readAt) {
      await notification.update({ readAt: new Date() });
    }

    res.json({
      message: 'Notification marked as read.',
      notification
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getNotifications,
  refreshReminders,
  markAsRead,
  syncDeadlineReminders
};
