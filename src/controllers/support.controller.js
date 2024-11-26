const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { supportService, notificationService } = require('../services');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

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
 * Obtenir les tickets prioritaires assignables.
 */
const getPriorityTickets = catchAsync(async (req, res) => {
  logger.info(`Récupération des tickets prioritaires pour l'agent : SupportID=${req.user.id}`);

  const priorityTickets = await trackPerformance(() => supportService.getPriorityTickets(req.user.id), 'getPriorityTickets');

  logger.info(`Tickets prioritaires récupérés avec succès : Total=${priorityTickets.length}`);
  res.status(httpStatus.OK).send(priorityTickets);
});

/**
 * Obtenir tous les tickets ouverts avec filtres et pagination.
 */
const getOpenTickets = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, priority, status, keyword } = req.query;
  logger.info(`Récupération des tickets ouverts pour l'agent : SupportID=${req.user.id}`);

  const filters = {
    priority,
    status,
    keyword,
  };

  const tickets = await trackPerformance(
    () => supportService.getOpenTickets(req.user.id, { page, limit, filters }),
    'getOpenTickets'
  );

  logger.info(`Tickets ouverts récupérés : Total=${tickets.totalResults}`);
  res.status(httpStatus.OK).send(tickets);
});

/**
 * Assigner un ticket à un agent spécifique avec validation stricte.
 */
const assignTicket = catchAsync(async (req, res) => {
  logger.info(
    `Tentative d'assignation du ticket : TicketID=${req.params.ticketId} à l'agent : SupportID=${req.body.agentId}`
  );

  const isAssigned = await supportService.isTicketAlreadyAssigned(req.params.ticketId);
  if (isAssigned) {
    throw new ApiError(httpStatus.CONFLICT, 'Le ticket est déjà assigné à un autre agent.');
  }

  const agent = await supportService.getAgent(req.body.agentId);
  if (!agent.canTakeMoreTickets()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Cet agent ne peut plus accepter de tickets.');
  }

  const ticket = await trackPerformance(
    () => supportService.assignTicket(req.params.ticketId, req.body.agentId),
    'assignTicket'
  );

  logger.info(`Ticket assigné avec succès : TicketID=${req.params.ticketId} à SupportID=${req.body.agentId}`);
  res.status(httpStatus.OK).send(ticket);
});

/**
 * Mettre à jour l'état d'un ticket avec notification enrichie.
 */
const updateTicketStatus = catchAsync(async (req, res) => {
  logger.info(`Mise à jour de l'état du ticket : TicketID=${req.params.ticketId} à NewStatus=${req.body.status}`);

  const updatedTicket = await trackPerformance(
    () => supportService.updateTicketStatus(req.params.ticketId, req.body.status),
    'updateTicketStatus'
  );

  if (req.body.status === 'resolved') {
    await notificationService.notifyClient(
      updatedTicket.client,
      `Votre ticket : TicketID=${req.params.ticketId} est passé de l'état "${updatedTicket.previousStatus}" à "résolu".`
    );
  }

  logger.info(`État du ticket mis à jour avec succès : TicketID=${req.params.ticketId}`);
  res.status(httpStatus.OK).send(updatedTicket);
});

/**
 * Obtenir l'historique des tickets pour un utilisateur avec pagination.
 */
const getUserTickets = catchAsync(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  logger.info(`Récupération de l'historique des tickets pour l'utilisateur : UserID=${req.params.userId}`);

  const tickets = await trackPerformance(
    () => supportService.getUserTickets(req.params.userId, { page, limit }),
    'getUserTickets'
  );

  logger.info(`Historique des tickets récupéré avec succès : Total=${tickets.totalResults}`);
  res.status(httpStatus.OK).send(tickets);
});

/**
 * Obtenir des statistiques globales du support avec données temporelles.
 */
const getSupportStats = catchAsync(async (req, res) => {
  logger.info(`Récupération des statistiques globales pour le support.`);

  const stats = await trackPerformance(() => supportService.getSupportStats(), 'getSupportStats');

  // Ajouter les données temporelles dans les réponses
  const enrichedStats = {
    ...stats,
    weeklyStats: stats.weekly,
    monthlyStats: stats.monthly,
  };

  logger.info(`Statistiques globales du support récupérées avec succès`);
  res.status(httpStatus.OK).send(enrichedStats);
});

module.exports = {
  getPriorityTickets, // Nouvelle méthode
  getOpenTickets,
  assignTicket,
  updateTicketStatus,
  getUserTickets,
  getSupportStats,
};
