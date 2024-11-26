const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const orderValidation = require('../../validations/order.validation');
const orderController = require('../../controllers/order.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('placeOrder'), validate(orderValidation.createOrder), orderController.createOrder) // Créer une commande
  .get(auth('viewOrderHistory'), validate(orderValidation.getOrderHistory), orderController.getOrderHistory); // Récupérer l'historique des commandes

router
  .route('/:orderId')
  .get(auth('viewOrderDetails'), validate(orderValidation.getOrderById), orderController.getOrderById) // Récupérer une commande
  .patch(auth('updateOrderStatus'), validate(orderValidation.updateOrderStatus), orderController.updateOrderStatus) // Mettre à jour le statut
  .delete(auth('cancelOrder'), validate(orderValidation.cancelOrder), orderController.cancelOrder); // Annuler une commande

router
  .route('/:orderId/receipt')
  .get(auth('viewOrderDetails'), validate(orderValidation.generateReceipt), orderController.generateOrderReceipt); // Générer un reçu

router
  .route('/calculate-total')
  .post(auth('placeOrder'), validate(orderValidation.calculateOrderTotal), orderController.calculateOrderTotal); // Calculer le total

router
  .route('/available')
  .get(
    auth('trackDelivery'),
    validate(orderValidation.getAvailableOrdersForLivreur),
    orderController.getAvailableOrdersForLivreur
  ); // Obtenir les commandes disponibles pour les livreurs

router
  .route('/:orderId/assign')
  .patch(auth('assignOrder'), validate(orderValidation.assignOrderToLivreur), orderController.assignOrderToLivreur); // Assigner une commande à un livreur

router
  .route('/client')
  .get(auth('viewOrderHistory'), validate(orderValidation.getClientOrders), orderController.getClientOrders); // Commandes du client

router
  .route('/merchant/pending')
  .get(auth('manageOrders'), validate(orderValidation.getMerchantPendingOrders), orderController.getMerchantPendingOrders); // Commandes en attente du marchand

router
  .route('/:orderId/note')
  .post(auth('updateOrderStatus'), validate(orderValidation.addOrderNote), orderController.addOrderNote); // Ajouter une note à une commande

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Gestion des commandes
 */

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Créer une commande
 *     description: Permet aux clients de passer une commande.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Order'
 *     responses:
 *       "201":
 *         description: Commande créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *
 *   get:
 *     summary: Récupérer l'historique des commandes
 *     description: Permet de récupérer l'historique des commandes pour un utilisateur.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *     responses:
 *       "200":
 *         description: Historique des commandes récupéré
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Order'
 *                 totalPages:
 *                   type: integer
 *                 totalResults:
 *                   type: integer
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /orders/{orderId}:
 *   get:
 *     summary: Récupérer une commande
 *     description: Permet de récupérer les détails d'une commande.
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la commande
 *     responses:
 *       "200":
 *         description: Détails de la commande récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Order'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
