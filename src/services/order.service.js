const { Order, Product, Promotion } = require('../models');
const ApiError = require('../utils/ApiError');
const httpStatus = require('http-status');

/**
 * Créer une commande.
 * @param {ObjectId} clientId - ID du client
 * @param {Object} orderBody - Détails de la commande
 * @returns {Promise<Order>}
 */
const createOrder = async (clientId, orderBody) => {
  // Vérifier la disponibilité des produits
  for (const item of orderBody.products) {
    const product = await Product.findById(item.productId);
    if (!product) {
      throw new ApiError(httpStatus.NOT_FOUND, `Produit introuvable : ID=${item.productId}`);
    }
    if (product.stock < item.quantity) {
      throw new ApiError(httpStatus.BAD_REQUEST, `Stock insuffisant pour le produit : ID=${item.productId}`);
    }
  }

  // Appliquer une promotion si présente
  if (orderBody.promotion) {
    const promotion = await Promotion.findById(orderBody.promotion);
    if (!promotion) {
      throw new ApiError(httpStatus.NOT_FOUND, 'Promotion introuvable');
    }
    if (!promotion.isValid()) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Promotion expirée ou non valide');
    }
    orderBody.totalPrice -= (orderBody.totalPrice * promotion.discountValue) / 100;
  }

  // Calculer le prix total
  const totalPrice = orderBody.products.reduce((acc, item) => acc + item.quantity * item.price, 0);
  orderBody.totalPrice = totalPrice;

  // Créer la commande
  const order = await Order.create({
    client: clientId,
    ...orderBody,
  });

  // Réduire le stock des produits
  for (const item of order.products) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { stock: -item.quantity },
    });
  }

  return order;
};

/**
 * Récupérer une commande par ID.
 * @param {ObjectId} orderId - ID de la commande
 * @returns {Promise<Order>}
 */
const getOrderById = async (orderId) => {
  const order = await Order.findById(orderId).populate('products.productId').populate('client').populate('merchant');
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Commande non trouvée');
  }
  return order;
};

/**
 * Mettre à jour le statut d'une commande.
 * @param {ObjectId} orderId - ID de la commande
 * @param {String} newStatus - Nouveau statut de la commande
 * @returns {Promise<Order>}
 */
const updateOrderStatus = async (orderId, newStatus) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Commande non trouvée');
  }
  if (!['pending', 'accepted', 'in_progress', 'completed', 'cancelled'].includes(newStatus)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Statut de commande invalide');
  }
  order.status = newStatus;
  await order.save();
  return order;
};

/**
 * Annuler une commande.
 * @param {ObjectId} orderId - ID de la commande
 * @returns {Promise<Order>}
 */
const cancelOrder = async (orderId) => {
  const order = await getOrderById(orderId);
  if (order.status === 'completed' || order.status === 'cancelled') {
    throw new ApiError(httpStatus.BAD_REQUEST, "Impossible d'annuler une commande terminée ou déjà annulée");
  }
  order.status = 'cancelled';

  // Réapprovisionner les stocks des produits
  for (const item of order.products) {
    await Product.findByIdAndUpdate(item.productId, {
      $inc: { stock: item.quantity },
    });
  }

  await order.save();
  return order;
};

/**
 * Calculer le total d'une commande en fonction des produits et quantités.
 * @param {Array} products - Liste des produits avec quantité et prix
 * @returns {Promise<Number>}
 */
const calculateOrderTotal = async (products) => {
  const total = products.reduce((acc, item) => acc + item.quantity * item.price, 0);
  return total;
};

/**
 * Générer un reçu pour une commande.
 * @param {ObjectId} orderId - ID de la commande
 * @returns {Promise<Object>}
 */
const generateReceipt = async (orderId) => {
  const order = await getOrderById(orderId);
  return order.generateReceipt();
};

/**
 * Obtenir l'historique des commandes pour un utilisateur.
 * @param {ObjectId} userId - ID de l'utilisateur
 * @param {Object} options - Options de pagination
 * @returns {Promise<QueryResult>}
 */
const getOrderHistory = async (userId, options) => {
  const filter = { client: userId };
  return Order.paginate(filter, options);
};

/**
 * Vérifier si une commande est disponible pour un livreur.
 * @param {ObjectId} orderId - ID de la commande
 * @returns {Promise<Boolean>}
 */
const isOrderAvailable = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order || order.status !== 'pending') {
    return false;
  }
  return true;
};

/**
 * Assigner une commande à un livreur.
 * @param {ObjectId} orderId - ID de la commande
 * @param {ObjectId} livreurId - ID du livreur
 * @returns {Promise<Order>}
 */
const assignOrderToLivreur = async (orderId, livreurId) => {
  const order = await getOrderById(orderId);
  if (order.status !== 'pending') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Commande non disponible pour assignation');
  }
  order.delivery = livreurId;
  order.status = 'in_progress';
  await order.save();
  return order;
};

module.exports = {
  createOrder,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  calculateOrderTotal,
  generateReceipt,
  getOrderHistory,
  isOrderAvailable,
  assignOrderToLivreur,
};
