const Joi = require('joi');
const { objectId } = require('./custom.validation');

// Validation pour effectuer un paiement
const makePayment = {
  body: Joi.object().keys({
    order: Joi.string().custom(objectId).required().description('ID de la commande associée'),
    amount: Joi.number().positive().required().description('Montant du paiement (doit être supérieur à zéro)'),
    fees: Joi.number().min(0).optional().description('Frais associés au paiement'),
    method: Joi.string().valid('credit_card', 'paypal', 'cash').required().description('Méthode de paiement'),
    type: Joi.string().valid('payment', 'refund', 'fee').required().description('Type de transaction'),
    transactionId: Joi.string().optional().description('ID unique de la transaction'),
  }),
};

// Validation pour obtenir les détails d’un paiement
const getPaymentDetails = {
  params: Joi.object().keys({
    paymentId: Joi.string().custom(objectId).required().description('ID du paiement'),
  }),
};

// Validation pour obtenir l'historique des paiements d’un utilisateur
const getUserPaymentHistory = {
  query: Joi.object().keys({
    startDate: Joi.date().optional().description("Date de début pour filtrer l'historique"),
    endDate: Joi.date().optional().description("Date de fin pour filtrer l'historique"),
    method: Joi.string().valid('credit_card', 'paypal', 'cash').optional().description('Méthode de paiement'),
    status: Joi.string().valid('pending', 'completed', 'failed').optional().description('Statut des paiements à filtrer'),
  }),
};

// Validation pour annuler un paiement
const cancelPayment = {
  params: Joi.object().keys({
    paymentId: Joi.string().custom(objectId).required().description('ID du paiement à annuler'),
  }),
};

// Validation pour initier un remboursement
const initiateRefund = {
  body: Joi.object().keys({
    orderId: Joi.string().custom(objectId).required().description('ID de la commande à rembourser'),
  }),
};

module.exports = {
  makePayment,
  getPaymentDetails,
  getUserPaymentHistory,
  cancelPayment,
  initiateRefund,
};
