const Joi = require('joi');
const { objectId } = require('./custom.validation');

/**
 * Validation pour la création d'une commande
 */
const createOrder = {
  body: Joi.object().keys({
    products: Joi.array()
      .items(
        Joi.object().keys({
          productId: Joi.string().custom(objectId).required(),
          quantity: Joi.number().integer().min(1).required(),
          price: Joi.number().precision(2).min(0).required(),
        })
      )
      .required(),
    promotion: Joi.string().custom(objectId).optional(),
    deliveryAddress: Joi.object()
      .keys({
        street: Joi.string().required(),
        city: Joi.string().required(),
        postalCode: Joi.string().required(),
        country: Joi.string().required(),
      })
      .required(),
    totalPrice: Joi.number().precision(2).min(0).required(),
  }),
};

/**
 * Validation pour récupérer l'historique des commandes
 */
const getOrderHistory = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).default(10),
  }),
};

/**
 * Validation pour récupérer une commande par ID
 */
const getOrderById = {
  params: Joi.object().keys({
    orderId: Joi.string().custom(objectId).required(),
  }),
};

/**
 * Validation pour mettre à jour le statut d'une commande
 */
const updateOrderStatus = {
  params: Joi.object().keys({
    orderId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      status: Joi.string().valid('pending', 'accepted', 'in_progress', 'completed', 'cancelled').required(),
    })
    .required(),
};

/**
 * Validation pour annuler une commande
 */
const cancelOrder = {
  params: Joi.object().keys({
    orderId: Joi.string().custom(objectId).required(),
  }),
};

/**
 * Validation pour générer un reçu pour une commande
 */
const generateReceipt = {
  params: Joi.object().keys({
    orderId: Joi.string().custom(objectId).required(),
  }),
};

/**
 * Validation pour calculer le total d'une commande
 */
const calculateOrderTotal = {
  body: Joi.object()
    .keys({
      products: Joi.array()
        .items(
          Joi.object().keys({
            productId: Joi.string().custom(objectId).required(),
            quantity: Joi.number().integer().min(1).required(),
            price: Joi.number().precision(2).min(0).required(),
          })
        )
        .required(),
    })
    .required(),
};

/**
 * Validation pour récupérer les commandes disponibles pour les livreurs
 */
const getAvailableOrdersForLivreur = {
  query: Joi.object().keys({
    latitude: Joi.number().min(-90).max(90).required(),
    longitude: Joi.number().min(-180).max(180).required(),
  }),
};

/**
 * Validation pour assigner une commande à un livreur
 */
const assignOrderToLivreur = {
  params: Joi.object().keys({
    orderId: Joi.string().custom(objectId).required(),
  }),
};

/**
 * Validation pour récupérer les commandes d'un client
 */
const getClientOrders = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).default(10),
  }),
};

/**
 * Validation pour récupérer les commandes en attente d'un marchand
 */
const getMerchantPendingOrders = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).default(10),
  }),
};

/**
 * Validation pour ajouter une note ou un commentaire à une commande
 */
const addOrderNote = {
  params: Joi.object().keys({
    orderId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object()
    .keys({
      note: Joi.string().max(500).required(),
    })
    .required(),
};

module.exports = {
  createOrder,
  getOrderHistory,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  generateReceipt,
  calculateOrderTotal,
  getAvailableOrdersForLivreur,
  assignOrderToLivreur,
  getClientOrders,
  getMerchantPendingOrders,
  addOrderNote,
};
