const httpStatus = require('http-status');
const { Client, Order, Refund, Rating } = require('../models');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

/**
 * Créer un client.
 * @param {Object} clientBody
 * @returns {Promise<Client>}
 */
const createClient = async (clientBody) => {
  logger.info('Création d’un nouveau client.');
  const client = await Client.create(clientBody);
  logger.info(`Client créé avec succès : ClientID=${client.id}`);
  return client;
};

/**
 * Obtenir les informations d’un client par ID.
 * @param {ObjectId} clientId
 * @returns {Promise<Client>}
 */
const getClientById = async (clientId) => {
  const client = await Client.findById(clientId).populate('user').populate('orders');
  if (!client) {
    logger.warn(`Client non trouvé : ClientID=${clientId}`);
    throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
  }
  return client;
};

/**
 * Mettre à jour le profil d’un client.
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<Client>}
 */
const updateClientProfile = async (userId, updateBody) => {
  const client = await Client.findOne({ user: userId });
  if (!client) {
    logger.warn(`Client non trouvé pour UserID=${userId}`);
    throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
  }
  Object.assign(client, updateBody);
  await client.save();
  logger.info(`Profil mis à jour pour ClientID=${client.id}`);
  return client;
};

/**
 * Ajouter une adresse au profil d’un client.
 * @param {ObjectId} userId
 * @param {Object} addressBody
 * @returns {Promise<Client>}
 */
const addAddress = async (userId, addressBody) => {
  const client = await Client.findOne({ user: userId });
  if (!client) {
    logger.warn(`Client non trouvé pour UserID=${userId}`);
    throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
  }
  client.addresses.push(addressBody);
  await client.save();
  logger.info(`Adresse ajoutée avec succès pour ClientID=${client.id}`);
  return client;
};

/**
 * Mettre à jour une adresse existante.
 * @param {ObjectId} userId
 * @param {ObjectId} addressId
 * @param {Object} updateBody
 * @returns {Promise<Client>}
 */
const updateAddress = async (userId, addressId, updateBody) => {
  const client = await Client.findOne({ user: userId });
  if (!client) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
  }
  const addressIndex = client.addresses.findIndex((addr) => addr.id.toString() === addressId.toString());
  if (addressIndex === -1) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Address not found');
  }
  Object.assign(client.addresses[addressIndex], updateBody);
  await client.save();
  logger.info(`Adresse mise à jour pour AddressID=${addressId}`);
  return client;
};

/**
 * Supprimer une adresse existante.
 * @param {ObjectId} userId
 * @param {ObjectId} addressId
 * @returns {Promise<Client>}
 */
const deleteAddress = async (userId, addressId) => {
  const client = await Client.findOne({ user: userId });
  if (!client) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
  }
  client.addresses = client.addresses.filter((addr) => addr.id.toString() !== addressId.toString());
  await client.save();
  logger.info(`Adresse supprimée pour AddressID=${addressId}`);
  return client;
};

/**
 * Passer une commande.
 * @param {ObjectId} userId
 * @param {Object} orderBody
 * @returns {Promise<Order>}
 */
const placeOrder = async (userId, orderBody) => {
  const client = await Client.findOne({ user: userId });
  if (!client) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
  }
  const order = await Order.create({ ...orderBody, client: client.id });
  client.orders.push(order.id);
  await client.save();
  logger.info(`Commande passée pour ClientID=${client.id}`);
  return order;
};

/**
 * Annuler une commande.
 * @param {ObjectId} userId
 * @param {ObjectId} orderId
 * @returns {Promise<Order>}
 */
const cancelOrder = async (userId, orderId) => {
  const client = await Client.findOne({ user: userId });
  if (!client) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
  }
  const orderIndex = client.orders.findIndex((order) => order.toString() === orderId.toString());
  if (orderIndex === -1) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
  }
  const order = await Order.findById(orderId);
  if (order.status !== 'pending') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Only pending orders can be canceled');
  }
  order.status = 'canceled';
  await order.save();
  client.orders.splice(orderIndex, 1);
  await client.save();
  logger.info(`Commande annulée pour OrderID=${orderId}`);
  return order;
};

/**
 * Récupérer l’historique des commandes.
 * @param {ObjectId} userId
 * @param {Object} filters
 * @returns {Promise<Array<Order>>}
 */
const getOrderHistory = async (userId, filters) => {
  const client = await Client.findOne({ user: userId });
  if (!client) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
  }
  const query = { client: client.id };
  if (filters.startDate || filters.endDate) {
    query.createdAt = {};
    if (filters.startDate) query.createdAt.$gte = new Date(filters.startDate);
    if (filters.endDate) query.createdAt.$lte = new Date(filters.endDate);
  }
  const orders = await Order.find(query).sort({ [filters.sortBy || 'createdAt']: filters.order === 'asc' ? 1 : -1 });
  logger.info(`Historique des commandes récupéré pour ClientID=${client.id}`);
  return orders;
};

/**
 * Demander un remboursement.
 * @param {ObjectId} userId
 * @param {Object} refundBody
 * @returns {Promise<Refund>}
 */
const requestRefund = async (userId, refundBody) => {
  const client = await Client.findOne({ user: userId });
  if (!client) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
  }
  if (client.hasRequestedRefund(refundBody.orderId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Refund already requested for this order');
  }
  const refund = await Refund.create({ ...refundBody, client: client.id });
  client.refunds.push(refund.id);
  await client.save();
  logger.info(`Demande de remboursement effectuée pour ClientID=${client.id}`);
  return refund;
};

/**
 * Ajouter une évaluation.
 * @param {ObjectId} userId
 * @param {Object} ratingBody
 * @returns {Promise<Rating>}
 */
const addRating = async (userId, ratingBody) => {
  const client = await Client.findOne({ user: userId });
  if (!client) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
  }
  const rating = await Rating.create({ ...ratingBody, client: client.id });
  client.ratings.push(rating.id);
  await client.save();
  logger.info(`Évaluation ajoutée pour ClientID=${client.id}`);
  return rating;
};

/**
 * Obtenir les évaluations d’un client.
 * @param {ObjectId} userId
 * @returns {Promise<Array<Rating>>}
 */
const getRatings = async (userId) => {
  const client = await Client.findOne({ user: userId }).populate('ratings');
  if (!client) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Client not found');
  }
  logger.info(`Évaluations récupérées pour ClientID=${client.id}`);
  return client.ratings;
};

module.exports = {
  createClient,
  getClientById,
  updateClientProfile,
  addAddress,
  updateAddress,
  deleteAddress,
  placeOrder,
  cancelOrder,
  getOrderHistory,
  requestRefund,
  addRating,
  getRatings,
};
