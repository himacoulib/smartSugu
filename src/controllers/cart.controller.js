const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { cartService, notificationService, productService } = require('../services');
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
 * Ajouter un produit au panier.
 */
const addToCart = catchAsync(async (req, res) => {
  logger.info(`Ajout d'un produit au panier pour l'utilisateur : UserID=${req.user.id}`);

  // Vérifier la disponibilité du produit
  const isAvailable = await productService.checkAvailability(req.body.productId, req.body.quantity);
  if (!isAvailable) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Le produit demandé n’est pas disponible en quantité suffisante.');
  }

  const updatedCart = await trackPerformance(() => cartService.addToCart(req.user.id, req.body), 'addToCart');

  // Notification de succès
  await notificationService.notifyUser(req.user.id, `Produit ajouté au panier : ${req.body.productId}`);
  logger.info(`Produit ajouté au panier avec succès : UserID=${req.user.id}, CartID=${updatedCart.id}`);
  res.status(httpStatus.OK).send(updatedCart);
});

/**
 * Mettre à jour la quantité d'un produit dans le panier.
 */
const updateCartItem = catchAsync(async (req, res) => {
  logger.info(
    `Mise à jour de la quantité pour le produit : ProductID=${req.params.productId} dans le panier de l'utilisateur : UserID=${req.user.id}`
  );

  // Vérifier la disponibilité du produit
  const isAvailable = await productService.checkAvailability(req.params.productId, req.body.quantity);
  if (!isAvailable) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Le produit demandé n’est pas disponible en quantité suffisante.');
  }

  const updatedCart = await trackPerformance(
    () => cartService.updateCartItem(req.user.id, req.params.productId, req.body.quantity),
    'updateCartItem'
  );

  // Notification de mise à jour
  await notificationService.notifyUser(req.user.id, `Quantité mise à jour pour le produit : ${req.params.productId}`);
  logger.info(`Quantité mise à jour avec succès : ProductID=${req.params.productId}, NewQuantity=${req.body.quantity}`);
  res.status(httpStatus.OK).send(updatedCart);
});

/**
 * Supprimer un produit du panier.
 */
const removeFromCart = catchAsync(async (req, res) => {
  logger.info(
    `Suppression du produit : ProductID=${req.params.productId} du panier de l'utilisateur : UserID=${req.user.id}`
  );
  const updatedCart = await trackPerformance(
    () => cartService.removeFromCart(req.user.id, req.params.productId),
    'removeFromCart'
  );

  // Notification de suppression
  await notificationService.notifyUser(req.user.id, `Produit retiré du panier : ${req.params.productId}`);
  logger.info(`Produit supprimé avec succès du panier : ProductID=${req.params.productId}`);
  res.status(httpStatus.OK).send(updatedCart);
});

/**
 * Obtenir les détails du panier pour l'utilisateur.
 */
const getCartDetails = catchAsync(async (req, res) => {
  logger.info(`Récupération des détails du panier pour l'utilisateur : UserID=${req.user.id}`);
  const cart = await trackPerformance(() => cartService.getCartDetails(req.user.id), 'getCartDetails');
  logger.info(`Détails du panier récupérés avec succès pour l'utilisateur : UserID=${req.user.id}`);
  res.status(httpStatus.OK).send(cart);
});

/**
 * Vider le panier après la création d'une commande.
 */
const clearCart = catchAsync(async (req, res) => {
  logger.info(`Vidage du panier pour l'utilisateur : UserID=${req.user.id}`);
  const clearedCart = await trackPerformance(() => cartService.clearCart(req.user.id), 'clearCart');
  logger.info(`Panier vidé avec succès pour l'utilisateur : UserID=${req.user.id}`);
  res.status(httpStatus.OK).send(clearedCart);
});

module.exports = {
  addToCart,
  updateCartItem,
  removeFromCart,
  getCartDetails,
  clearCart,
};
