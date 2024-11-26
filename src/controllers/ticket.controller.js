const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { ticketService, notificationService } = require('../services');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');
const Joi = require('joi');

/**
 * Suivi des performances pour mesurer le temps d'exécution des méthodes.
 * @param {Function} fn - Méthode à exécuter.
 * @param {string} action - Nom de l'action à loguer.
 */
const trackPerformance = async (fn, action) => {
  const startTime = Date.now();
  const result = await fn();
  const endTime = Date.now();
  logger.info(`[PERFORMANCE] Action=${action} - ExecutionTime=${endTime - startTime}ms`);
  return result;
};

/**
 * Créer un ticket avec validation stricte.
 */
const createTicket = catchAsync(async (req, res) => {
  logger.info(`[REQUEST] Création d'un ticket, UserID=${req.user.id}, IP=${req.ip}`);

  const schema = Joi.object({
    description: Joi.string().required().min(10).max(500),
    priority: Joi.string().valid('low', 'medium', 'high').default('medium'),
    keywords: Joi.array().items(Joi.string().max(20)).optional(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  }

  const ticket = await trackPerformance(() => ticketService.createTicket(req.user.id, req.body), 'createTicket');

  // Notification à l'agent assigné (si applicable)
  if (ticket.assignedAgent) {
    await notificationService.notifySupportAgent(
      ticket.assignedAgent,
      `Un nouveau ticket vous a été assigné : TicketID=${ticket.id}`
    );
  }

  logger.info(`[SUCCESS] Ticket créé avec succès : TicketID=${ticket.id}`);
  res.status(httpStatus.CREATED).send(ticket);
});

/**
 * Récupérer une liste de tickets avec filtres avancés.
 */
const listTickets = catchAsync(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    status,
    priority,
    keywords,
    escalationLevel,
    sortBy = 'createdAt',
    order = 'desc',
  } = req.query;

  logger.info(
    `[REQUEST] Liste des tickets demandée avec pagination et filtres avancés, UserID=${req.user.id}, Page=${page}, Limit=${limit}`
  );

  const filters = { status, priority, keywords, escalationLevel };
  const tickets = await trackPerformance(
    () => ticketService.listTickets({ page, limit, filters, sortBy, order }),
    'listTickets'
  );

  logger.info(`[SUCCESS] Liste des tickets récupérée : Total=${tickets.totalResults}`);
  res.status(httpStatus.OK).send(tickets);
});

/**
 * Assigner un ticket à un agent.
 */
const assignTicket = catchAsync(async (req, res) => {
  const schema = Joi.object({
    agentId: Joi.string().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  }

  logger.info(`[REQUEST] Assignation du ticket : TicketID=${req.params.ticketId} à l'agent : AgentID=${req.body.agentId}`);

  const updatedTicket = await trackPerformance(
    () => ticketService.assignTicket(req.params.ticketId, req.body.agentId),
    'assignTicket'
  );

  // Notification à l'agent assigné
  await notificationService.notifySupportAgent(
    req.body.agentId,
    `Un ticket vous a été assigné : TicketID=${req.params.ticketId}`
  );

  logger.info(`[SUCCESS] Ticket assigné avec succès : TicketID=${req.params.ticketId}, AgentID=${req.body.agentId}`);
  res.status(httpStatus.OK).send(updatedTicket);
});

/**
 * Mettre à jour l'état d'un ticket.
 */
const updateTicketStatus = catchAsync(async (req, res) => {
  const schema = Joi.object({
    status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed').required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  }

  logger.info(`[REQUEST] Mise à jour de l'état du ticket : TicketID=${req.params.ticketId} à NewStatus=${req.body.status}`);

  const updatedTicket = await trackPerformance(
    () => ticketService.updateTicketStatus(req.params.ticketId, req.body.status),
    'updateTicketStatus'
  );

  // Notification au client si le ticket est résolu
  if (req.body.status === 'resolved') {
    await notificationService.notifyClient(
      updatedTicket.user,
      `Votre ticket : TicketID=${req.params.ticketId} a été résolu.`
    );
  }

  logger.info(`[SUCCESS] État du ticket mis à jour : TicketID=${req.params.ticketId}, Status=${req.body.status}`);
  res.status(httpStatus.OK).send(updatedTicket);
});

/**
 * Escalader un ticket.
 */
const escalateTicket = catchAsync(async (req, res) => {
  const schema = Joi.object({
    level: Joi.string().valid('level_2', 'level_3').required(),
    reason: Joi.string().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    throw new ApiError(httpStatus.BAD_REQUEST, error.details[0].message);
  }

  logger.info(`[REQUEST] Escalade du ticket : TicketID=${req.params.ticketId} à Level=${req.body.level}`);

  const escalatedTicket = await trackPerformance(
    () => ticketService.escalateTicket(req.params.ticketId, req.body.level, req.body.reason, req.user.id),
    'escalateTicket'
  );

  logger.info(`[SUCCESS] Ticket escaladé avec succès : TicketID=${req.params.ticketId}, Level=${req.body.level}`);
  res.status(httpStatus.OK).send(escalatedTicket);
});

/**
 * Récupérer des statistiques avancées des tickets.
 */
const getTicketStats = catchAsync(async (req, res) => {
  logger.info(`[REQUEST] Statistiques avancées des tickets demandées`);

  const stats = await trackPerformance(() => ticketService.getAdvancedStats(), 'getTicketStats');

  logger.info(`[SUCCESS] Statistiques des tickets récupérées avec succès`);
  res.status(httpStatus.OK).send(stats);
});

module.exports = {
  createTicket,
  listTickets,
  assignTicket,
  updateTicketStatus,
  escalateTicket,
  getTicketStats,
};
