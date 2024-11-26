const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const supportValidation = require('../../validations/support.validation');
const supportController = require('../../controllers/support.controller');

const router = express.Router();

router
  .route('/priority-tickets')
  .get(auth('viewTickets'), validate(supportValidation.getPriorityTickets), supportController.getPriorityTickets); // Récupérer les tickets prioritaires

router
  .route('/open-tickets')
  .get(auth('viewTickets'), validate(supportValidation.getOpenTickets), supportController.getOpenTickets); // Récupérer tous les tickets ouverts

router
  .route('/assign/:ticketId')
  .patch(auth('assignTickets'), validate(supportValidation.assignTicket), supportController.assignTicket); // Assigner un ticket à un agent

router
  .route('/status/:ticketId')
  .patch(auth('manageTickets'), validate(supportValidation.updateTicketStatus), supportController.updateTicketStatus); // Mettre à jour l'état d'un ticket

router
  .route('/user-tickets/:userId')
  .get(auth('viewTickets'), validate(supportValidation.getUserTickets), supportController.getUserTickets); // Récupérer l'historique des tickets d'un utilisateur

router
  .route('/stats')
  .get(auth('viewReports'), validate(supportValidation.getSupportStats), supportController.getSupportStats); // Obtenir des statistiques globales pour le support

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Support
 *   description: Gestion des tickets et support client
 */

/**
 * @swagger
 * /support/priority-tickets:
 *   get:
 *     summary: Récupérer les tickets prioritaires
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Tickets prioritaires récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Ticket'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /support/open-tickets:
 *   get:
 *     summary: Récupérer tous les tickets ouverts
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Filtrer par priorité
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, in_progress, resolved, closed]
 *         description: Filtrer par statut
 *       - in: query
 *         name: keyword
 *         schema:
 *           type: string
 *         description: Filtrer par mot-clé dans la description
 *     responses:
 *       "200":
 *         description: Tickets ouverts récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Ticket'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /support/assign/{ticketId}:
 *   patch:
 *     summary: Assigner un ticket à un agent
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID du ticket
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               agentId:
 *                 type: string
 *                 format: uuid
 *                 description: ID de l'agent
 *     responses:
 *       "200":
 *         description: Ticket assigné avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /support/status/{ticketId}:
 *   patch:
 *     summary: Mettre à jour l'état d'un ticket
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ticketId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID du ticket
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [open, in_progress, resolved, closed]
 *                 description: Nouveau statut du ticket
 *     responses:
 *       "200":
 *         description: État du ticket mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ticket'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /support/user-tickets/{userId}:
 *   get:
 *     summary: Récupérer l'historique des tickets d'un utilisateur
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de l'utilisateur
 *     responses:
 *       "200":
 *         description: Historique des tickets récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Ticket'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /support/stats:
 *   get:
 *     summary: Obtenir des statistiques globales pour le support
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Statistiques globales récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalTickets:
 *                   type: integer
 *                   description: Nombre total de tickets
 *                 openTickets:
 *                   type: integer
 *                   description: Nombre de tickets ouverts
 *                 resolvedTickets:
 *                   type: integer
 *                   description: Nombre de tickets résolus
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
