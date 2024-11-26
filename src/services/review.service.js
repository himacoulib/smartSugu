const { Review, Product } = require('../models');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

/**
 * Ajouter une nouvelle évaluation.
 * @param {ObjectId} userId - ID de l'utilisateur.
 * @param {Object} reviewBody - Contenu de l'évaluation.
 * @returns {Promise<Review>}
 */
const addReview = async (userId, reviewBody) => {
  const { product, merchant, rating, comment, keywords } = reviewBody;

  // Vérifier l'existence du produit et du marchand
  const existingProduct = await Product.findById(product);
  if (!existingProduct || existingProduct.merchant.toString() !== merchant) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Produit ou marchand introuvable.');
  }

  // Créer l'évaluation
  const review = await Review.create({ user: userId, ...reviewBody });

  // Mettre à jour la note moyenne du produit
  await existingProduct.calculateAverageRating();

  return review;
};

/**
 * Vérifier si un utilisateur est éligible pour évaluer un produit.
 * @param {ObjectId} userId - ID de l'utilisateur.
 * @param {ObjectId} productId - ID du produit.
 * @returns {Promise<Boolean>}
 */
const checkEligibility = async (userId, productId) => {
  // Vérifiez si l'utilisateur a commandé ce produit
  const reviewExists = await Review.findOne({ user: userId, product: productId });
  return !reviewExists; // Si une évaluation existe déjà, l'utilisateur n'est pas éligible
};

/**
 * Mettre à jour une évaluation existante.
 * @param {ObjectId} userId - ID de l'utilisateur.
 * @param {ObjectId} reviewId - ID de l'évaluation.
 * @param {Object} updateBody - Contenu de la mise à jour.
 * @returns {Promise<Review>}
 */
const updateReview = async (userId, reviewId, updateBody) => {
  const review = await Review.findById(reviewId);

  if (!review) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Évaluation introuvable.');
  }

  if (!review.canBeModifiedBy(userId)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Vous ne pouvez pas modifier cette évaluation.');
  }

  Object.assign(review, updateBody);
  await review.save();

  // Mettre à jour la note moyenne du produit
  const product = await Product.findById(review.product);
  await product.calculateAverageRating();

  return review;
};

/**
 * Supprimer une évaluation.
 * @param {ObjectId} userId - ID de l'utilisateur.
 * @param {ObjectId} reviewId - ID de l'évaluation.
 * @returns {Promise<Review>}
 */
const deleteReview = async (userId, reviewId) => {
  const review = await Review.findById(reviewId);

  if (!review) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Évaluation introuvable.');
  }

  if (!review.canBeModifiedBy(userId)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Vous ne pouvez pas supprimer cette évaluation.');
  }

  await review.remove();

  // Mettre à jour la note moyenne du produit
  const product = await Product.findById(review.product);
  await product.calculateAverageRating();

  return review;
};

/**
 * Récupérer les évaluations d'un produit.
 * @param {ObjectId} productId - ID du produit.
 * @param {Object} filterOptions - Options de pagination et tri.
 * @returns {Promise<Object>}
 */
const getReviewsForProduct = async (productId, filterOptions) => {
  const reviews = await Review.paginate({ product: productId }, filterOptions);
  return reviews;
};

/**
 * Récupérer les évaluations d'un marchand.
 * @param {ObjectId} merchantId - ID du marchand.
 * @param {Object} filterOptions - Options de pagination et tri.
 * @returns {Promise<Object>}
 */
const getMerchantReviews = async (merchantId, filterOptions) => {
  const reviews = await Review.paginate({ merchant: merchantId }, filterOptions);
  return reviews;
};

/**
 * Obtenir les statistiques d'évaluation pour un marchand.
 * @param {ObjectId} merchantId - ID du marchand.
 * @returns {Promise<Object>}
 */
const getReviewStats = async (merchantId) => {
  const totalReviews = await Review.countDocuments({ merchant: merchantId });
  const averageRating = await Review.calculateAverageRating(merchantId, 'merchant');
  const distribution = await Review.aggregate([
    { $match: { merchant: merchantId } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
    { $sort: { _id: 1 } },
  ]);

  return { totalReviews, averageRating, distribution };
};

/**
 * Récupérer les mots-clés les plus fréquents pour un marchand.
 * @param {ObjectId} merchantId - ID du marchand.
 * @returns {Promise<Array>}
 */
const getTopKeywords = async (merchantId) => {
  return Review.getTopKeywords(merchantId);
};

/**
 * Obtenir les statistiques périodiques pour un marchand.
 * @param {ObjectId} merchantId - ID du marchand.
 * @returns {Promise<Object>}
 */
const getPeriodicStats = async (merchantId) => {
  const reviews = await Review.find({ merchant: merchantId });
  const stats = reviews.reduce(
    (acc, review) => {
      Object.entries(review.stats.weekly).forEach(([week, count]) => {
        acc.weekly[week] = (acc.weekly[week] || 0) + count;
      });
      Object.entries(review.stats.monthly).forEach(([month, count]) => {
        acc.monthly[month] = (acc.monthly[month] || 0) + count;
      });
      return acc;
    },
    { weekly: {}, monthly: {} }
  );

  return stats;
};

module.exports = {
  addReview,
  checkEligibility,
  updateReview,
  deleteReview,
  getReviewsForProduct,
  getMerchantReviews,
  getReviewStats,
  getTopKeywords,
  getPeriodicStats,
};
