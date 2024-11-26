const Joi = require('joi');
const { objectId } = require('./custom.validation');

// Validation pour ajouter une évaluation
const addReview = {
  body: Joi.object().keys({
    product: Joi.string().custom(objectId).required().label('ID du produit'),
    merchant: Joi.string().custom(objectId).required().label('ID du marchand'),
    rating: Joi.number().integer().min(1).max(5).required().label('Note'),
    comment: Joi.string().max(500).allow(null, '').label('Commentaire'),
    keywords: Joi.array().items(Joi.string()).label('Mots-clés'),
  }),
};

// Validation pour mettre à jour une évaluation
const updateReview = {
  params: Joi.object().keys({
    reviewId: Joi.string().custom(objectId).required().label("ID de l'évaluation"),
  }),
  body: Joi.object()
    .keys({
      rating: Joi.number().integer().min(1).max(5).label('Note'),
      comment: Joi.string().max(500).allow(null, '').label('Commentaire'),
      keywords: Joi.array().items(Joi.string()).label('Mots-clés'),
    })
    .min(1),
};

// Validation pour supprimer une évaluation
const deleteReview = {
  params: Joi.object().keys({
    reviewId: Joi.string().custom(objectId).required().label("ID de l'évaluation"),
  }),
};

// Validation pour récupérer les évaluations d'un produit
const getReviewsForProduct = {
  params: Joi.object().keys({
    productId: Joi.string().custom(objectId).required().label('ID du produit'),
  }),
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1).label('Page'),
    limit: Joi.number().integer().min(1).default(10).label('Limite'),
    sortBy: Joi.string().default('createdAt').label('Champ de tri'),
    order: Joi.string().valid('asc', 'desc').default('desc').label('Ordre de tri'),
  }),
};

// Validation pour récupérer les évaluations d'un marchand
const getMerchantReviews = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1).label('Page'),
    limit: Joi.number().integer().min(1).default(10).label('Limite'),
    sortBy: Joi.string().default('createdAt').label('Champ de tri'),
    order: Joi.string().valid('asc', 'desc').default('desc').label('Ordre de tri'),
  }),
};

// Exporter toutes les validations
module.exports = {
  addReview,
  updateReview,
  deleteReview,
  getReviewsForProduct,
  getMerchantReviews,
};
