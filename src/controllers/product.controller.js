const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const ApiError = require('../utils/ApiError');
const { productService, notificationService } = require('../services');
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
 * Créer un produit.
 */
const createProduct = catchAsync(async (req, res) => {
  logger.info(`Création d'un produit pour le commerçant : MerchantID=${req.user.id}`);
  const product = await trackPerformance(() => productService.createProduct(req.user.id, req.body), 'createProduct');

  // Notification au commerçant
  await notificationService.notifyMerchant(req.user.id, `Produit créé avec succès : ${product.name}`);
  logger.info(`Produit créé avec succès : ProductID=${product.id}`);
  res.status(httpStatus.CREATED).send(product);
});

/**
 * Mettre à jour un produit.
 */
const updateProduct = catchAsync(async (req, res) => {
  logger.info(`Mise à jour du produit : ProductID=${req.params.productId}, MerchantID=${req.user.id}`);
  const updatedProduct = await trackPerformance(
    () => productService.updateProduct(req.user.id, req.params.productId, req.body),
    'updateProduct'
  );

  logger.info(`Produit mis à jour avec succès : ProductID=${req.params.productId}`);
  res.status(httpStatus.OK).send(updatedProduct);
});

/**
 * Supprimer un produit.
 */
const deleteProduct = catchAsync(async (req, res) => {
  logger.info(`Suppression du produit : ProductID=${req.params.productId}, MerchantID=${req.user.id}`);
  await trackPerformance(() => productService.deleteProduct(req.user.id, req.params.productId), 'deleteProduct');

  logger.info(`Produit supprimé avec succès : ProductID=${req.params.productId}`);
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Obtenir les détails d'un produit.
 */
const getProductDetails = catchAsync(async (req, res) => {
  logger.info(`Récupération des détails du produit : ProductID=${req.params.productId}`);
  const product = await trackPerformance(() => productService.getProductById(req.params.productId), 'getProductDetails');
  if (!product) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Produit non trouvé');
  }

  logger.info(`Détails du produit récupérés : ProductID=${req.params.productId}`);
  res.status(httpStatus.OK).send(product);
});

/**
 * Rechercher des produits avec filtres et pagination.
 */
const searchProducts = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, category, minPrice, maxPrice, search } = req.query;
  logger.info(`Recherche de produits avec les paramètres : ${JSON.stringify(req.query)}`);

  const products = await trackPerformance(
    () =>
      productService.searchProducts({
        page,
        limit,
        category,
        minPrice,
        maxPrice,
        search,
      }),
    'searchProducts'
  );

  logger.info(`Produits trouvés : Total=${products.totalResults}`);
  res.status(httpStatus.OK).send(products);
});

/**
 * Mettre à jour le stock d'un produit.
 */
const updateStock = catchAsync(async (req, res) => {
  logger.info(`Mise à jour du stock pour le produit : ProductID=${req.params.productId}, Quantité=${req.body.quantity}`);
  const updatedProduct = await trackPerformance(
    () => productService.updateStock(req.params.productId, req.body.quantity, req.body.reason),
    'updateStock'
  );

  logger.info(`Stock mis à jour avec succès : ProductID=${req.params.productId}`);
  res.status(httpStatus.OK).send(updatedProduct);
});

/**
 * Récupérer les statistiques globales des produits.
 */
const getProductStats = catchAsync(async (req, res) => {
  logger.info(`Récupération des statistiques globales des produits`);
  const stats = await trackPerformance(() => productService.getProductStats(), 'getProductStats');
  logger.info(`Statistiques globales récupérées avec succès`);
  res.status(httpStatus.OK).send(stats);
});

/**
 * Ajouter ou mettre à jour des images pour un produit.
 */
const addOrUpdateImages = catchAsync(async (req, res) => {
  logger.info(`Mise à jour des images pour le produit : ProductID=${req.params.productId}`);
  const updatedProduct = await trackPerformance(
    () => productService.addOrUpdateImages(req.params.productId, req.body.images),
    'addOrUpdateImages'
  );

  logger.info(`Images mises à jour avec succès pour le produit : ProductID=${req.params.productId}`);
  res.status(httpStatus.OK).send(updatedProduct);
});

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductDetails,
  searchProducts,
  updateStock,
  getProductStats,
  addOrUpdateImages,
};
