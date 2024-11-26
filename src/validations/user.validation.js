const Joi = require('joi');
const { password, objectId } = require('./custom.validation');

const createUser = {
  body: Joi.object().keys({
    email: Joi.string().required().email().messages({
      'string.email': "L'adresse email doit être valide.",
      'any.required': "L'adresse email est obligatoire.",
    }),
    password: Joi.string().required().custom(password).messages({
      'any.required': 'Le mot de passe est obligatoire.',
    }),
    name: Joi.string().required().min(3).max(50).messages({
      'string.min': 'Le nom doit contenir au moins 3 caractères.',
      'string.max': 'Le nom ne doit pas dépasser 50 caractères.',
      'any.required': 'Le nom est obligatoire.',
    }),
    role: Joi.string().required().valid('user', 'admin').messages({
      'any.required': 'Le rôle est obligatoire.',
      'any.only': 'Le rôle doit être soit "user" soit "admin".',
    }),
  }),
};

const getUsers = {
  query: Joi.object().keys({
    name: Joi.string().max(50).messages({
      'string.max': 'Le nom ne doit pas dépasser 50 caractères.',
    }),
    role: Joi.string().valid('user', 'admin').messages({
      'any.only': 'Le rôle doit être soit "user" soit "admin".',
    }),
    sortBy: Joi.string().messages({
      'string.base': 'Le champ sortBy doit être une chaîne de caractères.',
    }),
    limit: Joi.number().integer().min(1).messages({
      'number.base': 'Le champ limit doit être un entier.',
      'number.min': "La limite doit être d'au moins 1.",
    }),
    page: Joi.number().integer().min(1).messages({
      'number.base': 'Le champ page doit être un entier.',
      'number.min': "La page doit être d'au moins 1.",
    }),
  }),
};

const getUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId).messages({
      'any.custom': "L'ID utilisateur doit être un identifiant valide.",
    }),
  }),
};

const updateUser = {
  params: Joi.object().keys({
    userId: Joi.required().custom(objectId).messages({
      'any.required': "L'ID utilisateur est obligatoire.",
      'any.custom': "L'ID utilisateur doit être un identifiant valide.",
    }),
  }),
  body: Joi.object()
    .keys({
      email: Joi.string().email().messages({
        'string.email': "L'adresse email doit être valide.",
      }),
      password: Joi.string().custom(password).messages({
        'any.custom': 'Le mot de passe ne respecte pas les règles de sécurité.',
      }),
      name: Joi.string().min(3).max(50).messages({
        'string.min': 'Le nom doit contenir au moins 3 caractères.',
        'string.max': 'Le nom ne doit pas dépasser 50 caractères.',
      }),
    })
    .min(1)
    .messages({
      'object.min': 'Au moins un champ doit être mis à jour.',
    }),
};

const deleteUser = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId).messages({
      'any.custom': "L'ID utilisateur doit être un identifiant valide.",
    }),
  }),
};

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
};
