const httpStatus = require('http-status');
const { Delivery, Order, Livreur } = require('../models');
const ApiError = require('../utils/ApiError');
const redis = require('../config/redis'); // Ajout de Redis pour le cache
const notificationQueue = require('../utils/queues/notificationQueue'); // Pour notifications en arrière-plan

/**
 * Validation des coordonnées géographiques.
 * @param {Object} coords - Coordonnées avec latitude et longitude.
 * @throws {ApiError} - Si les coordonnées sont invalides.
 */
const validateCoordinates = (coords) => {
  const { latitude, longitude } = coords;
  if (
    typeof latitude !== 'number' ||
    typeof longitude !== 'number' ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid coordinates');
  }
};

/**
 * Créer une livraison.
 * @param {Object} deliveryData - Données de la livraison.
 * @returns {Promise<Delivery>}
 */
const createDelivery = async (deliveryData) => {
  const delivery = await Delivery.create(deliveryData);

  // Notification en arrière-plan pour le livreur
  if (delivery.livreur) {
    await notificationQueue.add({
      userId: delivery.livreur,
      message: `Vous avez une nouvelle livraison assignée : LivraisonID=${delivery._id}`,
      type: 'delivery',
    });
  }

  return delivery;
};

/**
 * Récupérer une livraison par ID avec cache.
 * @param {ObjectId} deliveryId - ID de la livraison.
 * @returns {Promise<Delivery>}
 */
const getDeliveryById = async (deliveryId) => {
  const cachedDelivery = await redis.get(`delivery:${deliveryId}`);
  if (cachedDelivery) {
    return JSON.parse(cachedDelivery);
  }

  const delivery = await Delivery.findById(deliveryId).populate('order livreur');
  if (!delivery) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Delivery not found');
  }

  // Mise en cache
  await redis.set(`delivery:${deliveryId}`, JSON.stringify(delivery), 'EX', 3600); // Expire après 1 heure
  return delivery;
};

/**
 * Mettre à jour le statut de la livraison.
 * @param {ObjectId} deliveryId - ID de la livraison.
 * @param {String} newStatus - Nouveau statut.
 * @returns {Promise<Delivery>}
 */
const updateDeliveryStatus = async (deliveryId, newStatus) => {
  const delivery = await Delivery.findById(deliveryId);
  if (!delivery) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Delivery not found');
  }

  // Met à jour le statut
  await delivery.updateStatus(newStatus);

  // Notification pour l'utilisateur ou le livreur
  if (newStatus === 'delivered') {
    await notificationQueue.add({
      userId: delivery.livreur,
      message: `Votre livraison : LivraisonID=${deliveryId} a été complétée.`,
      type: 'delivery',
    });
  }

  // Supprime le cache
  await redis.del(`delivery:${deliveryId}`);

  return delivery;
};

/**
 * Supprimer une livraison avec transaction.
 * @param {ObjectId} deliveryId - ID de la livraison.
 * @returns {Promise<Delivery>}
 */
const deleteDelivery = async (deliveryId) => {
  const session = await Delivery.startSession();
  session.startTransaction();
  try {
    const delivery = await Delivery.findById(deliveryId).session(session);
    if (!delivery) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Delivery not found');
    }

    const order = await Order.findById(delivery.order).session(session);
    if (order) {
      order.delivery = null;
      await order.save({ session });
    }

    await delivery.remove({ session });
    await session.commitTransaction();

    // Supprime le cache
    await redis.del(`delivery:${deliveryId}`);
    return delivery;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

/**
 * Calculer la distance d'une livraison.
 * @param {ObjectId} deliveryId - ID de la livraison.
 * @param {Object} startCoords - Coordonnées de départ.
 * @param {Object} endCoords - Coordonnées de destination.
 * @returns {Promise<Number>} - Distance en kilomètres.
 */
const calculateDeliveryDistance = async (deliveryId, startCoords, endCoords) => {
  validateCoordinates(startCoords);
  validateCoordinates(endCoords);

  const delivery = await Delivery.findById(deliveryId);
  if (!delivery) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Delivery not found');
  }
  const distance = delivery.calculateDistance(startCoords, endCoords);

  // Mise à jour de la distance et sauvegarde
  delivery.distance = distance;
  await delivery.save();

  // Supprime le cache pour éviter des données obsolètes
  await redis.del(`delivery:${deliveryId}`);

  return distance;
};

/**
 * Récupérer des statistiques de livraisons.
 * @param {ObjectId} [livreurId] - Optionnel : ID du livreur.
 * @returns {Promise<Object>} - Statistiques (nombre, succès, distance moyenne).
 */
const getDeliveryStats = async (livreurId) => {
  const matchStage = livreurId ? { livreur: livreurId } : {};
  const stats = await Delivery.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        totalDeliveries: { $sum: 1 },
        successfulDeliveries: {
          $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] },
        },
        averageDistance: { $avg: '$distance' },
      },
    },
  ]);

  return stats[0] || { totalDeliveries: 0, successfulDeliveries: 0, averageDistance: 0 };
};

module.exports = {
  createDelivery,
  getDeliveryById,
  updateDeliveryStatus,
  deleteDelivery,
  calculateDeliveryDistance,
  getDeliveryStats,
};
