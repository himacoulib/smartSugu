const Joi = require('joi');
const { objectId } = require('./custom.validation');

// Validation pour ajouter un produit à l'inventaire
const addProduct = {
  body: Joi.object().keys({
    productId: Joi.string().custom(objectId).required().messages({
      'string.empty': "L'ID du produit est obligatoire",
      'any.required': "L'ID du produit est requis",
    }),
    quantity: Joi.number().integer().min(0).required().messages({
      'number.base': 'La quantité doit être un nombre',
      'number.min': 'La quantité doit être supérieure ou égale à 0',
      'any.required': 'La quantité est obligatoire',
    }),
    lowStockThreshold: Joi.number().integer().min(1).optional().messages({
      'number.base': 'Le seuil de stock faible doit être un nombre',
      'number.min': 'Le seuil de stock faible doit être supérieur ou égal à 1',
    }),
  }),
};

// Validation pour mettre à jour un produit dans l'inventaire
const updateProduct = {
  params: Joi.object().keys({
    productId: Joi.string().custom(objectId).required().messages({
      'string.empty': "L'ID du produit est obligatoire",
      'any.required': "L'ID du produit est requis",
    }),
  }),
  body: Joi.object().keys({
    lowStockThreshold: Joi.number().integer().min(1).optional().messages({
      'number.base': 'Le seuil de stock faible doit être un nombre',
      'number.min': 'Le seuil de stock faible doit être supérieur ou égal à 1',
    }),
  }),
};

// Validation pour mettre à jour la quantité en stock
const updateStock = {
  params: Joi.object().keys({
    productId: Joi.string().custom(objectId).required().messages({
      'string.empty': "L'ID du produit est obligatoire",
      'any.required': "L'ID du produit est requis",
    }),
  }),
  body: Joi.object().keys({
    quantity: Joi.number().integer().required().messages({
      'number.base': 'La quantité doit être un nombre',
      'any.required': 'La quantité est obligatoire',
    }),
  }),
};

// Validation pour supprimer un produit de l'inventaire
const deleteProduct = {
  params: Joi.object().keys({
    productId: Joi.string().custom(objectId).required().messages({
      'string.empty': "L'ID du produit est obligatoire",
      'any.required': "L'ID du produit est requis",
    }),
  }),
};

// Validation pour récupérer l'inventaire avec filtres et pagination
const getInventory = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1).messages({
      'number.base': 'Le numéro de page doit être un nombre',
      'number.min': 'Le numéro de page doit être au moins 1',
    }),
    limit: Joi.number().integer().min(1).default(10).messages({
      'number.base': 'La limite doit être un nombre',
      'number.min': 'La limite doit être au moins 1',
    }),
    category: Joi.string().custom(objectId).optional().messages({
      'string.empty': "L'ID de la catégorie doit être un objet valide",
    }),
    minStock: Joi.number().integer().min(0).optional().messages({
      'number.base': 'Le stock minimum doit être un nombre',
      'number.min': 'Le stock minimum doit être supérieur ou égal à 0',
    }),
  }),
};

module.exports = {
  addProduct,
  updateProduct,
  updateStock,
  deleteProduct,
  getInventory,
};
