const Joi = require('joi');
const { objectId } = require('./custom.validation');

// Validation pour la création d'un administrateur
const createAdmin = {
  body: Joi.object().keys({
    user: Joi.string().required().custom(objectId).messages({
      'any.required': 'Le champ "user" est obligatoire.',
      'string.pattern.name': 'Le champ "user" doit être un ObjectId valide.',
    }),
    permissions: Joi.array().items(Joi.string().required()).min(1).messages({
      'array.min': 'Au moins une permission doit être spécifiée.',
    }),
    level: Joi.string().valid('superAdmin', 'admin', 'moderator').default('admin').messages({
      'any.only': 'Le niveau doit être "superAdmin", "admin", ou "moderator".',
    }),
  }),
};

// Validation pour la mise à jour des permissions d'un administrateur
const updatePermissions = {
  params: Joi.object().keys({
    adminId: Joi.string().required().custom(objectId).messages({
      'any.required': "L'ID de l'administrateur est obligatoire.",
      'string.pattern.name': "L'ID de l'administrateur doit être un ObjectId valide.",
    }),
  }),
  body: Joi.object()
    .keys({
      permissions: Joi.array().items(Joi.string().required()).min(1).messages({
        'array.min': 'Au moins une permission doit être spécifiée.',
      }),
    })
    .required()
    .messages({
      'any.required': 'Le corps de la requête est obligatoire.',
    }),
};

// Validation pour la suppression d'un administrateur
const deleteAdmin = {
  params: Joi.object().keys({
    adminId: Joi.string().required().custom(objectId).messages({
      'any.required': "L'ID de l'administrateur est obligatoire.",
      'string.pattern.name': "L'ID de l'administrateur doit être un ObjectId valide.",
    }),
  }),
};

// Validation pour lister les administrateurs
const getAdmins = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1).messages({
      'number.base': 'Le numéro de page doit être un entier.',
      'number.min': 'Le numéro de page doit être au moins 1.',
    }),
    limit: Joi.number().integer().min(1).default(10).messages({
      'number.base': 'La limite doit être un entier.',
      'number.min': 'La limite doit être au moins 1.',
    }),
    sortBy: Joi.string().messages({
      'string.base': 'Le tri doit être une chaîne de caractères.',
    }),
    order: Joi.string().valid('asc', 'desc').messages({
      'any.only': 'L\'ordre doit être "asc" ou "desc".',
    }),
    level: Joi.string().valid('superAdmin', 'admin', 'moderator').messages({
      'any.only': 'Le niveau doit être "superAdmin", "admin", ou "moderator".',
    }),
  }),
};

// Validation pour récupérer les logs d'actions d'un administrateur
const getActionLogs = {
  params: Joi.object().keys({
    adminId: Joi.string().required().custom(objectId).messages({
      'any.required': "L'ID de l'administrateur est obligatoire.",
      'string.pattern.name': "L'ID de l'administrateur doit être un ObjectId valide.",
    }),
  }),
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1).messages({
      'number.base': 'Le numéro de page doit être un entier.',
      'number.min': 'Le numéro de page doit être au moins 1.',
    }),
    limit: Joi.number().integer().min(1).default(10).messages({
      'number.base': 'La limite doit être un entier.',
      'number.min': 'La limite doit être au moins 1.',
    }),
  }),
};

module.exports = {
  createAdmin,
  updatePermissions,
  deleteAdmin,
  getAdmins,
  getActionLogs,
};
