const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const notificationSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ['order_update', 'promotion', 'system', 'custom'], // Ajout du type "custom"
      required: true,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    channels: {
      type: [String],
      enum: ['in_app', 'push', 'email', 'sms'], // Ajout de "sms" pour les notifications par message
      default: ['in_app'],
    },
    deliveryStatus: {
      inApp: { type: Boolean, default: true }, // Toujours livré pour in_app
      push: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
      email: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
      sms: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' }, // Suivi pour "sms"
    },
    deliveryAttempts: {
      type: Number,
      default: 0, // Compte les tentatives d'envoi
    },
    failureReason: {
      type: String, // Enregistre la raison d'échec si applicable
    },
    expiresAt: {
      type: Date, // Notifications obsolètes
      default: null,
    },
    archived: {
      type: Boolean,
      default: false, // Marque les notifications archivées
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'], // Ajout d'un niveau de priorité
      default: 'medium',
    },
    groupId: {
      type: String, // Permet de regrouper des notifications similaires
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Ajouter les plugins
notificationSchema.plugin(toJSON);
notificationSchema.plugin(paginate);

// Index pour optimiser les recherches
notificationSchema.index({ user: 1, isRead: 1, type: 1, priority: 1 }); // Index combiné pour recherche efficace
notificationSchema.index({ expiresAt: 1 });
notificationSchema.index({ archived: 1 });

/**
 * Marquer une notification comme lue
 */
notificationSchema.methods.markAsRead = async function () {
  this.isRead = true;
  await this.save();
};

/**
 * Archiver une notification
 */
notificationSchema.methods.archive = async function () {
  this.archived = true;
  await this.save();
};

/**
 * Mettre à jour l'état de livraison pour un canal spécifique
 * @param {String} channel - Canal à mettre à jour ('push', 'email', 'sms')
 * @param {String} status - Statut de livraison ('pending', 'sent', 'failed')
 * @param {String} reason - (Optionnel) Raison de l'échec
 */
notificationSchema.methods.updateDeliveryStatus = async function (channel, status, reason = null) {
  if (['push', 'email', 'sms'].includes(channel) && ['pending', 'sent', 'failed'].includes(status)) {
    this.deliveryStatus[channel] = status;
    if (status === 'failed' && reason) {
      this.failureReason = reason;
    }
    this.deliveryAttempts += 1; // Incrémenter les tentatives
    await this.save();
  } else {
    throw new Error(`Invalid channel or status: channel=${channel}, status=${status}`);
  }
};

/**
 * Récupérer les notifications non lues pour un utilisateur
 * @param {ObjectId} userId - L'ID de l'utilisateur
 * @returns {Promise<Array>}
 */
notificationSchema.statics.getUnreadNotifications = async function (userId) {
  return this.find({ user: userId, isRead: false, archived: false });
};

/**
 * Supprimer les notifications obsolètes pour un utilisateur
 * @param {ObjectId} userId - L'ID de l'utilisateur
 * @returns {Promise<Number>} - Nombre de notifications supprimées
 */
notificationSchema.statics.deleteObsoleteNotifications = async function (userId) {
  const now = new Date();
  const result = await this.deleteMany({ user: userId, expiresAt: { $lte: now } });
  return result.deletedCount;
};

/**
 * Récupérer les notifications prioritaires
 * @param {String} priority - Niveau de priorité ('low', 'medium', 'high')
 * @returns {Promise<Array>}
 */
notificationSchema.statics.getPriorityNotifications = async function (priority) {
  return this.find({ priority }).sort({ createdAt: -1 });
};

/**
 * Grouper les notifications par groupId
 * @param {String} groupId - Identifiant du groupe
 * @returns {Promise<Array>}
 */
notificationSchema.statics.getGroupedNotifications = async function (groupId) {
  return this.find({ groupId }).sort({ createdAt: -1 });
};

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
