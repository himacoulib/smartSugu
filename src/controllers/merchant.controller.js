const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { merchantService } = require('../services');
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
 * Ajouter un produit pour un commerçant.
 */
const addProduct = catchAsync(async (req, res) => {
  logger.info(`Tentative d'ajout de produit pour le commerçant : ID=${req.user.id}`);

  if (req.body.stock < 0) {
    logger.warn(`Stock invalide pour le produit : Stock=${req.body.stock}`);
    throw new ApiError(httpStatus.BAD_REQUEST, 'Stock cannot be negative');
  }

  const product = await trackPerformance(() => merchantService.addProduct(req.user.id, req.body), 'addProduct');
  logger.info(`Produit ajouté avec succès : ProductID=${product.id}`);
  res.status(httpStatus.CREATED).send(product);
});

/**
 * Désactiver un produit temporairement.
 */
const deactivateProduct = catchAsync(async (req, res) => {
  logger.info(
    `Désactivation temporaire du produit : ProductID=${req.params.productId} par le commerçant : ID=${req.user.id}`
  );
  const deactivatedProduct = await trackPerformance(
    () => merchantService.deactivateProduct(req.user.id, req.params.productId),
    'deactivateProduct'
  );
  logger.info(`Produit désactivé avec succès : ProductID=${req.params.productId}`);
  res.status(httpStatus.OK).send(deactivatedProduct);
});

/**
 * Mettre à jour un produit.
 */
const updateProduct = catchAsync(async (req, res) => {
  logger.info(`Mise à jour du produit : ProductID=${req.params.productId} par le commerçant : ID=${req.user.id}`);
  const updatedProduct = await trackPerformance(
    () => merchantService.updateProduct(req.user.id, req.params.productId, req.body),
    'updateProduct'
  );
  logger.info(`Produit mis à jour avec succès : ProductID=${req.params.productId}`);
  res.status(httpStatus.OK).send(updatedProduct);
});

/**
 * Supprimer un produit.
 */
const deleteProduct = catchAsync(async (req, res) => {
  logger.info(`Suppression du produit : ProductID=${req.params.productId} par le commerçant : ID=${req.user.id}`);
  const deletedProduct = await trackPerformance(
    () => merchantService.deleteProduct(req.user.id, req.params.productId),
    'deleteProduct'
  );
  logger.info(`Produit supprimé avec succès : ProductID=${req.params.productId}`);
  res.status(httpStatus.OK).send(deletedProduct);
});

/**
 * Obtenir les commandes en cours.
 */
const getPendingOrders = catchAsync(async (req, res) => {
  logger.info(`Récupération des commandes en cours pour le commerçant : ID=${req.user.id}`);
  const orders = await trackPerformance(() => merchantService.getPendingOrders(req.user.id), 'getPendingOrders');

  if (orders.length > 0) {
    logger.info(`[NOTIFICATION] ${orders.length} commandes en attente pour le commerçant : ID=${req.user.id}`);
  }

  res.status(httpStatus.OK).send(orders);
});

/**
 * Traiter une commande.
 */
const processOrder = catchAsync(async (req, res) => {
  logger.info(`Traitement de la commande : OrderID=${req.params.orderId} par le commerçant : ID=${req.user.id}`);
  const processedOrder = await trackPerformance(
    () => merchantService.processOrder(req.user.id, req.params.orderId, req.body),
    'processOrder'
  );
  logger.info(`Commande traitée avec succès : OrderID=${req.params.orderId}`);
  res.status(httpStatus.OK).send(processedOrder);
});

/**
 * Obtenir l'historique des commandes.
 */
const getOrderHistory = catchAsync(async (req, res) => {
  logger.info(`Récupération de l'historique des commandes pour le commerçant : ID=${req.user.id}`);
  const orders = await trackPerformance(() => merchantService.getOrderHistory(req.user.id), 'getOrderHistory');
  logger.info(`Historique des commandes récupéré : Total=${orders.length}`);
  res.status(httpStatus.OK).send(orders);
});

/**
 * Mettre à jour le stock d'un produit.
 */
const updateStock = catchAsync(async (req, res) => {
  logger.info(
    `Mise à jour du stock pour le produit : ProductID=${req.params.productId} par le commerçant : ID=${req.user.id}`
  );
  const updatedStock = await trackPerformance(
    () => merchantService.updateStock(req.user.id, req.params.productId, req.body.quantity),
    'updateStock'
  );
  logger.info(`Stock mis à jour avec succès : ProductID=${req.params.productId}`);
  res.status(httpStatus.OK).send(updatedStock);
});

/**
 * Obtenir les statistiques d'inventaire.
 */
const getInventoryStats = catchAsync(async (req, res) => {
  logger.info(`Récupération des statistiques d'inventaire pour le commerçant : ID=${req.user.id}`);
  const stats = await trackPerformance(() => merchantService.getInventoryStats(req.user.id), 'getInventoryStats');
  logger.info(`Statistiques d'inventaire récupérées avec succès`);
  res.status(httpStatus.OK).send(stats);
});

/**
 * Créer une promotion.
 */
const createPromotion = catchAsync(async (req, res) => {
  logger.info(`Création d'une promotion pour le commerçant : ID=${req.user.id}`);
  const promotion = await trackPerformance(() => merchantService.createPromotion(req.user.id, req.body), 'createPromotion');
  logger.info(`Promotion créée avec succès : PromotionID=${promotion.id}`);
  res.status(httpStatus.CREATED).send(promotion);
});

/**
 * Obtenir les statistiques des ventes.
 */
const getSalesStats = catchAsync(async (req, res) => {
  logger.info(`Récupération des statistiques des ventes pour le commerçant : ID=${req.user.id}`);
  const stats = await trackPerformance(() => merchantService.getSalesStats(req.user.id), 'getSalesStats');
  logger.info(`Statistiques des ventes récupérées avec succès`);
  res.status(httpStatus.OK).send(stats);
});

/**
 * Obtenir les revenus d’un commerçant.
 */
const getRevenues = catchAsync(async (req, res) => {
  logger.info(`Récupération des revenus pour le commerçant : ID=${req.user.id}`);
  const revenues = await trackPerformance(() => merchantService.getRevenues(req.user.id, req.query), 'getRevenues');
  logger.info(`Revenus récupérés avec succès pour le commerçant : ID=${req.user.id}`);
  res.status(httpStatus.OK).send(revenues);
});

/**
 * Obtenir l’historique des transactions financières.
 */
const getTransactionHistory = catchAsync(async (req, res) => {
  logger.info(`Récupération de l'historique des transactions pour le commerçant : ID=${req.user.id}`);
  const transactions = await trackPerformance(
    () => merchantService.getTransactionHistory(req.user.id),
    'getTransactionHistory'
  );
  logger.info(`Historique des transactions récupéré avec succès`);
  res.status(httpStatus.OK).send(transactions);
});

/**
 * Générer un rapport financier.
 */
const generateFinancialReport = catchAsync(async (req, res) => {
  logger.info(`Génération d'un rapport financier pour le commerçant : ID=${req.user.id}`);
  const report = await trackPerformance(
    () => merchantService.generateFinancialReport(req.user.id, req.body),
    'generateFinancialReport'
  );
  logger.info(`Rapport financier généré avec succès`);
  res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);
  res.status(httpStatus.OK).send(report.fileContent);
});

/**
 * Obtenir le tableau de bord en temps réel.
 */
const getRealTimeDashboard = catchAsync(async (req, res) => {
  logger.info(`Récupération du tableau de bord en temps réel pour le commerçant : ID=${req.user.id}`);
  const dashboard = await trackPerformance(() => merchantService.getRealTimeDashboard(req.user.id), 'getRealTimeDashboard');
  logger.info(`Tableau de bord récupéré avec succès`);
  res.status(httpStatus.OK).send(dashboard);
});

module.exports = {
  addProduct,
  deactivateProduct,
  updateProduct,
  deleteProduct,
  getPendingOrders,
  processOrder,
  getOrderHistory,
  updateStock,
  getInventoryStats,
  createPromotion,
  getSalesStats,
  getRevenues,
  getTransactionHistory,
  generateFinancialReport,
  getRealTimeDashboard,
};
