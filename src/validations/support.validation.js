const Joi = require('joi');
const { objectId } = require('./custom.validation');

const getPriorityTickets = {
  params: Joi.object().keys({
    agentId: Joi.string().custom(objectId).required(),
  }),
};

const getOpenTickets = {
  query: Joi.object().keys({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1),
    priority: Joi.string().valid('low', 'medium', 'high'),
    status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed'),
    keyword: Joi.string().allow(null, ''),
  }),
};

const assignTicket = {
  params: Joi.object().keys({
    ticketId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    agentId: Joi.string().custom(objectId).required(),
  }),
};

const updateTicketStatus = {
  params: Joi.object().keys({
    ticketId: Joi.string().custom(objectId).required(),
  }),
  body: Joi.object().keys({
    status: Joi.string().valid('open', 'in_progress', 'resolved', 'closed').required(),
  }),
};

const getUserTickets = {
  params: Joi.object().keys({
    userId: Joi.string().custom(objectId).required(),
  }),
  query: Joi.object().keys({
    page: Joi.number().integer().min(1),
    limit: Joi.number().integer().min(1),
  }),
};

const getSupportStats = {
  query: Joi.object().keys({
    timeframe: Joi.string().valid('weekly', 'monthly', 'yearly').optional(),
  }),
};

module.exports = {
  getPriorityTickets,
  getOpenTickets,
  assignTicket,
  updateTicketStatus,
  getUserTickets,
  getSupportStats,
};
