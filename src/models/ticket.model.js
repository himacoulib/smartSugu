const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const ticketSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Support',
      default: null,
    },
    description: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    resolution: {
      type: String,
    },
    keywords: [
      {
        type: String,
        validate: {
          validator: (v) => v.length <= 20, // Limitation à 20 caractères par mot-clé
          message: 'Chaque mot-clé doit contenir 20 caractères maximum.',
        },
      },
    ],
    averageResolutionTime: {
      type: Number,
      default: 0,
    },
    escalationLevel: {
      type: String,
      enum: ['level_1', 'level_2', 'level_3'],
      default: 'level_1',
    },
    escalationHistory: [
      {
        level: {
          type: String,
          enum: ['level_1', 'level_2', 'level_3'],
        },
        reason: {
          type: String,
        },
        escalatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Support',
        },
        date: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    resolutionTime: {
      type: Number,
    },
    statusChangeHistory: [
      {
        previousStatus: { type: String },
        newStatus: { type: String },
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Ajouter les plugins
ticketSchema.plugin(toJSON);
ticketSchema.plugin(paginate);

// Index pour améliorer les performances de tri et recherche
ticketSchema.index({ status: 1, priority: 1 });
ticketSchema.index({ keywords: 1 });

/**
 * Fermer un ticket avec mise à jour de la durée de résolution et historique des statuts.
 * @param {String} resolution - Résolution associée.
 */
ticketSchema.methods.closeTicket = async function (resolution) {
  const now = new Date();
  const resolutionTime = (now - this.createdAt) / (1000 * 60); // Durée en minutes

  // Mise à jour des champs liés
  this.resolutionTime = resolutionTime;
  this.averageResolutionTime = resolutionTime;
  this.statusChangeHistory.push({
    previousStatus: this.status,
    newStatus: 'closed',
  });
  this.status = 'closed';
  this.resolution = resolution;

  await this.save();
};

/**
 * Escalader un ticket avec gestion de l'historique.
 * @param {String} newLevel - Nouveau niveau d'escalade.
 * @param {String} reason - Raison de l'escalade.
 * @param {ObjectId} escalatedBy - ID de l'agent ayant initié l'escalade.
 */
ticketSchema.methods.escalateTicket = async function (newLevel, reason, escalatedBy) {
  if (!['level_1', 'level_2', 'level_3'].includes(newLevel)) {
    throw new Error('Invalid escalation level');
  }

  // Historique de l'escalade
  this.escalationHistory.push({
    level: newLevel,
    reason,
    escalatedBy,
  });

  this.escalationLevel = newLevel;
  await this.save();
};

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
