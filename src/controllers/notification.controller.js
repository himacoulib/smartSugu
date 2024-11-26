const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { notificationService, realTimeService, emailService, smsService } = require('../services'); // Ajout de smsService
// eslint-disable-next-line no-unused-vars
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

/**
 * Suivi des performances pour mesurer le temps d'exécution des méthodes.
 * @param {Function} fn - Méthode à exécuter.
 * @param {string} action - Nom de l'action à loguer.
 */
const trackPerformance = async (fn, action) => {
  const startTime = Date.now();
  const result = await fn();
  const endTime = Date.now();
  logger.info(`[PERFORMANCE] Action=${action} - ExecutionTime=${endTime - startTime}ms`);
  return result;
};

/**
 * Créer une notification et gérer les canaux d'envoi.
 */
const createNotification = catchAsync(async (req, res) => {
  logger.info(`Création d'une notification pour l'utilisateur : UserID=${req.body.userId}`);
  const { channels = ['in_app'], priority = 'medium', groupId = null } = req.body; // Gestion des priorités et des groupes

  // Créer la notification en base
  const notification = await trackPerformance(
    () => notificationService.createNotification({ ...req.body, priority, groupId }),
    'createNotification'
  );

  // Envoyer via les canaux spécifiés
  if (channels.includes('push')) {
    await realTimeService.sendNotification(req.body.userId, notification);
  }
  if (channels.includes('email')) {
    await emailService.sendNotificationEmail(req.body.userId, notification);
  }
  if (channels.includes('sms')) {
    await smsService.sendSmsNotification(req.body.userId, notification);
  }

  logger.info(
    `Notification créée avec succès : NotificationID=${notification.id}, Channels=${channels}, Priority=${priority}`
  );
  res.status(httpStatus.CREATED).send(notification);
});

/**
 * Récupérer les notifications d'un utilisateur.
 */
const getUserNotifications = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, type, status, search, priority } = req.query;
  logger.info(
    `Récupération des notifications pour l'utilisateur : UserID=${req.user.id}, Params=${JSON.stringify(req.query)}`
  );
  const notifications = await trackPerformance(
    () => notificationService.getUserNotifications(req.user.id, { page, limit, type, status, search, priority }),
    'getUserNotifications'
  );
  logger.info(`Notifications récupérées avec succès : Total=${notifications.totalResults}`);
  res.status(httpStatus.OK).send(notifications);
});

/**
 * Marquer une notification comme lue.
 */
const markAsRead = catchAsync(async (req, res) => {
  logger.info(`Marquage comme lu de la notification : NotificationID=${req.params.notificationId}`);
  const updatedNotification = await trackPerformance(
    () => notificationService.markAsRead(req.params.notificationId),
    'markAsRead'
  );
  logger.info(`Notification marquée comme lue avec succès : NotificationID=${req.params.notificationId}`);
  res.status(httpStatus.OK).send(updatedNotification);
});

/**
 * Archiver une notification.
 */
const archiveNotification = catchAsync(async (req, res) => {
  logger.info(`Archivage de la notification : NotificationID=${req.params.notificationId}`);
  const archivedNotification = await trackPerformance(
    () => notificationService.archiveNotification(req.params.notificationId),
    'archiveNotification'
  );
  logger.info(`Notification archivée avec succès : NotificationID=${req.params.notificationId}`);
  res.status(httpStatus.OK).send(archivedNotification);
});

/**
 * Marquer toutes les notifications comme lues.
 */
const markAllAsRead = catchAsync(async (req, res) => {
  logger.info(`Marquage de toutes les notifications comme lues pour l'utilisateur : UserID=${req.user.id}`);
  const updatedCount = await trackPerformance(() => notificationService.markAllAsRead(req.user.id), 'markAllAsRead');
  logger.info(`Toutes les notifications marquées comme lues : Total=${updatedCount}`);
  res.status(httpStatus.OK).send({ updatedCount });
});

/**
 * Supprimer une notification.
 */
const deleteNotification = catchAsync(async (req, res) => {
  logger.info(`Suppression de la notification : NotificationID=${req.params.notificationId}`);
  await trackPerformance(() => notificationService.deleteNotification(req.params.notificationId), 'deleteNotification');
  logger.info(`Notification supprimée avec succès : NotificationID=${req.params.notificationId}`);
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Supprimer toutes les notifications.
 */
const deleteAllNotifications = catchAsync(async (req, res) => {
  logger.info(`Suppression de toutes les notifications pour l'utilisateur : UserID=${req.user.id}`);
  const deletedCount = await trackPerformance(
    () => notificationService.deleteAllNotifications(req.user.id),
    'deleteAllNotifications'
  );
  logger.info(`Toutes les notifications supprimées : Total=${deletedCount}`);
  res.status(httpStatus.OK).send({ deletedCount });
});

/**
 * Supprimer toutes les notifications obsolètes d'un utilisateur.
 */
const deleteObsoleteNotifications = catchAsync(async (req, res) => {
  logger.info(`Suppression des notifications obsolètes pour l'utilisateur : UserID=${req.user.id}`);
  const deletedCount = await trackPerformance(
    () => notificationService.deleteObsoleteNotifications(req.user.id),
    'deleteObsoleteNotifications'
  );
  logger.info(`Notifications obsolètes supprimées : Total=${deletedCount}`);
  res.status(httpStatus.OK).send({ deletedCount });
});

/**
 * Obtenir les notifications par priorité.
 */
const getPriorityNotifications = catchAsync(async (req, res) => {
  logger.info(`Récupération des notifications prioritaires pour l'utilisateur : UserID=${req.user.id}`);
  const notifications = await trackPerformance(
    () => notificationService.getPriorityNotifications(req.user.id, req.query.priority),
    'getPriorityNotifications'
  );
  logger.info(`Notifications prioritaires récupérées avec succès : Total=${notifications.length}`);
  res.status(httpStatus.OK).send(notifications);
});

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  archiveNotification,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  deleteObsoleteNotifications,
  getPriorityNotifications,
};
