const Joi = require('joi');
const { objectId } = require('./custom.validation');

const createNotification = {
  body: Joi.object().keys({
    userId: Joi.string().required().custom(objectId).description("ID de l'utilisateur cible"),
    message: Joi.string().required().description('Contenu de la notification'),
    type: Joi.string().required().valid('order_update', 'promotion', 'system', 'custom').description('Type de notification'),
    channels: Joi.array()
      .items(Joi.string().valid('in_app', 'push', 'email', 'sms'))
      .default(['in_app'])
      .description('Liste des canaux d’envoi'),
    priority: Joi.string().valid('low', 'medium', 'high').default('medium').description('Priorité de la notification'),
    expiresAt: Joi.date().optional().description("Date d'expiration de la notification"),
    groupId: Joi.string().optional().description('Identifiant de regroupement de notifications similaires'),
  }),
};

const getUserNotifications = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1).default(1).description('Numéro de page'),
    limit: Joi.number().integer().min(1).default(10).description('Nombre d’éléments par page'),
    type: Joi.string()
      .valid('order_update', 'promotion', 'system', 'custom')
      .optional()
      .description('Filtrer par type de notification'),
    priority: Joi.string().valid('low', 'medium', 'high').optional().description('Priorité des notifications'),
    search: Joi.string().optional().description('Recherche textuelle dans le message'),
  }),
};

const markAsRead = {
  params: Joi.object().keys({
    notificationId: Joi.string().required().custom(objectId).description('ID de la notification'),
  }),
};

const deleteNotification = {
  params: Joi.object().keys({
    notificationId: Joi.string().required().custom(objectId).description('ID de la notification'),
  }),
};

const getPriorityNotifications = {
  query: Joi.object().keys({
    priority: Joi.string().required().valid('low', 'medium', 'high').description('Priorité des notifications à récupérer'),
  }),
};

module.exports = {
  createNotification,
  getUserNotifications,
  markAsRead,
  deleteNotification,
  getPriorityNotifications,
};
