const httpStatus = require('http-status');
const { Payment, Order } = require('../models');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

/**
 * Créer un nouveau paiement.
 * @param {Object} paymentData - Données pour le paiement.
 * @returns {Promise<Payment>}
 */
const makePayment = async (paymentData) => {
  const { order, amount, fees, method, transactionId, type } = paymentData;

  // Vérifier si la commande existe
  const existingOrder = await Order.findById(order);
  if (!existingOrder) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
  }

  // Vérifier les doublons de transactionId
  if (transactionId && (await isTransactionIdTaken(transactionId))) {
    throw new ApiError(httpStatus.CONFLICT, `Transaction ID already exists: ${transactionId}`);
  }

  // Créer le paiement
  const payment = new Payment({
    order,
    amount,
    fees,
    method,
    transactionId,
    type,
  });

  // Calculer les revenus nets
  payment.metadata.netRevenue = payment.calculateNetRevenue();

  // Sauvegarder et retourner
  await payment.save();
  logger.info(`Paiement créé avec succès : PaymentID=${payment.id}`);
  return payment;
};

/**
 * Récupérer les détails d'un paiement par ID.
 * @param {ObjectId} paymentId - ID du paiement.
 * @returns {Promise<Payment>}
 */
const getPaymentDetails = async (paymentId) => {
  const payment = await Payment.findById(paymentId).populate('order');
  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
  }
  return payment;
};

/**
 * Vérifier si un `transactionId` est déjà utilisé.
 * @param {string} transactionId - ID de transaction à vérifier.
 * @returns {Promise<boolean>}
 */
const isTransactionIdTaken = async (transactionId) => {
  const payment = await Payment.findOne({ transactionId });
  return !!payment;
};

/**
 * Obtenir l'historique des paiements d'un utilisateur avec filtres.
 * @param {ObjectId} userId - ID de l'utilisateur.
 * @param {Object} filters - Filtres pour l'historique.
 * @returns {Promise<Array<Payment>>}
 */
const getUserPaymentHistory = async (userId, filters = {}) => {
  const { startDate, endDate, method, status } = filters;
  const query = { 'order.client': userId };

  if (startDate) query.createdAt = { $gte: new Date(startDate) };
  if (endDate) query.createdAt = { ...query.createdAt, $lte: new Date(endDate) };
  if (method) query.method = method;
  if (status) query.status = status;

  const payments = await Payment.find(query).sort({ createdAt: -1 });
  return payments;
};

/**
 * Annuler un paiement.
 * @param {ObjectId} paymentId - ID du paiement à annuler.
 * @returns {Promise<Payment>}
 */
const cancelPayment = async (paymentId) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
  }

  if (payment.status === 'completed') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot cancel a completed payment');
  }

  payment.updateStatus('failed');
  logger.info(`Paiement annulé : PaymentID=${payment.id}`);
  return payment;
};

/**
 * Initier un remboursement pour une commande.
 * @param {ObjectId} orderId - ID de la commande à rembourser.
 * @returns {Promise<Payment>}
 */
const initiateRefund = async (orderId) => {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Order not found');
  }

  if (!order.payment || order.payment.status !== 'completed') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot refund an incomplete payment');
  }

  // Créer un remboursement
  const refund = new Payment({
    order: order.id,
    amount: order.payment.amount,
    fees: 0,
    method: order.payment.method,
    transactionId: `REFUND-${order.payment.transactionId}`,
    type: 'refund',
    status: 'completed',
  });

  await refund.save();
  logger.info(`Remboursement initié avec succès : RefundID=${refund.id}`);
  return refund;
};

/**
 * Obtenir les statistiques des transactions.
 * @returns {Promise<Object>}
 */
const getTransactionStats = async () => {
  const stats = await Payment.aggregate([
    {
      $group: {
        _id: '$status',
        totalAmount: { $sum: '$amount' },
        count: { $sum: 1 },
      },
    },
  ]);
  return stats;
};

module.exports = {
  makePayment,
  getPaymentDetails,
  isTransactionIdTaken,
  getUserPaymentHistory,
  cancelPayment,
  initiateRefund,
  getTransactionStats,
};
