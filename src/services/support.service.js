// eslint-disable-next-line no-unused-vars
const mongoose = require('mongoose');
const httpStatus = require('http-status');
const { Support, Ticket } = require('../models');
const ApiError = require('../utils/ApiError');

/**
 * Récupérer les tickets prioritaires pour un agent spécifique.
 * @param {ObjectId} agentId - ID de l'agent de support.
 * @returns {Promise<Array>}
 */
const getPriorityTickets = async (agentId) => {
  const agent = await Support.findById(agentId);
  if (!agent) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Agent de support non trouvé');
  }

  return Ticket.find({ priority: 'high', status: 'open', assignedTo: null }).sort({ createdAt: -1 }).limit(5).lean();
};

/**
 * Récupérer les tickets ouverts pour un agent avec filtres et pagination.
 * @param {ObjectId} agentId - ID de l'agent.
 * @param {Object} options - Options de pagination et de filtre.
 * @returns {Promise<Object>}
 */
const getOpenTickets = async (agentId, options) => {
  const agent = await Support.findById(agentId);
  if (!agent) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Agent de support non trouvé');
  }

  const filters = {
    priority: options.filters.priority || { $exists: true },
    status: options.filters.status || 'open',
    keyword: options.filters.keyword ? { description: new RegExp(options.filters.keyword, 'i') } : { $exists: true },
  };

  const tickets = await Ticket.paginate(filters, {
    page: options.page,
    limit: options.limit,
    sort: { createdAt: -1 },
  });

  return tickets;
};

/**
 * Assigner un ticket à un agent spécifique avec validation.
 * @param {ObjectId} ticketId - ID du ticket.
 * @param {ObjectId} agentId - ID de l'agent.
 * @returns {Promise<Object>}
 */
const assignTicket = async (ticketId, agentId) => {
  const agent = await Support.findById(agentId);
  if (!agent) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Agent de support non trouvé');
  }

  if (!agent.canTakeMoreTickets()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Cet agent ne peut plus accepter de tickets');
  }

  if (agent.isTicketAlreadyAssigned(ticketId)) {
    throw new ApiError(httpStatus.CONFLICT, 'Le ticket est déjà assigné à cet agent');
  }

  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Ticket non trouvé');
  }

  ticket.assignedTo = agentId;
  ticket.status = 'assigned';
  await ticket.save();

  agent.addTicket(ticketId);

  return ticket;
};

/**
 * Mettre à jour l'état d'un ticket.
 * @param {ObjectId} ticketId - ID du ticket.
 * @param {String} newStatus - Nouveau statut du ticket.
 * @returns {Promise<Object>}
 */
const updateTicketStatus = async (ticketId, newStatus) => {
  const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
  if (!validStatuses.includes(newStatus)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Statut de ticket invalide');
  }

  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Ticket non trouvé');
  }

  ticket.previousStatus = ticket.status; // Suivi de l'ancien statut
  ticket.status = newStatus;
  await ticket.save();

  return ticket;
};

/**
 * Obtenir l'historique des tickets d'un utilisateur.
 * @param {ObjectId} userId - ID de l'utilisateur.
 * @param {Object} options - Options de pagination.
 * @returns {Promise<Object>}
 */
const getUserTickets = async (userId, options) => {
  return Ticket.paginate(
    { client: userId },
    {
      page: options.page,
      limit: options.limit,
      sort: { createdAt: -1 },
    }
  );
};

/**
 * Récupérer des statistiques globales pour le support.
 * @returns {Promise<Object>}
 */
const getSupportStats = async () => {
  const stats = {
    totalTickets: await Ticket.countDocuments(),
    openTickets: await Ticket.countDocuments({ status: 'open' }),
    resolvedTickets: await Ticket.countDocuments({ status: 'resolved' }),
  };

  // Statistiques hebdomadaires et mensuelles
  const weeklyStats = await Ticket.aggregate([
    {
      $group: {
        _id: { $week: '$createdAt' },
        total: { $sum: 1 },
      },
    },
  ]);

  const monthlyStats = await Ticket.aggregate([
    {
      $group: {
        _id: { $month: '$createdAt' },
        total: { $sum: 1 },
      },
    },
  ]);

  return {
    ...stats,
    weekly: weeklyStats,
    monthly: monthlyStats,
  };
};

module.exports = {
  getPriorityTickets,
  getOpenTickets,
  assignTicket,
  updateTicketStatus,
  getUserTickets,
  getSupportStats,
};
