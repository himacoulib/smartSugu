const Joi = require('joi');
const { objectId } = require('./custom.validation');

// Validation pour la création d'une livraison
const createDelivery = {
  body: Joi.object().keys({
    order: Joi.string().custom(objectId).required().description('ID de la commande associée'),
    livreur: Joi.string().custom(objectId).optional().description('ID du livreur assigné'),
    address: Joi.object()
      .keys({
        street: Joi.string().required().description('Rue de l’adresse de livraison'),
        city: Joi.string().required().description('Ville de l’adresse de livraison'),
        postalCode: Joi.string().required().description('Code postal de l’adresse de livraison'),
        country: Joi.string().required().description('Pays de l’adresse de livraison'),
      })
      .required(),
    priority: Joi.string()
      .valid('low', 'medium', 'high')
      .default('medium')
      .description('Niveau de priorité de la livraison'),
  }),
};

// Validation pour récupérer une livraison par ID
const getDeliveryById = {
  params: Joi.object().keys({
    deliveryId: Joi.string().custom(objectId).required().description('ID de la livraison'),
  }),
};

// Validation pour mettre à jour le statut d'une livraison
const updateDeliveryStatus = {
  params: Joi.object().keys({
    deliveryId: Joi.string().custom(objectId).required().description('ID de la livraison'),
  }),
  body: Joi.object()
    .keys({
      status: Joi.string()
        .valid('pending', 'in_progress', 'delivered', 'cancelled')
        .required()
        .description('Nouveau statut de la livraison'),
    })
    .required(),
};

// Validation pour supprimer une livraison
const deleteDelivery = {
  params: Joi.object().keys({
    deliveryId: Joi.string().custom(objectId).required().description('ID de la livraison'),
  }),
};

// Validation pour assigner une livraison à un livreur
const assignDelivery = {
  params: Joi.object().keys({
    deliveryId: Joi.string().custom(objectId).required().description('ID de la livraison'),
  }),
  body: Joi.object()
    .keys({
      livreurId: Joi.string().custom(objectId).required().description('ID du livreur à assigner'),
    })
    .required(),
};

// Validation pour obtenir les statistiques des livraisons
const getDeliveryStats = {
  query: Joi.object().keys({
    livreurId: Joi.string().custom(objectId).optional().description('ID du livreur pour des statistiques spécifiques'),
  }),
};

// Validation pour calculer la distance entre deux points pour une livraison
const calculateDeliveryDistance = {
  body: Joi.object()
    .keys({
      startCoords: Joi.object()
        .keys({
          latitude: Joi.number().required().description('Latitude du point de départ'),
          longitude: Joi.number().required().description('Longitude du point de départ'),
        })
        .required(),
      endCoords: Joi.object()
        .keys({
          latitude: Joi.number().required().description('Latitude du point de destination'),
          longitude: Joi.number().required().description('Longitude du point de destination'),
        })
        .required(),
    })
    .required(),
};

// Validation pour obtenir l'historique des livraisons
const getDeliveryHistory = {
  query: Joi.object().keys({
    page: Joi.number().integer().default(1).description('Numéro de la page pour la pagination'),
    limit: Joi.number().integer().default(10).description('Nombre d’éléments par page'),
    status: Joi.string()
      .valid('pending', 'in_progress', 'delivered', 'cancelled')
      .optional()
      .description('Filtrer par statut de livraison'),
    startDate: Joi.date().optional().description('Filtrer par date de début'),
    endDate: Joi.date().optional().description('Filtrer par date de fin'),
  }),
};

module.exports = {
  createDelivery,
  getDeliveryById,
  updateDeliveryStatus,
  deleteDelivery,
  assignDelivery,
  getDeliveryStats,
  calculateDeliveryDistance,
  getDeliveryHistory,
};
