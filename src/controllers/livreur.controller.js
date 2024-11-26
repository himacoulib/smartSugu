const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { livreurService } = require('../services');
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
 * Obtenir les courses disponibles dans la zone du livreur, triées par proximité.
 */
const getAvailableDeliveries = catchAsync(async (req, res) => {
  logger.info(`Récupération des courses disponibles pour le livreur : ID=${req.user.id}`);
  const deliveries = await trackPerformance(
    () => livreurService.getAvailableDeliveries(req.user.id),
    'getAvailableDeliveries'
  );

  // Trier les livraisons par distance (utilisation d'une méthode du service)
  deliveries.sort((a, b) => a.distanceFromLivreur - b.distanceFromLivreur);

  logger.info(`Courses triées par proximité : Total=${deliveries.length}`);

  // Notification pour les mises à jour en temps réel
  if (deliveries.length > 0) {
    logger.info(`[NOTIFICATION] ${deliveries.length} livraisons disponibles pour le livreur ID=${req.user.id}`);
  }

  res.status(httpStatus.OK).send({
    deliveries,
    meta: {
      totalDeliveries: deliveries.length,
      updatedAt: new Date().toISOString(),
    },
  });
});

/**
 * Accepter une livraison après validation contextuelle.
 */
const acceptDelivery = catchAsync(async (req, res) => {
  logger.info(
    `Tentative d'acceptation de livraison : DeliveryID=${req.params.deliveryId} par le livreur : ID=${req.user.id}`
  );

  // Vérification contextuelle : disponibilité de la livraison
  const isAvailable = await livreurService.isDeliveryAvailable(req.params.deliveryId);
  if (!isAvailable) {
    logger.warn(`Livraison non disponible ou déjà assignée : DeliveryID=${req.params.deliveryId}`);
    throw new ApiError(httpStatus.CONFLICT, 'Delivery is no longer available');
  }

  const updatedDelivery = await trackPerformance(
    () => livreurService.acceptDelivery(req.user.id, req.params.deliveryId),
    'acceptDelivery'
  );

  logger.info(`Livraison acceptée avec succès : DeliveryID=${req.params.deliveryId}`);
  res.status(httpStatus.OK).send(updatedDelivery);
});

/**
 * Obtenir les livraisons assignées au livreur.
 */
const getAssignedDeliveries = catchAsync(async (req, res) => {
  logger.info(`Récupération des livraisons assignées pour le livreur : ID=${req.user.id}`);
  const deliveries = await trackPerformance(
    () => livreurService.getAssignedDeliveries(req.user.id),
    'getAssignedDeliveries'
  );
  logger.info(`Livraisons assignées récupérées : Total=${deliveries.length}`);
  res.status(httpStatus.OK).send(deliveries);
});

/**
 * Mettre à jour le statut d'une livraison.
 */
const updateDeliveryStatus = catchAsync(async (req, res) => {
  logger.info(`Mise à jour du statut de la livraison : DeliveryID=${req.params.deliveryId}`);
  const updatedDelivery = await trackPerformance(
    () => livreurService.updateDeliveryStatus(req.user.id, req.params.deliveryId, req.body),
    'updateDeliveryStatus'
  );
  logger.info(`Statut de la livraison mis à jour avec succès : DeliveryID=${req.params.deliveryId}`);
  res.status(httpStatus.OK).send(updatedDelivery);
});

/**
 * Calculer les gains totaux du livreur.
 */
const calculateEarnings = catchAsync(async (req, res) => {
  logger.info(`Calcul des gains pour le livreur : ID=${req.user.id}`);
  const earnings = await trackPerformance(() => livreurService.calculateEarnings(req.user.id), 'calculateEarnings');
  logger.info(`Gains totaux calculés : Total=${earnings.total}€`);
  res.status(httpStatus.OK).send(earnings);
});

/**
 * Mettre à jour la disponibilité du livreur.
 */
const setAvailability = catchAsync(async (req, res) => {
  logger.info(`Mise à jour de la disponibilité pour le livreur : ID=${req.user.id}`);
  const updatedLivreur = await trackPerformance(
    () => livreurService.setAvailability(req.user.id, req.body.isAvailable),
    'setAvailability'
  );
  logger.info(`Disponibilité mise à jour : Disponible=${updatedLivreur.isAvailable}`);
  res.status(httpStatus.OK).send(updatedLivreur);
});

/**
 * Mettre à jour la localisation du livreur.
 */
const updateLocation = catchAsync(async (req, res) => {
  logger.info(`Mise à jour de la localisation pour le livreur : ID=${req.user.id}`);
  const updatedLivreur = await trackPerformance(
    () => livreurService.updateLocation(req.user.id, req.body.coordinates),
    'updateLocation'
  );
  logger.info(
    `Localisation mise à jour : Latitude=${req.body.coordinates.latitude}, Longitude=${req.body.coordinates.longitude}`
  );
  res.status(httpStatus.OK).send(updatedLivreur);
});

/**
 * Évaluer un client.
 */
const rateClient = catchAsync(async (req, res) => {
  logger.info(`Évaluation d'un client par le livreur : ID=${req.user.id}`);
  const rating = await trackPerformance(
    () => livreurService.rateClient(req.user.id, req.body.clientId, req.body.rating, req.body.comment),
    'rateClient'
  );
  logger.info(`Évaluation ajoutée avec succès : RatingID=${rating.id}`);
  res.status(httpStatus.CREATED).send(rating);
});

/**
 * Obtenir l'historique des livraisons.
 */
const getDeliveryHistory = catchAsync(async (req, res) => {
  logger.info(`Récupération de l'historique des livraisons pour le livreur : ID=${req.user.id}`);
  const history = await trackPerformance(() => livreurService.getDeliveryHistory(req.user.id), 'getDeliveryHistory');
  logger.info(`Historique des livraisons récupéré : Total=${history.length}`);
  res.status(httpStatus.OK).send(history);
});

module.exports = {
  getAvailableDeliveries,
  acceptDelivery,
  getAssignedDeliveries,
  updateDeliveryStatus,
  calculateEarnings,
  setAvailability,
  updateLocation,
  rateClient,
  getDeliveryHistory,
};
