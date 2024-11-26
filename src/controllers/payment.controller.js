const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { paymentService, notificationService } = require('../services');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger');

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
 * Effectuer un paiement.
 */
const makePayment = catchAsync(async (req, res) => {
  logger.info(`Tentative de paiement pour la commande : OrderID=${req.body.orderId}`);
  const { transactionId } = req.body;

  // Vérifier l'unicité du transactionId
  if (transactionId && (await paymentService.isTransactionIdTaken(transactionId))) {
    throw new ApiError(httpStatus.CONFLICT, `Transaction ID already exists: ${transactionId}`);
  }

  const payment = await trackPerformance(() => paymentService.makePayment(req.body), 'makePayment');

  // Notification après succès du paiement
  await notificationService.notifyClient(req.user.id, `Paiement réussi pour la commande : OrderID=${req.body.orderId}`);

  logger.info(`Paiement effectué avec succès : PaymentID=${payment.id}`);
  res.status(httpStatus.CREATED).send(payment);
});

/**
 * Obtenir les détails d'un paiement.
 */
const getPaymentDetails = catchAsync(async (req, res) => {
  logger.info(`Récupération des détails du paiement : PaymentID=${req.params.paymentId}`);
  const payment = await trackPerformance(() => paymentService.getPaymentDetails(req.params.paymentId), 'getPaymentDetails');
  if (!payment) {
    logger.warn(`Paiement non trouvé : PaymentID=${req.params.paymentId}`);
    throw new ApiError(httpStatus.NOT_FOUND, 'Payment not found');
  }
  logger.info(`Détails du paiement récupérés avec succès : PaymentID=${payment.id}`);
  res.status(httpStatus.OK).send(payment);
});

/**
 * Obtenir l'historique des paiements d'un utilisateur.
 */
const getUserPaymentHistory = catchAsync(async (req, res) => {
  const { startDate, endDate, method, status } = req.query; // Ajout de filtres avancés
  logger.info(`Récupération de l'historique des paiements pour l'utilisateur : UserID=${req.user.id}`);
  const payments = await trackPerformance(
    () => paymentService.getUserPaymentHistory(req.user.id, { startDate, endDate, method, status }),
    'getUserPaymentHistory'
  );
  logger.info(`Historique des paiements récupéré : Total=${payments.length}`);
  res.status(httpStatus.OK).send(payments);
});

/**
 * Annuler un paiement.
 */
const cancelPayment = catchAsync(async (req, res) => {
  logger.info(`Annulation du paiement : PaymentID=${req.params.paymentId}`);
  const cancelledPayment = await trackPerformance(() => paymentService.cancelPayment(req.params.paymentId), 'cancelPayment');
  if (!cancelledPayment) {
    logger.warn(`Échec de l'annulation du paiement : PaymentID=${req.params.paymentId}`);
    throw new ApiError(httpStatus.BAD_REQUEST, 'Payment cannot be cancelled');
  }

  // Notification d'annulation
  await notificationService.notifyClient(req.user.id, `Votre paiement : PaymentID=${req.params.paymentId} a été annulé`);

  logger.info(`Paiement annulé avec succès : PaymentID=${req.params.paymentId}`);
  res.status(httpStatus.OK).send(cancelledPayment);
});

/**
 * Initier un remboursement.
 */
const initiateRefund = catchAsync(async (req, res) => {
  logger.info(`Remboursement initié pour la commande : OrderID=${req.body.orderId}`);
  const refund = await trackPerformance(() => paymentService.initiateRefund(req.body.orderId), 'initiateRefund');

  // Notification de remboursement
  await notificationService.notifyClient(
    req.user.id,
    `Un remboursement a été initié pour votre commande : OrderID=${req.body.orderId}`
  );

  logger.info(`Remboursement effectué avec succès : RefundID=${refund.id}`);
  res.status(httpStatus.OK).send(refund);
});

/**
 * Obtenir les statistiques des transactions.
 */
const getTransactionStats = catchAsync(async (req, res) => {
  logger.info(`Récupération des statistiques des transactions`);
  const stats = await trackPerformance(() => paymentService.getTransactionStats(), 'getTransactionStats');
  logger.info(`Statistiques des transactions récupérées avec succès`);
  res.status(httpStatus.OK).send(stats);
});

module.exports = {
  makePayment,
  getPaymentDetails,
  getUserPaymentHistory,
  cancelPayment,
  initiateRefund,
  getTransactionStats,
};
