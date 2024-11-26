const httpStatus = require('http-status');
const Joi = require('joi');
const catchAsync = require('../utils/catchAsync');
const { clientService } = require('../services');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger'); // Import du logger

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
 * Créer un client.
 */
const createClient = catchAsync(async (req, res) => {
  logger.info(`Tentative de création d'un client par l'utilisateur : ${req.user ? req.user.email : 'Inconnu'}`);
  const client = await trackPerformance(() => clientService.createClient(req.body), 'createClient');
  logger.info(`Client créé avec succès : ID=${client.id}`);
  res.status(httpStatus.CREATED).send(client);
});

/**
 * Récupérer les informations d'un client.
 */
const getClient = catchAsync(async (req, res) => {
  logger.info(`Récupération des informations du client : ID=${req.params.clientId}`);
  const client = await trackPerformance(() => clientService.getClientById(req.params.clientId), 'getClient');
  if (!client) {
    logger.warn(`Client non trouvé : ID=${req.params.clientId}`);
    throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
  }
  logger.info(`Informations du client récupérées avec succès : ID=${client.id}`);
  res.send(client);
});

/**
 * Mettre à jour le profil d'un client.
 */
const updateProfile = catchAsync(async (req, res) => {
  logger.info(`Mise à jour du profil pour l'utilisateur : ID=${req.user.id}`);
  const updatedClient = await trackPerformance(
    () => clientService.updateClientProfile(req.user.id, req.body),
    'updateProfile'
  );
  logger.info(`Profil mis à jour avec succès pour l'utilisateur : ID=${req.user.id}`);
  res.send(updatedClient);
});

/**
 * Ajouter une nouvelle adresse.
 */
const addAddress = catchAsync(async (req, res) => {
  logger.info(`Ajout d'une adresse pour l'utilisateur : ID=${req.user.id}, IP=${req.ip}`);

  // Validation de l'adresse
  const schema = Joi.object({
    address: Joi.string().required(),
    coordinates: Joi.object({
      latitude: Joi.number().required(),
      longitude: Joi.number().required(),
    }).required(),
  });
  const { error } = schema.validate(req.body);
  if (error) throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);

  const updatedClient = await trackPerformance(() => clientService.addAddress(req.user.id, req.body), 'addAddress');
  logger.info(`Adresse ajoutée : Total=${updatedClient.addresses.length}`);
  res.status(httpStatus.OK).send(updatedClient);
});

/**
 * Mettre à jour une adresse existante.
 */
const updateAddress = catchAsync(async (req, res) => {
  logger.info(`Mise à jour de l'adresse : ID=${req.params.addressId} pour l'utilisateur : ID=${req.user.id}`);
  const updatedClient = await trackPerformance(
    () => clientService.updateAddress(req.user.id, req.params.addressId, req.body),
    'updateAddress'
  );
  logger.info(`Adresse mise à jour avec succès : ID=${req.params.addressId}`);
  res.status(httpStatus.OK).send(updatedClient);
});

/**
 * Supprimer une adresse.
 */
const deleteAddress = catchAsync(async (req, res) => {
  logger.info(`Suppression de l'adresse : ID=${req.params.addressId} pour l'utilisateur : ID=${req.user.id}`);
  const updatedClient = await trackPerformance(
    () => clientService.deleteAddress(req.user.id, req.params.addressId),
    'deleteAddress'
  );
  logger.info(`Adresse supprimée avec succès : ID=${req.params.addressId}`);
  res.status(httpStatus.OK).send({ updatedClient, totalAddresses: updatedClient.addresses.length });
});

/**
 * Passer une commande.
 */
const placeOrder = catchAsync(async (req, res) => {
  logger.info(`Passage d'une commande pour l'utilisateur : ID=${req.user.id}`);
  const order = await trackPerformance(() => clientService.placeOrder(req.user.id, req.body), 'placeOrder');
  logger.info(`Commande passée avec succès : OrderID=${order.id}`);
  res.status(httpStatus.CREATED).send(order);
});

/**
 * Annuler une commande.
 */
const cancelOrder = catchAsync(async (req, res) => {
  logger.info(`Tentative d'annulation de commande : OrderID=${req.params.orderId}`);
  const updatedOrder = await trackPerformance(
    () => clientService.cancelOrder(req.user.id, req.params.orderId),
    'cancelOrder'
  );
  logger.info(`Commande annulée avec succès : OrderID=${req.params.orderId}`);
  res.status(httpStatus.OK).send(updatedOrder);
});

/**
 * Obtenir l’historique des commandes.
 */
const getOrderHistory = catchAsync(async (req, res) => {
  const { startDate, endDate, status, sortBy = 'createdAt', order = 'desc' } = req.query;

  logger.info(
    `Récupération de l'historique des commandes : UserID=${req.user.id}, StartDate=${startDate}, EndDate=${endDate}, Status=${status}`
  );
  const orders = await trackPerformance(
    () => clientService.getOrderHistory(req.user.id, { startDate, endDate, status, sortBy, order }),
    'getOrderHistory'
  );
  res.status(httpStatus.OK).send(orders);
});

/**
 * Demander un remboursement.
 */
const requestRefund = catchAsync(async (req, res) => {
  logger.info(`Demande de remboursement : UserID=${req.user.id}, OrderID=${req.body.orderId}`);

  // Validation des entrées
  const schema = Joi.object({
    orderId: Joi.string().required(),
    reason: Joi.string().required(),
  });
  const { error } = schema.validate(req.body);
  if (error) throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);

  // Vérification d'une demande existante
  const hasRequestedRefund = await clientService.hasRequestedRefund(req.user.id, req.body.orderId);
  if (hasRequestedRefund) {
    throw new ApiError(httpStatus.CONFLICT, 'Refund already requested for this order');
  }

  const refundRequest = await trackPerformance(() => clientService.requestRefund(req.user.id, req.body), 'requestRefund');
  logger.info(`Demande de remboursement créée : RefundID=${refundRequest.id}`);
  res.status(httpStatus.CREATED).send(refundRequest);
});

/**
 * Ajouter une évaluation.
 */
const addRating = catchAsync(async (req, res) => {
  logger.info(`Ajout d'une évaluation : UserID=${req.user.id}`);

  // Validation des entrées
  const schema = Joi.object({
    orderId: Joi.string().required(),
    rating: Joi.number().min(1).max(5).required(),
    comment: Joi.string().allow(''),
  });
  const { error } = schema.validate(req.body);
  if (error) throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);

  // Vérification de l'évaluation existante
  const hasRated = await clientService.hasRated(req.user.id, req.body.orderId);
  if (hasRated) {
    throw new ApiError(httpStatus.CONFLICT, 'Rating already provided for this order');
  }

  const rating = await trackPerformance(() => clientService.addRating(req.user.id, req.body), 'addRating');
  logger.info(`Évaluation ajoutée : RatingID=${rating.id}`);
  res.status(httpStatus.CREATED).send(rating);
});
/**
 * Obtenir les évaluations.
 */
const getRatings = catchAsync(async (req, res) => {
  logger.info(`Récupération des évaluations pour l'utilisateur : ID=${req.user.id}`);
  const ratings = await trackPerformance(() => clientService.getRatings(req.user.id), 'getRatings');
  logger.info(`Évaluations récupérées avec succès : Total=${ratings.length}`);
  res.status(httpStatus.OK).send(ratings);
});

module.exports = {
  createClient,
  getClient,
  updateProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  placeOrder,
  cancelOrder,
  getOrderHistory,
  requestRefund,
  addRating,
  getRatings,
};
