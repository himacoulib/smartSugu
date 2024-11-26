const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const clientValidation = require('../../validations/client.validation');
const clientController = require('../../controllers/client.controller');

const router = express.Router();

/**
 * Routes principales pour la gestion des clients
 */

// Créer un client
router.post('/', auth('manageClients'), validate(clientValidation.createClient), clientController.createClient);

// Récupérer un client
router.get('/:clientId', auth('manageClients'), validate(clientValidation.getClient), clientController.getClient);

// Mettre à jour le profil d’un client
router.patch(
  '/:clientId',
  auth('manageClients'),
  validate(clientValidation.updateClientProfile),
  clientController.updateProfile
);

/**
 * Routes pour la gestion des adresses
 */

// Ajouter une adresse
router.post(
  '/:clientId/addresses',
  auth('manageClients'),
  validate(clientValidation.addAddress),
  clientController.addAddress
);

// Mettre à jour une adresse
router.patch(
  '/:clientId/addresses/:addressId',
  auth('manageClients'),
  validate(clientValidation.updateAddress),
  clientController.updateAddress
);

// Supprimer une adresse
router.delete(
  '/:clientId/addresses/:addressId',
  auth('manageClients'),
  validate(clientValidation.deleteAddress),
  clientController.deleteAddress
);

/**
 * Routes pour la gestion des commandes
 */

// Passer une commande
router.post('/:clientId/orders', auth('placeOrder'), validate(clientValidation.placeOrder), clientController.placeOrder);

// Annuler une commande
router.patch(
  '/:clientId/orders/:orderId/cancel',
  auth('cancelOrder'),
  validate(clientValidation.cancelOrder),
  clientController.cancelOrder
);

// Récupérer l’historique des commandes
router.get(
  '/:clientId/orders',
  auth('viewOrderHistory'),
  validate(clientValidation.getOrderHistory),
  clientController.getOrderHistory
);

/**
 * Routes pour les remboursements
 */

// Demander un remboursement
router.post(
  '/:clientId/refunds',
  auth('requestRefund'),
  validate(clientValidation.requestRefund),
  clientController.requestRefund
);

/**
 * Routes pour les évaluations
 */

// Ajouter une évaluation
router.post('/:clientId/ratings', auth('rateDelivery'), validate(clientValidation.addRating), clientController.addRating);

// Récupérer les évaluations
router.get('/:clientId/ratings', auth('viewRatings'), validate(clientValidation.getRatings), clientController.getRatings);

module.exports = router;
/**
 * @swagger
 * tags:
 *   name: Clients
 *   description: Gestion des clients et des opérations associées
 */

/**
 * @swagger
 * /clients:
 *   post:
 *     summary: Créer un client
 *     description: Seuls les administrateurs peuvent créer un client.
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateClient'
 *     responses:
 *       "201":
 *         description: Client créé
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /clients/{clientId}:
 *   get:
 *     summary: Récupérer les informations d’un client
 *     description: Les administrateurs peuvent récupérer les informations d’un client.
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du client
 *     responses:
 *       "200":
 *         description: Informations du client récupérées avec succès
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   patch:
 *     summary: Mettre à jour le profil d’un client
 *     description: Seuls les administrateurs peuvent mettre à jour le profil d’un client.
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du client
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateClient'
 *     responses:
 *       "200":
 *         description: Profil mis à jour avec succès
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /clients/{clientId}/addresses:
 *   post:
 *     summary: Ajouter une nouvelle adresse
 *     description: Ajouter une nouvelle adresse au profil d’un client.
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du client
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AddAddress'
 *     responses:
 *       "200":
 *         description: Adresse ajoutée avec succès
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */

/**
 * @swagger
 * /clients/{clientId}/addresses/{addressId}:
 *   patch:
 *     summary: Mettre à jour une adresse existante
 *     description: Modifier une adresse enregistrée par le client.
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du client
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'adresse
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateAddress'
 *     responses:
 *       "200":
 *         description: Adresse mise à jour
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Supprimer une adresse
 *     description: Supprimer une adresse du profil d’un client.
 *     tags: [Clients]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: clientId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du client
 *       - in: path
 *         name: addressId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'adresse
 *     responses:
 *       "200":
 *         description: Adresse supprimée
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
