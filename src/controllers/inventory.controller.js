const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { inventoryService, notificationService } = require('../services');
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
 * Ajouter un produit à l'inventaire.
 */
const addProductToInventory = catchAsync(async (req, res) => {
  logger.info(`Tentative d'ajout d'un produit à l'inventaire : MerchantID=${req.user.id}`);
  const product = await trackPerformance(() => inventoryService.addProduct(req.user.id, req.body), 'addProductToInventory');

  // Notification pour l'ajout du produit
  await notificationService.notifyMerchant(
    req.user.id,
    `Nouveau produit ajouté à votre inventaire : ProductID=${product.id}, Nom=${product.name}`
  );

  logger.info(`Produit ajouté avec succès à l'inventaire : ProductID=${product.id}`);
  res.status(httpStatus.CREATED).send(product);
});

/**
 * Mettre à jour un produit dans l'inventaire.
 */
const updateInventoryProduct = catchAsync(async (req, res) => {
  logger.info(
    `Tentative de mise à jour du produit : ProductID=${req.params.productId} pour le commerçant : MerchantID=${req.user.id}`
  );

  // Validation contextuelle
  const isAuthorized = await inventoryService.isAuthorized(req.user.id, req.params.productId);
  if (!isAuthorized) {
    logger.warn(`Accès non autorisé pour la mise à jour du produit : ProductID=${req.params.productId}`);
    throw new ApiError(httpStatus.FORBIDDEN, 'Access denied for this product');
  }

  const updatedProduct = await trackPerformance(
    () => inventoryService.updateProduct(req.user.id, req.params.productId, req.body),
    'updateInventoryProduct'
  );

  // Notification pour la mise à jour
  await notificationService.notifyMerchant(
    req.user.id,
    `Le produit a été mis à jour avec succès : ProductID=${updatedProduct.id}, Nom=${updatedProduct.name}`
  );

  logger.info(`Produit mis à jour avec succès : ProductID=${req.params.productId}`);
  res.status(httpStatus.OK).send(updatedProduct);
});

/**
 * Mettre à jour le stock d’un produit.
 */
const updateProductStock = catchAsync(async (req, res) => {
  logger.info(
    `Mise à jour du stock pour le produit : ProductID=${req.params.productId}, MerchantID=${req.user.id}, NewQuantity=${req.body.quantity}`
  );
  const updatedStock = await trackPerformance(
    () => inventoryService.updateStock(req.user.id, req.params.productId, req.body.quantity),
    'updateProductStock'
  );

  // Vérifier si le stock atteint un seuil bas
  if (updatedStock.quantity < updatedStock.lowStockThreshold) {
    await notificationService.notifyMerchant(
      req.user.id,
      `Attention : Le stock pour le produit ProductID=${updatedStock.id}, Nom=${updatedStock.name} est bas.`
    );
    logger.info(`[ALERTE STOCK FAIBLE] Produit=${updatedStock.name}, Stock=${updatedStock.quantity}`);
  }

  logger.info(`Stock mis à jour avec succès : ProductID=${req.params.productId}, Quantity=${updatedStock.quantity}`);
  res.status(httpStatus.OK).send(updatedStock);
});

/**
 * Supprimer un produit de l'inventaire.
 */
const deleteProductFromInventory = catchAsync(async (req, res) => {
  logger.info(
    `Tentative de suppression du produit : ProductID=${req.params.productId} de l'inventaire, MerchantID=${req.user.id}`
  );

  // Validation contextuelle
  const isAuthorized = await inventoryService.isAuthorized(req.user.id, req.params.productId);
  if (!isAuthorized) {
    logger.warn(`Accès non autorisé pour la suppression du produit : ProductID=${req.params.productId}`);
    throw new ApiError(httpStatus.FORBIDDEN, 'Access denied for this product');
  }

  const deletedProduct = await trackPerformance(
    () => inventoryService.deleteProduct(req.user.id, req.params.productId),
    'deleteProductFromInventory'
  );

  // Notification pour la suppression
  await notificationService.notifyMerchant(
    req.user.id,
    `Le produit a été supprimé de votre inventaire : ProductID=${deletedProduct.id}, Nom=${deletedProduct.name}`
  );

  logger.info(`Produit supprimé avec succès de l'inventaire : ProductID=${req.params.productId}`);
  res.status(httpStatus.OK).send(deletedProduct);
});

/**
 * Obtenir l'inventaire complet avec filtres et pagination.
 */
const getInventory = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, category, minStock } = req.query;
  logger.info(`Récupération de l'inventaire pour le commerçant : MerchantID=${req.user.id}`);
  const inventory = await trackPerformance(
    () =>
      inventoryService.getInventory(req.user.id, {
        page,
        limit,
        category,
        minStock,
      }),
    'getInventory'
  );
  logger.info(`Inventaire récupéré avec succès : TotalItems=${inventory.totalResults}`);
  res.status(httpStatus.OK).send(inventory);
});

/**
 * Obtenir des statistiques d'inventaire enrichies.
 */
const getInventoryStats = catchAsync(async (req, res) => {
  logger.info(`Récupération des statistiques d'inventaire pour le commerçant : MerchantID=${req.user.id}`);
  const stats = await trackPerformance(() => inventoryService.getInventoryStats(req.user.id), 'getInventoryStats');
  logger.info(`Statistiques d'inventaire récupérées avec succès`);
  res.status(httpStatus.OK).send(stats);
});

module.exports = {
  addProductToInventory,
  updateInventoryProduct,
  updateProductStock,
  deleteProductFromInventory,
  getInventory,
  getInventoryStats,
};
