const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { deliveryService, notificationService } = require('../services');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

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
 * Assigner une livraison à un livreur.
 */
const assignDelivery = catchAsync(async (req, res) => {
  logger.info(
    `Assignation de la livraison : DeliveryID=${req.params.deliveryId} au livreur : LivreID=${req.body.livreurId}`
  );

  // Vérification de l'existence de la livraison
  const delivery = await deliveryService.getDeliveryById(req.params.deliveryId);
  if (!delivery) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Delivery not found');
  }

  // Vérification des permissions ou de la disponibilité du livreur (si nécessaire)
  const assignedDelivery = await trackPerformance(
    () => deliveryService.assignDelivery(req.params.deliveryId, req.body.livreurId),
    'assignDelivery'
  );

  // Notification au livreur
  await notificationService.notifyLivreur(
    req.body.livreurId,
    `Une nouvelle livraison vous a été assignée : DeliveryID=${req.params.deliveryId}`
  );

  logger.info(`Livraison assignée avec succès : DeliveryID=${req.params.deliveryId}`);
  res.status(httpStatus.OK).send(assignedDelivery);
});

/**
 * Mettre à jour le statut de la livraison.
 */
const updateDeliveryStatus = catchAsync(async (req, res) => {
  logger.info(`Mise à jour du statut de la livraison : DeliveryID=${req.params.deliveryId}`);

  // Vérification de l'existence de la livraison
  const delivery = await deliveryService.getDeliveryById(req.params.deliveryId);
  if (!delivery) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Delivery not found');
  }

  // Validation du statut
  if (!['pending', 'in_progress', 'delivered', 'cancelled'].includes(req.body.status)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid delivery status');
  }

  const updatedDelivery = await trackPerformance(
    () => deliveryService.updateDeliveryStatus(req.params.deliveryId, req.body.status),
    'updateDeliveryStatus'
  );

  // Notifications en fonction du statut
  if (req.body.status === 'delivered') {
    await notificationService.notifyClient(
      updatedDelivery.order.client,
      `Votre commande : OrderID=${updatedDelivery.order._id} a été livrée avec succès.`
    );
  } else if (req.body.status === 'cancelled') {
    await notificationService.notifyLivreur(
      updatedDelivery.livreur,
      `La livraison : DeliveryID=${req.params.deliveryId} a été annulée.`
    );
  }

  logger.info(`Statut de la livraison mis à jour avec succès : DeliveryID=${req.params.deliveryId}`);
  res.status(httpStatus.OK).send(updatedDelivery);
});

/**
 * Obtenir l'historique des livraisons d'un utilisateur.
 */
const getDeliveryHistory = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, status, startDate, endDate } = req.query;
  logger.info(`Récupération de l'historique des livraisons pour l'utilisateur : UserID=${req.user.id}`);

  const history = await trackPerformance(
    () => deliveryService.getDeliveryHistory(req.user.id, { page, limit, status, startDate, endDate }),
    'getDeliveryHistory'
  );

  logger.info(`Historique des livraisons récupéré : Total=${history.totalResults}`);
  res.status(httpStatus.OK).send(history);
});

/**
 * Obtenir les statistiques globales des livraisons.
 */
const getDeliveryStats = catchAsync(async (req, res) => {
  logger.info(`Récupération des statistiques globales des livraisons.`);

  const stats = await trackPerformance(() => deliveryService.getDeliveryStats(), 'getDeliveryStats');

  logger.info(`Statistiques globales des livraisons récupérées avec succès`);
  res.status(httpStatus.OK).send(stats);
});

/**
 * Calculer la distance pour une livraison.
 */
const calculateDeliveryDistance = catchAsync(async (req, res) => {
  const { startCoords, endCoords } = req.body;
  logger.info(`Calcul de la distance entre deux points pour une livraison.`);

  const distance = await trackPerformance(
    () => deliveryService.calculateDistance(startCoords, endCoords),
    'calculateDeliveryDistance'
  );

  logger.info(`Distance calculée : ${distance} km`);
  res.status(httpStatus.OK).send({ distance });
});

module.exports = {
  assignDelivery,
  updateDeliveryStatus,
  getDeliveryHistory,
  getDeliveryStats,
  calculateDeliveryDistance,
};
