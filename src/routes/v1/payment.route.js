const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const paymentValidation = require('../../validations/payment.validation');
const paymentController = require('../../controllers/payment.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('managePayments'), validate(paymentValidation.makePayment), paymentController.makePayment) // Effectuer un paiement
  .get(
    auth('viewPaymentHistory'),
    validate(paymentValidation.getUserPaymentHistory),
    paymentController.getUserPaymentHistory
  ); // Historique des paiements

router
  .route('/:paymentId')
  .get(auth('viewPaymentHistory'), validate(paymentValidation.getPaymentDetails), paymentController.getPaymentDetails) // Détails d’un paiement
  .patch(auth('managePayments'), validate(paymentValidation.cancelPayment), paymentController.cancelPayment); // Annuler un paiement

router
  .route('/refund')
  .post(auth('managePayments'), validate(paymentValidation.initiateRefund), paymentController.initiateRefund); // Remboursement

router.route('/stats').get(auth('managePayments'), paymentController.getTransactionStats); // Statistiques des transactions

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Payments
 *   description: Gestion des paiements
 */

/**
 * @swagger
 * /payments:
 *   post:
 *     summary: Effectuer un paiement
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - order
 *               - amount
 *               - method
 *               - type
 *             properties:
 *               order:
 *                 type: string
 *                 format: uuid
 *                 description: ID de la commande associée
 *               amount:
 *                 type: number
 *                 minimum: 0.01
 *                 description: Montant du paiement
 *               method:
 *                 type: string
 *                 enum: [credit_card, paypal, cash]
 *                 description: Méthode de paiement
 *               type:
 *                 type: string
 *                 enum: [payment, refund, fee]
 *                 description: Type de transaction
 *               fees:
 *                 type: number
 *                 description: Frais de transaction
 *               transactionId:
 *                 type: string
 *                 description: Identifiant unique de la transaction
 *             example:
 *               order: "60d21b4667d0d8992e610c85"
 *               amount: 100.5
 *               method: "credit_card"
 *               type: "payment"
 *               fees: 2.5
 *               transactionId: "TRANSACTION123"
 *     responses:
 *       "201":
 *         description: Paiement effectué avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *   get:
 *     summary: Historique des paiements d’un utilisateur
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de début pour filtrer l'historique
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Date de fin pour filtrer l'historique
 *       - in: query
 *         name: method
 *         schema:
 *           type: string
 *           enum: [credit_card, paypal, cash]
 *         description: Filtrer par méthode de paiement
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, completed, failed]
 *         description: Filtrer par statut
 *     responses:
 *       "200":
 *         description: Historique des paiements récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Payment'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /payments/{paymentId}:
 *   get:
 *     summary: Obtenir les détails d’un paiement
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID du paiement
 *     responses:
 *       "200":
 *         description: Détails du paiement récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *   patch:
 *     summary: Annuler un paiement
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID du paiement
 *     responses:
 *       "200":
 *         description: Paiement annulé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Payment'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /payments/stats:
 *   get:
 *     summary: Obtenir les statistiques des transactions
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Statistiques récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                     enum: [pending, completed, failed]
 *                   totalAmount:
 *                     type: number
 *                   count:
 *                     type: integer
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
