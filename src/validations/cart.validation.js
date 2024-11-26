const Joi = require('joi');
const { objectId } = require('./custom.validation');

const addToCart = {
  body: Joi.object().keys({
    productId: Joi.string().custom(objectId).required().messages({
      'string.empty': "L'ID du produit est requis",
      'any.required': "L'ID du produit est requis",
    }),
    quantity: Joi.number().integer().min(1).required().messages({
      'number.base': 'La quantité doit être un nombre entier',
      'number.min': 'La quantité doit être au moins de 1',
      'any.required': 'La quantité est requise',
    }),
  }),
};

const updateCartItem = {
  params: Joi.object().keys({
    productId: Joi.string().custom(objectId).required().messages({
      'string.empty': "L'ID du produit est requis",
      'any.required': "L'ID du produit est requis",
    }),
  }),
  body: Joi.object().keys({
    quantity: Joi.number().integer().min(1).required().messages({
      'number.base': 'La quantité doit être un nombre entier',
      'number.min': 'La quantité doit être au moins de 1',
      'any.required': 'La quantité est requise',
    }),
  }),
};

const removeFromCart = {
  params: Joi.object().keys({
    productId: Joi.string().custom(objectId).required().messages({
      'string.empty': "L'ID du produit est requis",
      'any.required': "L'ID du produit est requis",
    }),
  }),
};

const clearCart = {
  // Aucune donnée spécifique nécessaire pour vider le panier
};

const getCartDetails = {
  // Aucune donnée spécifique nécessaire pour récupérer les détails du panier
};

module.exports = {
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartDetails,
};
