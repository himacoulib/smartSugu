const { Livreur, Delivery, Client } = require('../models');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

/**
 * Récupérer les livraisons disponibles pour un livreur.
 * @param {ObjectId} livreurId - ID du livreur.
 * @returns {Promise<Array>}
 */
const getAvailableDeliveries = async (livreurId) => {
  const livreur = await Livreur.findById(livreurId);
  if (!livreur) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Livreur not found');
  }

  const deliveries = await Delivery.find({ status: 'pending' });
  return deliveries.map((delivery) => ({
    ...delivery.toObject(),
    distanceFromLivreur: livreur.calculateDistance(delivery.startLocation, livreur.location),
  }));
};

/**
 * Vérifier si une livraison est disponible.
 * @param {ObjectId} deliveryId - ID de la livraison.
 * @returns {Promise<Boolean>}
 */
const isDeliveryAvailable = async (deliveryId) => {
  const delivery = await Delivery.findById(deliveryId);
  return delivery && delivery.status === 'pending';
};

/**
 * Accepter une livraison pour un livreur.
 * @param {ObjectId} livreurId - ID du livreur.
 * @param {ObjectId} deliveryId - ID de la livraison.
 * @returns {Promise<Delivery>}
 */
const acceptDelivery = async (livreurId, deliveryId) => {
  const livreur = await Livreur.findById(livreurId);
  const delivery = await Delivery.findById(deliveryId);

  if (!livreur || !delivery) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Livreur or Delivery not found');
  }

  if (delivery.status !== 'pending') {
    throw new ApiError(httpStatus.CONFLICT, 'Delivery is no longer available');
  }

  delivery.status = 'in_progress';
  delivery.livreur = livreurId;
  livreur.deliveriesAssigned.push(deliveryId);

  await delivery.save();
  await livreur.save();

  return delivery;
};

/**
 * Obtenir les livraisons assignées à un livreur.
 * @param {ObjectId} livreurId - ID du livreur.
 * @returns {Promise<Array>}
 */
const getAssignedDeliveries = async (livreurId) => {
  const livreur = await Livreur.findById(livreurId).populate('deliveriesAssigned');
  if (!livreur) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Livreur not found');
  }
  return livreur.deliveriesAssigned;
};

/**
 * Mettre à jour le statut d'une livraison.
 * @param {ObjectId} livreurId - ID du livreur.
 * @param {ObjectId} deliveryId - ID de la livraison.
 * @param {String} newStatus - Nouveau statut de la livraison.
 * @returns {Promise<Delivery>}
 */
const updateDeliveryStatus = async (livreurId, deliveryId, { newStatus }) => {
  const livreur = await Livreur.findById(livreurId);
  const delivery = await Delivery.findById(deliveryId);

  if (!livreur || !delivery) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Livreur or Delivery not found');
  }

  if (!['in_progress', 'delivered', 'cancelled'].includes(newStatus)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid delivery status');
  }

  delivery.status = newStatus;

  if (newStatus === 'delivered') {
    livreur.performance.deliveriesCompleted += 1;
    await livreur.updatePerformance(delivery.timeTaken);
  }

  await delivery.save();
  await livreur.save();

  return delivery;
};

/**
 * Calculer les gains totaux d'un livreur.
 * @param {ObjectId} livreurId - ID du livreur.
 * @returns {Promise<Number>}
 */
const calculateEarnings = async (livreurId) => {
  const livreur = await Livreur.findById(livreurId);
  if (!livreur) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Livreur not found');
  }

  const totalEarnings = await livreur.calculateTotalEarnings();
  return { total: totalEarnings };
};

/**
 * Mettre à jour la disponibilité d'un livreur.
 * @param {ObjectId} livreurId - ID du livreur.
 * @param {Boolean} availability - Disponibilité à définir.
 * @returns {Promise<Livreur>}
 */
const setAvailability = async (livreurId, availability) => {
  const livreur = await Livreur.findById(livreurId);
  if (!livreur) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Livreur not found');
  }

  await livreur.setAvailability(availability);
  return livreur;
};

/**
 * Mettre à jour la localisation d'un livreur.
 * @param {ObjectId} livreurId - ID du livreur.
 * @param {Object} coordinates - Nouvelle localisation (latitude, longitude).
 * @returns {Promise<Livreur>}
 */
const updateLocation = async (livreurId, coordinates) => {
  const livreur = await Livreur.findById(livreurId);
  if (!livreur) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Livreur not found');
  }

  await livreur.updateLocation(coordinates);
  return livreur;
};

/**
 * Évaluer un client.
 * @param {ObjectId} livreurId - ID du livreur.
 * @param {ObjectId} clientId - ID du client.
 * @param {Number} rating - Note attribuée.
 * @param {String} comment - Commentaire.
 * @returns {Promise<Livreur>}
 */
const rateClient = async (livreurId, clientId, rating, comment) => {
  const livreur = await Livreur.findById(livreurId);
  if (!livreur) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Livreur not found');
  }

  await livreur.rateClient(clientId, rating, comment);
  return livreur;
};

/**
 * Obtenir l'historique des livraisons d'un livreur.
 * @param {ObjectId} livreurId - ID du livreur.
 * @returns {Promise<Array>}
 */
const getDeliveryHistory = async (livreurId) => {
  const livreur = await Livreur.findById(livreurId);
  if (!livreur) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Livreur not found');
  }

  return livreur.getDeliveryHistory();
};

module.exports = {
  getAvailableDeliveries,
  isDeliveryAvailable,
  acceptDelivery,
  getAssignedDeliveries,
  updateDeliveryStatus,
  calculateEarnings,
  setAvailability,
  updateLocation,
  rateClient,
  getDeliveryHistory,
};
