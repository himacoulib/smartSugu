const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { reviewService, notificationService } = require('../services');
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
 * Ajouter une évaluation.
 */
const addReview = catchAsync(async (req, res) => {
  logger.info(`Ajout d'une évaluation pour le produit : ProductID=${req.body.productId}, UserID=${req.user.id}`);

  // Vérification d'éligibilité
  const isEligible = await reviewService.checkEligibility(req.user.id, req.body.productId);
  if (!isEligible) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Vous ne pouvez évaluer ce produit.');
  }

  const review = await trackPerformance(() => reviewService.addReview(req.user.id, req.body), 'addReview');

  // Notification au commerçant associé au produit
  await notificationService.notifyMerchant(
    review.merchant,
    `Un client a ajouté une nouvelle évaluation pour votre produit : ProductID=${req.body.productId}`
  );

  logger.info(`Évaluation ajoutée avec succès : ReviewID=${review.id}`);
  res.status(httpStatus.CREATED).send(review);
});

/**
 * Mettre à jour une évaluation.
 */
const updateReview = catchAsync(async (req, res) => {
  logger.info(`Mise à jour de l'évaluation : ReviewID=${req.params.reviewId}, UserID=${req.user.id}`);
  const updatedReview = await trackPerformance(
    () => reviewService.updateReview(req.user.id, req.params.reviewId, req.body),
    'updateReview'
  );

  // Notification au commerçant en cas de mise à jour
  await notificationService.notifyMerchant(
    updatedReview.merchant,
    `Une évaluation pour votre produit a été mise à jour : ProductID=${updatedReview.product}`
  );

  logger.info(`Évaluation mise à jour avec succès : ReviewID=${req.params.reviewId}`);
  res.status(httpStatus.OK).send(updatedReview);
});

/**
 * Supprimer une évaluation.
 */
const deleteReview = catchAsync(async (req, res) => {
  logger.info(`Suppression de l'évaluation : ReviewID=${req.params.reviewId}, UserID=${req.user.id}`);
  const deletedReview = await trackPerformance(
    () => reviewService.deleteReview(req.user.id, req.params.reviewId),
    'deleteReview'
  );

  // Notification au commerçant en cas de suppression
  await notificationService.notifyMerchant(
    deletedReview.merchant,
    `Une évaluation pour votre produit a été supprimée : ProductID=${deletedReview.product}`
  );

  logger.info(`Évaluation supprimée avec succès : ReviewID=${req.params.reviewId}`);
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Obtenir les évaluations pour un produit avec pagination et tri.
 */
const getReviewsForProduct = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;
  logger.info(`Récupération des évaluations pour le produit : ProductID=${req.params.productId}`);

  const reviews = await trackPerformance(
    () => reviewService.getReviewsForProduct(req.params.productId, { page, limit, sortBy, order }),
    'getReviewsForProduct'
  );

  logger.info(`Évaluations récupérées avec succès : Total=${reviews.results.length}, ProductID=${req.params.productId}`);
  res.status(httpStatus.OK).send(reviews);
});

/**
 * Obtenir les évaluations pour un marchand avec pagination et tri.
 */
const getMerchantReviews = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;
  logger.info(`Récupération des évaluations pour le marchand : MerchantID=${req.user.id}`);

  const reviews = await trackPerformance(
    () => reviewService.getMerchantReviews(req.user.id, { page, limit, sortBy, order }),
    'getMerchantReviews'
  );

  logger.info(`Évaluations récupérées pour le marchand : Total=${reviews.results.length}, MerchantID=${req.user.id}`);
  res.status(httpStatus.OK).send(reviews);
});

/**
 * Obtenir les statistiques des évaluations pour un marchand.
 */
const getReviewStats = catchAsync(async (req, res) => {
  logger.info(`Récupération des statistiques d'évaluations pour le marchand : MerchantID=${req.user.id}`);

  const stats = await trackPerformance(() => reviewService.getReviewStats(req.user.id), 'getReviewStats');

  logger.info(`Statistiques des évaluations récupérées avec succès : MerchantID=${req.user.id}`);
  res.status(httpStatus.OK).send(stats);
});
/**
 * Obtenir les mots-clés les plus fréquents pour un marchand.
 */
const getTopKeywords = catchAsync(async (req, res) => {
  logger.info(`Récupération des mots-clés pour le marchand : MerchantID=${req.user.id}`);

  const keywords = await reviewService.getTopKeywords(req.user.id);

  logger.info(`Mots-clés les plus fréquents récupérés : Total=${keywords.length}`);
  res.status(httpStatus.OK).send({ keywords });
});

/**
 * Récupérer les statistiques périodiques pour un marchand.
 */
const getPeriodicStats = catchAsync(async (req, res) => {
  logger.info(`Récupération des statistiques périodiques pour le marchand : MerchantID=${req.user.id}`);

  const stats = await reviewService.getPeriodicStats(req.user.id);

  logger.info(`Statistiques périodiques récupérées avec succès.`);
  res.status(httpStatus.OK).send(stats);
});

module.exports = {
  addReview,
  updateReview,
  deleteReview,
  getReviewsForProduct,
  getMerchantReviews,
  getReviewStats,
  getTopKeywords,
  getPeriodicStats,
};
