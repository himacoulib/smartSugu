const httpStatus = require('http-status');
const mongoose = require('mongoose');
const { Notification } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Créer une notification
 * @param {Object} notificationBody - Détails de la notification
 * @returns {Promise<Notification>}
 */
const createNotification = async (notificationBody) => {
  if (!mongoose.Types.ObjectId.isValid(notificationBody.user)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid user ID');
  }
  return Notification.create(notificationBody);
};

/**
 * Récupérer les notifications d'un utilisateur
 * @param {ObjectId} userId - ID de l'utilisateur
 * @param {Object} options - Filtres et options de pagination
 * @param {number} [options.page=1] - Numéro de page
 * @param {number} [options.limit=10] - Nombre d'éléments par page
 * @param {string} [options.type] - Type de notification
 * @param {string} [options.status] - Statut de lecture ('read', 'unread')
 * @param {string} [options.search] - Recherche textuelle dans le message
 * @param {string} [options.priority] - Priorité des notifications
 * @returns {Promise<QueryResult>}
 */
const getUserNotifications = async (userId, { page = 1, limit = 10, type, status, search, priority }) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid user ID');
  }

  const filter = { user: userId };
  if (type) filter.type = type;
  if (status) filter.isRead = status === 'read';
  if (priority) filter.priority = priority;
  if (search) filter.message = { $regex: search, $options: 'i' };

  const options = { page, limit, sortBy: 'createdAt:desc' };
  return Notification.paginate(filter, options);
};

/**
 * Marquer une notification comme lue
 * @param {ObjectId} notificationId - ID de la notification
 * @returns {Promise<Notification>}
 */
const markAsRead = async (notificationId) => {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid notification ID');
  }

  const notification = await Notification.findById(notificationId);
  if (!notification) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Notification not found');
  }
  notification.isRead = true;
  await notification.save();
  return notification;
};

/**
 * Marquer toutes les notifications comme lues pour un utilisateur
 * @param {ObjectId} userId - ID de l'utilisateur
 * @returns {Promise<number>} - Nombre de notifications mises à jour
 */
const markAllAsRead = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid user ID');
  }

  const result = await Notification.updateMany({ user: userId, isRead: false }, { $set: { isRead: true } });
  return result.modifiedCount;
};

/**
 * Supprimer une notification
 * @param {ObjectId} notificationId - ID de la notification
 * @returns {Promise<Notification>}
 */
const deleteNotification = async (notificationId) => {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid notification ID');
  }

  const notification = await Notification.findById(notificationId);
  if (!notification) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Notification not found');
  }
  await notification.remove();
  return notification;
};

/**
 * Supprimer toutes les notifications pour un utilisateur
 * @param {ObjectId} userId - ID de l'utilisateur
 * @returns {Promise<number>} - Nombre de notifications supprimées
 */
const deleteAllNotifications = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid user ID');
  }

  const result = await Notification.deleteMany({ user: userId });
  return result.deletedCount;
};

/**
 * Supprimer les notifications obsolètes pour un utilisateur
 * @param {ObjectId} userId - ID de l'utilisateur
 * @returns {Promise<number>} - Nombre de notifications supprimées
 */
const deleteObsoleteNotifications = async (userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid user ID');
  }

  const now = new Date();
  const result = await Notification.deleteMany({ user: userId, expiresAt: { $lte: now } });
  return result.deletedCount;
};

/**
 * Récupérer les notifications par priorité
 * @param {ObjectId} userId - ID de l'utilisateur
 * @param {string} priority - Priorité ('high', 'medium', 'low')
 * @returns {Promise<Array>}
 */
const getPriorityNotifications = async (userId, priority) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid user ID');
  }

  return Notification.find({ user: userId, priority }).sort({ createdAt: -1 });
};

/**
 * Archiver une notification
 * @param {ObjectId} notificationId - ID de la notification
 * @returns {Promise<Notification>}
 */
const archiveNotification = async (notificationId) => {
  if (!mongoose.Types.ObjectId.isValid(notificationId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid notification ID');
  }

  const notification = await Notification.findById(notificationId);
  if (!notification) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Notification not found');
  }
  notification.isArchived = true;
  await notification.save();
  return notification;
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  deleteObsoleteNotifications,
  getPriorityNotifications,
  archiveNotification,
};
