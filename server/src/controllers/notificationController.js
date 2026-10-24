const { Notification, Opportunity } = require('../models');

/**
 * Get all notifications for logged-in user (GET /api/notifications)
 */
const getNotifications = async (req, res, next) => {
  try {
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
  markAsRead
};
