const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createFeedback = {
  body: Joi.object().keys({
    product: Joi.string().custom(objectId).optional().allow(null), // L'ID du produit est optionnel
    title: Joi.string().required().max(100).messages({
      'string.empty': 'Le titre est obligatoire',
      'string.max': 'Le titre ne doit pas dépasser 100 caractères',
    }),
    description: Joi.string().required().max(500).messages({
      'string.empty': 'La description est obligatoire',
      'string.max': 'La description ne doit pas dépasser 500 caractères',
    }),
    rating: Joi.number().required().min(1).max(5).messages({
      'number.base': 'La note doit être un nombre',
      'number.min': 'La note doit être au moins de 1',
      'number.max': 'La note ne peut pas dépasser 5',
    }),
    priority: Joi.string().valid('low', 'medium', 'high').default('medium').messages({
      'any.only': 'La priorité doit être low, medium ou high',
    }),
  }),
};

const getFeedbacks = {
  query: Joi.object().keys({
    status: Joi.string().valid('pending', 'in_progress', 'resolved').optional(),
    priority: Joi.string().valid('low', 'medium', 'high').optional(),
    page: Joi.number().integer().min(1).optional().messages({
      'number.min': 'Le numéro de page doit être au moins de 1',
    }),
    limit: Joi.number().integer().min(1).optional().messages({
      'number.min': 'La limite doit être au moins de 1',
    }),
  }),
};

const getFeedbackById = {
  params: Joi.object().keys({
    feedbackId: Joi.string().custom(objectId).required().messages({
      'string.empty': "L'ID du feedback est obligatoire",
    }),
  }),
};

const updateFeedback = {
  params: Joi.object().keys({
    feedbackId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      status: Joi.string().valid('pending', 'in_progress', 'resolved').optional(),
      priority: Joi.string().valid('low', 'medium', 'high').optional(),
      title: Joi.string().optional().max(100).messages({
        'string.max': 'Le titre ne doit pas dépasser 100 caractères',
      }),
      description: Joi.string().optional().max(500).messages({
        'string.max': 'La description ne doit pas dépasser 500 caractères',
      }),
    })
    .min(1) // Au moins un champ doit être mis à jour
    .messages({
      'object.min': 'Au moins un champ doit être mis à jour',
    }),
};

const deleteFeedback = {
  params: Joi.object().keys({
    feedbackId: Joi.string().custom(objectId).required(),
  }),
};

module.exports = {
  createFeedback,
  getFeedbacks,
  getFeedbackById,
  updateFeedback,
  deleteFeedback,
};
