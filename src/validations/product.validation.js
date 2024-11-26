const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createProduct = {
  body: Joi.object().keys({
    name: Joi.string().required().min(3).max(100).messages({
      'string.empty': 'Le nom du produit est requis.',
      'string.min': 'Le nom du produit doit contenir au moins 3 caractères.',
      'string.max': 'Le nom du produit ne peut pas dépasser 100 caractères.',
    }),
    description: Joi.string().max(500).optional(),
    price: Joi.number().required().min(0).messages({
      'number.min': 'Le prix doit être supérieur ou égal à 0.',
    }),
    category: Joi.string().required().custom(objectId).messages({
      'any.required': 'La catégorie du produit est requise.',
    }),
    stock: Joi.number().integer().min(0).required().messages({
      'number.base': 'Le stock doit être un nombre entier.',
      'number.min': 'Le stock doit être supérieur ou égal à 0.',
    }),
    images: Joi.array()
      .items(
        Joi.object({
          url: Joi.string().uri().required(),
          altText: Joi.string().optional(),
          width: Joi.number().optional(),
          height: Joi.number().optional(),
        })
      )
      .optional(),
    metaTitle: Joi.string().optional().max(60),
    metaDescription: Joi.string().optional().max(160),
  }),
};

const updateProduct = {
  params: Joi.object().keys({
    productId: Joi.string().required().custom(objectId).messages({
      'any.required': "L'ID du produit est requis.",
    }),
  }),
  body: Joi.object()
    .keys({
      name: Joi.string().min(3).max(100).optional(),
      description: Joi.string().max(500).optional(),
      price: Joi.number().min(0).optional(),
      category: Joi.string().custom(objectId).optional(),
      stock: Joi.number().integer().min(0).optional(),
      isActive: Joi.boolean().optional(),
      images: Joi.array()
        .items(
          Joi.object({
            url: Joi.string().uri().required(),
            altText: Joi.string().optional(),
            width: Joi.number().optional(),
            height: Joi.number().optional(),
          })
        )
        .optional(),
      metaTitle: Joi.string().optional().max(60),
      metaDescription: Joi.string().optional().max(160),
    })
    .min(1),
};

const deleteProduct = {
  params: Joi.object().keys({
    productId: Joi.string().required().custom(objectId).messages({
      'any.required': "L'ID du produit est requis.",
    }),
  }),
};

const getProduct = {
  params: Joi.object().keys({
    productId: Joi.string().required().custom(objectId).messages({
      'any.required': "L'ID du produit est requis.",
    }),
  }),
};

const searchProducts = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).default(10),
    category: Joi.string().custom(objectId).optional(),
    minPrice: Joi.number().min(0).optional(),
    maxPrice: Joi.number().greater(Joi.ref('minPrice')).optional(),
    search: Joi.string().optional(),
  }),
};

const updateStock = {
  params: Joi.object().keys({
    productId: Joi.string().required().custom(objectId).messages({
      'any.required': "L'ID du produit est requis.",
    }),
  }),
  body: Joi.object().keys({
    quantity: Joi.number().integer().required().messages({
      'any.required': 'La quantité est requise.',
      'number.integer': 'La quantité doit être un nombre entier.',
    }),
    reason: Joi.string().max(200).optional(),
  }),
};

const updateVisibility = {
  params: Joi.object().keys({
    productId: Joi.string().required().custom(objectId).messages({
      'any.required': "L'ID du produit est requis.",
    }),
  }),
  body: Joi.object().keys({
    isActive: Joi.boolean().required().messages({
      'any.required': 'Le statut de visibilité est requis.',
    }),
  }),
};

const updateImages = {
  params: Joi.object().keys({
    productId: Joi.string().required().custom(objectId).messages({
      'any.required': "L'ID du produit est requis.",
    }),
  }),
  body: Joi.object().keys({
    images: Joi.array()
      .items(
        Joi.object({
          url: Joi.string().uri().required(),
          altText: Joi.string().optional(),
          width: Joi.number().optional(),
          height: Joi.number().optional(),
        })
      )
      .required()
      .messages({
        'any.required': 'Les images sont requises.',
      }),
  }),
};

module.exports = {
  createProduct,
  updateProduct,
  deleteProduct,
  getProduct,
  searchProducts,
  updateStock,
  updateVisibility,
  updateImages,
};
