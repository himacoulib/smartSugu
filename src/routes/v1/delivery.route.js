const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const deliveryValidation = require('../../validations/delivery.validation');
const deliveryController = require('../../controllers/delivery.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('manageDeliveries'), validate(deliveryValidation.createDelivery), deliveryController.createDelivery)
  .get(auth('viewDeliveries'), validate(deliveryValidation.getDeliveryHistory), deliveryController.getDeliveryHistory);

router.route('/stats').get(auth('viewDeliveryStats'), deliveryController.getDeliveryStats);

router
  .route('/distance')
  .post(
    auth('calculateDeliveryDistance'),
    validate(deliveryValidation.calculateDeliveryDistance),
    deliveryController.calculateDeliveryDistance
  );

router
  .route('/:deliveryId')
  .get(auth('viewDeliveries'), validate(deliveryValidation.getDeliveryById), deliveryController.getDeliveryById)
  .patch(
    auth('updateDeliveryStatus'),
    validate(deliveryValidation.updateDeliveryStatus),
    deliveryController.updateDeliveryStatus
  )
  .delete(auth('manageDeliveries'), validate(deliveryValidation.deleteDelivery), deliveryController.deleteDelivery);

router
  .route('/:deliveryId/assign')
  .patch(auth('assignDelivery'), validate(deliveryValidation.assignDelivery), deliveryController.assignDelivery);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Deliveries
 *   description: Gestion des livraisons
 */

/**
 * @swagger
 * /deliveries:
 *   post:
 *     summary: Créer une livraison
 *     tags: [Deliveries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Delivery'
 *     responses:
 *       "201":
 *         description: Livraison créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Delivery'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   get:
 *     summary: Obtenir l'historique des livraisons
 *     tags: [Deliveries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 10
 *         description: Nombre d'éléments par page
 *     responses:
 *       "200":
 *         description: Liste des livraisons récupérées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Delivery'
 *                 totalResults:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /deliveries/stats:
 *   get:
 *     summary: Obtenir des statistiques globales sur les livraisons
 *     tags: [Deliveries]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Statistiques récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalDeliveries:
 *                   type: integer
 *                 successfulDeliveries:
 *                   type: integer
 *                 averageDistance:
 *                   type: number
 *                   format: float
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /deliveries/{deliveryId}:
 *   get:
 *     summary: Récupérer une livraison par ID
 *     tags: [Deliveries]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: deliveryId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la livraison
 *     responses:
 *       "200":
 *         description: Livraison récupérée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Delivery'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   patch:
 *     summary: Mettre à jour le statut d'une livraison
 *     tags: [Deliveries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, in_progress, delivered, cancelled]
 *                 description: Nouveau statut de la livraison
 *             example:
 *               status: delivered
 *     responses:
 *       "200":
 *         description: Statut mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Delivery'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /deliveries/distance:
 *   post:
 *     summary: Calculer la distance pour une livraison
 *     tags: [Deliveries]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - startCoords
 *               - endCoords
 *             properties:
 *               startCoords:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *               endCoords:
 *                 type: object
 *                 properties:
 *                   latitude:
 *                     type: number
 *                   longitude:
 *                     type: number
 *             example:
 *               startCoords: { latitude: 48.8566, longitude: 2.3522 }
 *               endCoords: { latitude: 45.764, longitude: 4.8357 }
 *     responses:
 *       "200":
 *         description: Distance calculée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 distance:
 *                   type: number
 *                   description: Distance en kilomètres
 *                   format: float
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
