const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { promotionService, notificationService } = require('../services');
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
 * Créer une promotion.
 */
const createPromotion = catchAsync(async (req, res) => {
  logger.info(`[REQUEST] Création d'une promotion pour MerchantID=${req.user.id}, IP=${req.ip}`);
  const promotion = await trackPerformance(() => promotionService.createPromotion(req.user.id, req.body), 'createPromotion');

  // Notification de succès
  await notificationService.notifyMerchant(req.user.id, `Promotion "${promotion.code}" créée avec succès.`);

  logger.info(`[SUCCESS] Promotion créée : PromotionID=${promotion.id}`);
  res.status(httpStatus.CREATED).send(promotion);
});

/**
 * Mettre à jour une promotion.
 */
const updatePromotion = catchAsync(async (req, res) => {
  logger.info(`[REQUEST] Mise à jour de la promotion PromotionID=${req.params.promotionId} pour MerchantID=${req.user.id}`);
  const updatedPromotion = await trackPerformance(
    () => promotionService.updatePromotion(req.user.id, req.params.promotionId, req.body),
    'updatePromotion'
  );

  logger.info(`[SUCCESS] Promotion mise à jour : PromotionID=${req.params.promotionId}`);
  res.status(httpStatus.OK).send(updatedPromotion);
});

/**
 * Désactiver une promotion.
 */
const deactivatePromotion = catchAsync(async (req, res) => {
  logger.info(`[REQUEST] Désactivation de la promotion PromotionID=${req.params.promotionId} par MerchantID=${req.user.id}`);
  const promotion = await trackPerformance(
    () => promotionService.togglePromotionStatus(req.params.promotionId, false),
    'deactivatePromotion'
  );

  logger.info(`[SUCCESS] Promotion désactivée : PromotionID=${req.params.promotionId}`);
  res.status(httpStatus.OK).send(promotion);
});

/**
 * Activer une promotion.
 */
const activatePromotion = catchAsync(async (req, res) => {
  logger.info(`[REQUEST] Activation de la promotion PromotionID=${req.params.promotionId} par MerchantID=${req.user.id}`);
  const promotion = await trackPerformance(
    () => promotionService.togglePromotionStatus(req.params.promotionId, true),
    'activatePromotion'
  );

  logger.info(`[SUCCESS] Promotion activée : PromotionID=${req.params.promotionId}`);
  res.status(httpStatus.OK).send(promotion);
});

/**
 * Supprimer une promotion.
 */
const deletePromotion = catchAsync(async (req, res) => {
  logger.info(`[REQUEST] Suppression de la promotion PromotionID=${req.params.promotionId} par MerchantID=${req.user.id}`);
  await trackPerformance(() => promotionService.deletePromotion(req.params.promotionId), 'deletePromotion');

  logger.info(`[SUCCESS] Promotion supprimée : PromotionID=${req.params.promotionId}`);
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Récupérer les promotions actives avec filtres avancés.
 */
const getActivePromotions = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc', region, product } = req.query;

  logger.info(
    `[REQUEST] Récupération des promotions actives avec filtres avancés pour MerchantID=${req.user.id}, Region=${region}, Product=${product}`
  );

  const promotions = await promotionService.getActivePromotions(req.user.id, {
    page,
    limit,
    sortBy,
    order,
    region,
    product,
  });

  logger.info(`[SUCCESS] Promotions actives récupérées avec succès : Total=${promotions.results.length}`);
  res.status(httpStatus.OK).send(promotions);
});

/**
 * Récupérer l'historique des promotions avec filtres avancés.
 */
const getPromotionHistory = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc', region, product } = req.query;

  logger.info(
    `[REQUEST] Récupération de l'historique des promotions avec filtres avancés pour MerchantID=${req.user.id}, Region=${region}, Product=${product}`
  );

  const promotions = await promotionService.getPromotionHistory(req.user.id, {
    page,
    limit,
    sortBy,
    order,
    region,
    product,
  });

  logger.info(`[SUCCESS] Historique des promotions récupéré avec succès : Total=${promotions.results.length}`);
  res.status(httpStatus.OK).send(promotions);
});

/**
 * Récupérer des statistiques avancées pour une promotion spécifique.
 */
const getPromotionStats = catchAsync(async (req, res) => {
  logger.info(`[REQUEST] Récupération des statistiques pour PromotionID=${req.params.promotionId}`);
  const stats = await trackPerformance(
    () => promotionService.getPromotionStats(req.params.promotionId),
    'getPromotionStats'
  );

  logger.info(`[SUCCESS] Statistiques récupérées pour PromotionID=${req.params.promotionId}`);
  res.status(httpStatus.OK).send(stats);
});

/**
 * Récupérer des statistiques globales pour un marchand.
 */
const getGlobalPromotionStats = catchAsync(async (req, res) => {
  logger.info(`[REQUEST] Récupération des statistiques globales des promotions pour MerchantID=${req.user.id}`);
  const stats = await trackPerformance(
    () => promotionService.getGlobalPromotionStats(req.user.id),
    'getGlobalPromotionStats'
  );

  logger.info(`[SUCCESS] Statistiques globales récupérées pour MerchantID=${req.user.id}`);
  res.status(httpStatus.OK).send(stats);
});

module.exports = {
  createPromotion,
  updatePromotion,
  deactivatePromotion,
  activatePromotion,
  deletePromotion,
  getActivePromotions,
  getPromotionHistory,
  getPromotionStats,
  getGlobalPromotionStats, // Ajout de la méthode pour statistiques globales
};
