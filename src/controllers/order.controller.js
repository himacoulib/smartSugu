const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { orderService, notificationService } = require('../services');
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
 * Créer une commande.
 */
const createOrder = catchAsync(async (req, res) => {
  logger.info(`Création d'une commande pour le client : ID=${req.user.id}`);
  const order = await trackPerformance(() => orderService.createOrder(req.user.id, req.body), 'createOrder');

  // Notifier le commerçant de la nouvelle commande
  await notificationService.notifyMerchant(order.merchant, `Nouvelle commande reçue : OrderID=${order.id}`);
  logger.info(`Commande créée avec succès : OrderID=${order.id}`);
  res.status(httpStatus.CREATED).send(order);
});

/**
 * Obtenir une commande par ID.
 */
const getOrderById = catchAsync(async (req, res) => {
  logger.info(`Récupération de la commande : ID=${req.params.orderId}`);
  const order = await trackPerformance(() => orderService.getOrderById(req.params.orderId), 'getOrderById');
  if (!order) {
    logger.warn(`Commande non trouvée : ID=${req.params.orderId}`);
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
  }
  logger.info(`Commande récupérée avec succès : ID=${order.id}`);
  res.status(httpStatus.OK).send(order);
});

/**
 * Mettre à jour le statut d'une commande.
 */
const updateOrderStatus = catchAsync(async (req, res) => {
  logger.info(`Mise à jour du statut de la commande : OrderID=${req.params.orderId}`);

  const currentStatus = await orderService.getOrderStatus(req.params.orderId);
  if (currentStatus === 'completed' || currentStatus === 'cancelled') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update status for completed or cancelled orders');
  }

  const updatedOrder = await trackPerformance(
    () => orderService.updateOrderStatus(req.params.orderId, req.body.status),
    'updateOrderStatus'
  );

  await notificationService.notifyClient(
    updatedOrder.client,
    `Votre commande : OrderID=${req.params.orderId} est maintenant ${req.body.status}`
  );

  logger.info(`Statut de la commande mis à jour : OrderID=${req.params.orderId}, NewStatus=${req.body.status}`);
  res.status(httpStatus.OK).send(updatedOrder);
});

/**
 * Annuler une commande.
 */
const cancelOrder = catchAsync(async (req, res) => {
  logger.info(`Annulation de la commande : OrderID=${req.params.orderId}`);
  const cancelledOrder = await trackPerformance(() => orderService.cancelOrder(req.params.orderId), 'cancelOrder');

  if (cancelledOrder.paymentStatus === 'paid') {
    await orderService.initiateRefund(cancelledOrder.id);
    logger.info(`Remboursement initié pour la commande annulée : OrderID=${req.params.orderId}`);
  }

  logger.info(`Commande annulée avec succès : OrderID=${req.params.orderId}`);
  res.status(httpStatus.OK).send(cancelledOrder);
});

/**
 * Récupérer les commandes disponibles pour un livreur dans sa zone géographique.
 */
const getAvailableOrdersForLivreur = catchAsync(async (req, res) => {
  logger.info(`Récupération des commandes disponibles pour le livreur : ID=${req.user.id}`);

  const { latitude, longitude } = req.user.location;
  if (!latitude || !longitude) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Location information is required');
  }

  const availableOrders = await trackPerformance(
    () => orderService.getAvailableOrders(latitude, longitude),
    'getAvailableOrdersForLivreur'
  );

  availableOrders.sort((a, b) => a.distance - b.distance);

  logger.info(`Commandes disponibles triées par proximité : Total=${availableOrders.length}`);
  res.status(httpStatus.OK).send({
    orders: availableOrders,
    meta: {
      totalOrders: availableOrders.length,
      updatedAt: new Date().toISOString(),
    },
  });
});

/**
 * Permettre au livreur de prendre en charge une commande.
 */
const assignOrderToLivreur = catchAsync(async (req, res) => {
  logger.info(
    `Tentative de prise en charge de la commande : OrderID=${req.params.orderId} par le livreur : ID=${req.user.id}`
  );

  const isAvailable = await orderService.isOrderAvailable(req.params.orderId);
  if (!isAvailable) {
    logger.warn(`Commande non disponible : OrderID=${req.params.orderId}`);
    throw new ApiError(httpStatus.CONFLICT, 'Order is no longer available');
  }

  const assignedOrder = await trackPerformance(
    () => orderService.assignOrderToLivreur(req.params.orderId, req.user.id),
    'assignOrderToLivreur'
  );

  logger.info(`Commande prise en charge avec succès : OrderID=${req.params.orderId} par le livreur : ID=${req.user.id}`);
  res.status(httpStatus.OK).send(assignedOrder);
});

/**
 * Récupérer l'historique des commandes d'un client.
 */
const getClientOrders = catchAsync(async (req, res) => {
  logger.info(`Récupération des commandes pour le client : ID=${req.user.id}`);
  const orders = await trackPerformance(() => orderService.getClientOrders(req.user.id), 'getClientOrders');
  logger.info(`Commandes récupérées : Total=${orders.length}`);
  res.status(httpStatus.OK).send(orders);
});

/**
 * Obtenir les commandes en attente pour un commerçant.
 */
const getMerchantPendingOrders = catchAsync(async (req, res) => {
  logger.info(`Récupération des commandes en attente pour le commerçant : ID=${req.user.id}`);
  const pendingOrders = await trackPerformance(
    () => orderService.getMerchantPendingOrders(req.user.id),
    'getMerchantPendingOrders'
  );
  logger.info(`Commandes en attente récupérées : Total=${pendingOrders.length}`);
  res.status(httpStatus.OK).send(pendingOrders);
});

/**
 * Générer un reçu pour une commande.
 */
const generateOrderReceipt = catchAsync(async (req, res) => {
  logger.info(`Génération d'un reçu pour la commande : ID=${req.params.orderId}`);
  const receipt = await trackPerformance(() => orderService.generateReceipt(req.params.orderId), 'generateOrderReceipt');
  logger.info(`Reçu généré avec succès pour la commande : ID=${req.params.orderId}`);
  res.status(httpStatus.OK).send(receipt);
});

/**
 * Calculer le total d'une commande.
 */
const calculateOrderTotal = catchAsync(async (req, res) => {
  logger.info(`Calcul du total pour la commande en cours de création`);
  const total = await trackPerformance(() => orderService.calculateOrderTotal(req.body.products), 'calculateOrderTotal');
  logger.info(`Total calculé avec succès : Total=${total}`);
  res.status(httpStatus.OK).send({ total });
});

/**
 * Récupérer l'historique des commandes.
 */
const getOrderHistory = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  logger.info(`Récupération de l'historique des commandes pour l'utilisateur : ID=${req.user.id}`);
  const history = await trackPerformance(
    () => orderService.getOrderHistory(req.user.id, { page, limit }),
    'getOrderHistory'
  );
  logger.info(`Historique des commandes récupéré : Total=${history.totalResults}`);
  res.status(httpStatus.OK).send(history);
});

/**
 * Ajouter une note ou un commentaire à une commande.
 */
const addOrderNote = catchAsync(async (req, res) => {
  logger.info(`Ajout d'une note pour la commande : ID=${req.params.orderId}`);
  const updatedOrder = await trackPerformance(
    () => orderService.addOrderNote(req.params.orderId, req.body.note),
    'addOrderNote'
  );
  logger.info(`Note ajoutée avec succès à la commande : ID=${req.params.orderId}`);
  res.status(httpStatus.OK).send(updatedOrder);
});

module.exports = {
  createOrder,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getAvailableOrdersForLivreur, // Nouvelle méthode
  assignOrderToLivreur, // Nouvelle méthode
  getClientOrders,
  getMerchantPendingOrders,
  generateOrderReceipt,
  calculateOrderTotal,
  getOrderHistory,
  addOrderNote,
};
