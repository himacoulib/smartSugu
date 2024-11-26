const httpStatus = require('http-status');
const Ticket = require('../models/ticket.model');
const Support = require('../models/support.model');
const ApiError = require('../utils/ApiError');

/**
 * Créer un ticket.
 * @param {ObjectId} userId - ID de l'utilisateur.
 * @param {Object} ticketData - Données du ticket.
 * @returns {Promise<Ticket>}
 */
const createTicket = async (userId, ticketData) => {
  const ticket = new Ticket({
    user: userId,
    ...ticketData,
  });

  await ticket.save();
  return ticket;
};

/**
 * Liste des tickets avec filtres et pagination.
 * @param {Object} queryParams - Paramètres de requête.
 * @param {Object} filters - Filtres (status, priority, keywords, escalationLevel).
 * @returns {Promise<Object>}
 */
const listTickets = async ({ page, limit, sortBy, order, filters }) => {
  const query = {};

  if (filters.status) query.status = filters.status;
  if (filters.priority) query.priority = filters.priority;
  if (filters.keywords) query.keywords = { $in: filters.keywords };
  if (filters.escalationLevel) query.escalationLevel = filters.escalationLevel;

  const options = {
    page,
    limit,
    sort: { [sortBy]: order === 'asc' ? 1 : -1 },
  };

  return Ticket.paginate(query, options);
};

/**
 * Mettre à jour l’état d’un ticket.
 * @param {ObjectId} ticketId - ID du ticket.
 * @param {String} newStatus - Nouveau statut du ticket.
 * @returns {Promise<Ticket>}
 */
const updateTicketStatus = async (ticketId, newStatus) => {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Ticket not found');
  }

  if (ticket.status === 'closed') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot update a closed ticket');
  }

  ticket.status = newStatus;
  await ticket.save();

  return ticket;
};

/**
 * Assigner un ticket à un agent.
 * @param {ObjectId} ticketId - ID du ticket.
 * @param {ObjectId} agentId - ID de l'agent.
 * @returns {Promise<Ticket>}
 */
const assignTicket = async (ticketId, agentId) => {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Ticket not found');
  }

  const agent = await Support.findById(agentId);
  if (!agent) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Agent not found');
  }

  if (!agent.canTakeMoreTickets()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Agent has reached the maximum number of tickets');
  }

  ticket.assignedAgent = agentId;
  await ticket.save();

  await agent.addTicket(ticketId);
  return ticket;
};

/**
 * Escalader un ticket.
 * @param {ObjectId} ticketId - ID du ticket.
 * @param {String} newLevel - Nouveau niveau d’escalade.
 * @param {String} reason - Raison de l’escalade.
 * @param {ObjectId} escalatedBy - ID de l’agent ayant initié l’escalade.
 * @returns {Promise<Ticket>}
 */
const escalateTicket = async (ticketId, newLevel, reason, escalatedBy) => {
  const ticket = await Ticket.findById(ticketId);
  if (!ticket) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Ticket not found');
  }

  ticket.escalationLevel = newLevel;
  ticket.resolution = `Escalated by AgentID=${escalatedBy}: ${reason}`;
  await ticket.save();

  return ticket;
};

/**
 * Obtenir les tickets d’un utilisateur.
 * @param {ObjectId} userId - ID de l'utilisateur.
 * @param {Object} queryParams - Paramètres de requête (pagination).
 * @returns {Promise<Object>}
 */
const getUserTickets = async (userId, { page, limit }) => {
  const query = { user: userId };
  const options = { page, limit, sort: { createdAt: -1 } };

  return Ticket.paginate(query, options);
};

/**
 * Calculer des statistiques avancées sur les tickets.
 * @returns {Promise<Object>}
 */
const getAdvancedStats = async () => {
  const totalTickets = await Ticket.countDocuments();
  const openTickets = await Ticket.countDocuments({ status: 'open' });
  const resolvedTickets = await Ticket.countDocuments({ status: 'resolved' });
  const averageResolutionTime = await Ticket.aggregate([
    { $match: { resolutionTime: { $exists: true } } },
    { $group: { _id: null, avgResolution: { $avg: '$resolutionTime' } } },
  ]);

  return {
    totalTickets,
    openTickets,
    resolvedTickets,
    averageResolutionTime: averageResolutionTime[0]?.avgResolution || 0,
  };
};

module.exports = {
  createTicket,
  listTickets,
  updateTicketStatus,
  assignTicket,
  escalateTicket,
  getUserTickets,
  getAdvancedStats,
};
