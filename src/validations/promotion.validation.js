const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createPromotion = {
  body: Joi.object().keys({
    code: Joi.string().required().messages({
      'string.empty': 'Le code de la promotion est obligatoire.',
    }),
    discountType: Joi.string().valid('percentage', 'fixed').required().messages({
      'any.only': 'Le type de réduction doit être "percentage" ou "fixed".',
    }),
    discountValue: Joi.number().positive().required().messages({
      'number.positive': 'La valeur de réduction doit être un nombre positif.',
    }),
    expirationDate: Joi.date().greater('now').messages({
      'date.greater': "La date d'expiration doit être dans le futur.",
    }),
    usageLimit: Joi.number().integer().positive().messages({
      'number.positive': 'La limite d’utilisation doit être un nombre positif.',
    }),
    applicableRegions: Joi.array().items(Joi.string()).messages({
      'array.base': 'Les régions applicables doivent être une liste de chaînes.',
    }),
    applicableProducts: Joi.array().items(Joi.string().custom(objectId)).messages({
      'array.base': 'Les produits applicables doivent être une liste d’identifiants valides.',
    }),
  }),
};

const updatePromotion = {
  body: Joi.object().keys({
    code: Joi.string().messages({
      'string.empty': 'Le code ne peut pas être vide.',
    }),
    discountType: Joi.string().valid('percentage', 'fixed').messages({
      'any.only': 'Le type de réduction doit être "percentage" ou "fixed".',
    }),
    discountValue: Joi.number().positive().messages({
      'number.positive': 'La valeur de réduction doit être un nombre positif.',
    }),
    expirationDate: Joi.date().greater('now').messages({
      'date.greater': "La date d'expiration doit être dans le futur.",
    }),
    usageLimit: Joi.number().integer().positive().messages({
      'number.positive': 'La limite d’utilisation doit être un nombre positif.',
    }),
    isActive: Joi.boolean().messages({
      'boolean.base': 'Le statut actif doit être un booléen.',
    }),
    applicableRegions: Joi.array().items(Joi.string()).messages({
      'array.base': 'Les régions applicables doivent être une liste de chaînes.',
    }),
    applicableProducts: Joi.array().items(Joi.string().custom(objectId)).messages({
      'array.base': 'Les produits applicables doivent être une liste d’identifiants valides.',
    }),
  }),
};

const deletePromotion = {
  params: Joi.object().keys({
    promotionId: Joi.string().custom(objectId).required(),
  }),
};

const togglePromotionStatus = {
  params: Joi.object().keys({
    promotionId: Joi.string().custom(objectId).required(),
  }),
};

const getPromotionStats = {
  params: Joi.object().keys({
    promotionId: Joi.string().custom(objectId).required(),
  }),
};

const getActivePromotions = {
  query: Joi.object().keys({
    page: Joi.number().integer().positive(),
    limit: Joi.number().integer().positive(),
    sortBy: Joi.string(),
    order: Joi.string().valid('asc', 'desc'),
    region: Joi.string(),
    product: Joi.string().custom(objectId),
  }),
};

const getPromotionHistory = {
  query: Joi.object().keys({
    page: Joi.number().integer().positive(),
    limit: Joi.number().integer().positive(),
    sortBy: Joi.string(),
    order: Joi.string().valid('asc', 'desc'),
    region: Joi.string(),
    product: Joi.string().custom(objectId),
  }),
};

module.exports = {
  createPromotion,
  updatePromotion,
  deletePromotion,
  togglePromotionStatus,
  getPromotionStats,
  getActivePromotions,
  getPromotionHistory,
};
