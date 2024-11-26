const mongoose = require('mongoose');
const { roleRights } = require('../config/roles');

const supportSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    permissions: [
      {
        type: String,
        enum: roleRights.get('support'),
        required: true,
      },
    ],
    ticketsAssigned: [
      {
        ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' },
        assignedAt: { type: Date, default: Date.now },
      },
    ],
    performanceStatistics: {
      ticketsResolved: { type: Number, default: 0 },
      averageResponseTime: { type: Number, default: 0 },
      medianResponseTime: { type: Number, default: 0 },
      satisfactionScore: { type: Number, default: 0 },
      weekly: {
        type: Map,
        of: Number,
        default: {}, // Clés : `YYYY-WW`
      },
      monthly: {
        type: Map,
        of: Number,
        default: {}, // Clés : `YYYY-MM`
      },
    },
    maxOpenTickets: {
      type: Number,
      default: 10,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * Ajouter un ticket à l'agent.
 * @param {ObjectId} ticketId - ID du ticket à assigner
 */
supportSchema.methods.addTicket = async function (ticketId) {
  if (this.isTicketAlreadyAssigned(ticketId)) {
    throw new Error('Ticket already assigned.');
  }

  if (!this.canTakeMoreTickets()) {
    throw new Error('Agent cannot take more tickets.');
  }

  this.ticketsAssigned.push({ ticketId });
  await this.save();
};

/**
 * Vérifier si un ticket est déjà assigné.
 * @param {ObjectId} ticketId - ID du ticket
 * @returns {boolean}
 */
supportSchema.methods.isTicketAlreadyAssigned = function (ticketId) {
  return this.ticketsAssigned.some((ticket) => ticket.ticketId.toString() === ticketId.toString());
};

/**
 * Mettre à jour les performances de l'agent.
 * @param {number} responseTime - Temps de réponse du ticket en minutes
 * @param {number} satisfaction - Score de satisfaction pour ce ticket
 */
supportSchema.methods.updatePerformance = async function (responseTime, satisfaction) {
  const totalResolved = this.performanceStatistics.ticketsResolved;
  const currentAverage = this.performanceStatistics.averageResponseTime;

  // Mise à jour du temps moyen de réponse
  this.performanceStatistics.averageResponseTime = (currentAverage * totalResolved + responseTime) / (totalResolved + 1);

  // Mise à jour du score de satisfaction
  const currentSatisfaction = this.performanceStatistics.satisfactionScore;
  this.performanceStatistics.satisfactionScore = (currentSatisfaction * totalResolved + satisfaction) / (totalResolved + 1);

  // Mise à jour des statistiques temporelles
  const now = new Date();
  const currentWeek = `${now.getFullYear()}-${Math.ceil(now.getDate() / 7)}`;
  const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;

  this.performanceStatistics.weekly.set(currentWeek, (this.performanceStatistics.weekly.get(currentWeek) || 0) + 1);
  this.performanceStatistics.monthly.set(currentMonth, (this.performanceStatistics.monthly.get(currentMonth) || 0) + 1);

  this.performanceStatistics.ticketsResolved += 1;

  await this.save();
};

/**
 * Vérifier si un agent peut être assigné à un nouveau ticket.
 * @returns {Boolean}
 */
supportSchema.methods.canTakeMoreTickets = function () {
  return this.ticketsAssigned.length < this.maxOpenTickets;
};

/**
 * Récupérer les tickets les plus prioritaires pour un agent.
 * @returns {Array}
 */
supportSchema.methods.getHighestPriorityTickets = async function () {
  const Ticket = mongoose.model('Ticket');
  const openTickets = await Ticket.find({ status: 'open' }).sort({ priority: -1, createdAt: 1 });
  return openTickets.slice(0, this.maxOpenTickets - this.ticketsAssigned.length);
};

/**
 * Vérifier les permissions spécifiques de l'agent.
 * @param {string} permission - Nom de la permission à vérifier
 * @returns {boolean}
 */
supportSchema.methods.hasPermission = function (permission) {
  return this.permissions.includes(permission);
};

const Support = mongoose.model('Support', supportSchema);

module.exports = Support;
