const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { feedbackService, notificationService } = require('../services');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');
const Joi = require('joi'); // Ajout pour la validation des données

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
 * Validation des données d'entrée.
 */
const validateFeedbackData = (data) => {
  const schema = Joi.object({
    title: Joi.string().required(),
    description: Joi.string().required().max(500),
    rating: Joi.number().integer().min(1).max(5).required(),
  });
  const { error } = schema.validate(data);
  if (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Validation error: ${error.message}`);
  }
};

/**
 * Créer un feedback.
 */
const createFeedback = catchAsync(async (req, res) => {
  logger.info(`[REQUEST] Création d'un feedback pour UserID=${req.user.id}`);

  validateFeedbackData(req.body);

  const feedback = await trackPerformance(() => feedbackService.createFeedback(req.user.id, req.body), 'createFeedback');

  // Notification détaillée pour l'équipe de support
  await notificationService.notifySupport(
    `Nouveau feedback soumis par UserID=${req.user.id}, FeedbackID=${feedback.id}, Rating=${feedback.rating}`
  );

  logger.info(`[SUCCESS] Feedback créé avec succès : FeedbackID=${feedback.id}`);
  res.status(httpStatus.CREATED).send(feedback);
});

/**
 * Mettre à jour un feedback.
 */
const updateFeedback = catchAsync(async (req, res) => {
  logger.info(`[REQUEST] Mise à jour du feedback FeedbackID=${req.params.feedbackId} pour UserID=${req.user.id}`);

  validateFeedbackData(req.body);

  // Vérifier que l'utilisateur est propriétaire du feedback
  const feedback = await feedbackService.getFeedbackById(req.params.feedbackId);
  if (feedback.user.toString() !== req.user.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Vous ne pouvez pas modifier ce feedback');
  }

  const updatedFeedback = await trackPerformance(
    () => feedbackService.updateFeedback(req.user.id, req.params.feedbackId, req.body),
    'updateFeedback'
  );

  logger.info(`[SUCCESS] Feedback mis à jour : FeedbackID=${req.params.feedbackId}`);
  res.status(httpStatus.OK).send(updatedFeedback);
});

/**
 * Supprimer un feedback.
 */
const deleteFeedback = catchAsync(async (req, res) => {
  logger.info(`[REQUEST] Suppression du feedback FeedbackID=${req.params.feedbackId} pour UserID=${req.user.id}`);

  // Vérifier que l'utilisateur est propriétaire du feedback ou un administrateur
  const feedback = await feedbackService.getFeedbackById(req.params.feedbackId);
  if (feedback.user.toString() !== req.user.id && req.user.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Vous ne pouvez pas supprimer ce feedback');
  }

  await trackPerformance(() => feedbackService.deleteFeedback(req.user.id, req.params.feedbackId), 'deleteFeedback');

  logger.info(`[SUCCESS] Feedback supprimé avec succès : FeedbackID=${req.params.feedbackId}`);
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Récupérer les feedbacks pour un utilisateur.
 */
const getUserFeedbacks = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;
  logger.info(`[REQUEST] Récupération des feedbacks pour l'utilisateur UserID=${req.params.userId}`);

  const feedbacks = await trackPerformance(
    () => feedbackService.getUserFeedbacks(req.params.userId, { page, limit, sortBy, order }),
    'getUserFeedbacks'
  );

  logger.info(`[SUCCESS] Feedbacks récupérés : Total=${feedbacks.results.length}`);
  res.status(httpStatus.OK).send(feedbacks);
});

/**
 * Obtenir les statistiques des feedbacks.
 */
const getFeedbackStats = catchAsync(async (req, res) => {
  logger.info(`[REQUEST] Récupération des statistiques globales de feedback`);

  const stats = await trackPerformance(() => feedbackService.getFeedbackStats(), 'getFeedbackStats');

  logger.info(`[SUCCESS] Statistiques de feedback récupérées avec succès`);
  res.status(httpStatus.OK).send(stats);
});

module.exports = {
  createFeedback,
  updateFeedback,
  deleteFeedback,
  getUserFeedbacks,
  getFeedbackStats,
};
