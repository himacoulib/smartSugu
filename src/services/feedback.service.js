const httpStatus = require('http-status');
const { Feedback, User } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Créer un feedback.
 * @param {ObjectId} userId - ID de l'utilisateur.
 * @param {Object} feedbackData - Données du feedback.
 * @returns {Promise<Feedback>}
 */
const createFeedback = async (userId, feedbackData) => {
  const feedback = await Feedback.create({ user: userId, ...feedbackData });
  return feedback;
};

/**
 * Mettre à jour un feedback.
 * @param {ObjectId} userId - ID de l'utilisateur.
 * @param {ObjectId} feedbackId - ID du feedback.
 * @param {Object} updateData - Données de mise à jour.
 * @returns {Promise<Feedback>}
 */
const updateFeedback = async (userId, feedbackId, updateData) => {
  const feedback = await Feedback.findById(feedbackId);

  if (!feedback) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Feedback not found');
  }

  if (feedback.user.toString() !== userId.toString()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Unauthorized to update this feedback');
  }

  Object.assign(feedback, updateData);
  await feedback.save();
  return feedback;
};

/**
 * Supprimer un feedback.
 * @param {ObjectId} userId - ID de l'utilisateur.
 * @param {ObjectId} feedbackId - ID du feedback.
 * @returns {Promise<void>}
 */
const deleteFeedback = async (userId, feedbackId) => {
  const feedback = await Feedback.findById(feedbackId);

  if (!feedback) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Feedback not found');
  }

  if (feedback.user.toString() !== userId.toString() && userId.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Unauthorized to delete this feedback');
  }

  await feedback.remove();
};

/**
 * Récupérer les feedbacks d’un utilisateur.
 * @param {ObjectId} userId - ID de l'utilisateur.
 * @param {Object} options - Options de pagination et tri.
 * @returns {Promise<QueryResult>}
 */
const getUserFeedbacks = async (userId, options) => {
  const filter = { user: userId };
  const feedbacks = await Feedback.paginate(filter, options);
  return feedbacks;
};

/**
 * Obtenir des statistiques globales des feedbacks.
 * @returns {Promise<Object>}
 */
const getFeedbackStats = async () => {
  const totalFeedbacks = await Feedback.countDocuments();
  const averageRating = await Feedback.aggregate([{ $group: { _id: null, avgRating: { $avg: '$rating' } } }]);

  return {
    totalFeedbacks,
    averageRating: averageRating.length > 0 ? averageRating[0].avgRating : 0,
  };
};

/**
 * Récupérer les feedbacks par priorité.
 * @param {String} priority - Niveau de priorité.
 * @returns {Promise<Array<Feedback>>}
 */
const getFeedbacksByPriority = async (priority) => {
  return Feedback.getByPriority(priority);
};

/**
 * Récupérer les feedbacks par statut.
 * @param {String} status - Statut du feedback.
 * @returns {Promise<Array<Feedback>>}
 */
const getFeedbacksByStatus = async (status) => {
  return Feedback.getByStatus(status);
};

module.exports = {
  createFeedback,
  updateFeedback,
  deleteFeedback,
  getUserFeedbacks,
  getFeedbackStats,
  getFeedbacksByPriority,
  getFeedbacksByStatus,
};
