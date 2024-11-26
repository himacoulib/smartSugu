const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const notificationValidation = require('../../validations/notification.validation');
const notificationController = require('../../controllers/notification.controller');

const router = express.Router();

router
  .route('/')
  .post(
    auth('createNotification'),
    validate(notificationValidation.createNotification),
    notificationController.createNotification
  )
  .get(
    auth('viewNotifications'),
    validate(notificationValidation.getUserNotifications),
    notificationController.getUserNotifications
  )
  .delete(auth('deleteAllNotifications'), notificationController.deleteAllNotifications);

router
  .route('/:notificationId')
  .patch(auth('markNotificationsAsRead'), validate(notificationValidation.markAsRead), notificationController.markAsRead)
  .delete(
    auth('deleteNotifications'),
    validate(notificationValidation.deleteNotification),
    notificationController.deleteNotification
  );

router.route('/read-all').patch(auth('markNotificationsAsRead'), notificationController.markAllAsRead);

router
  .route('/priority')
  .get(
    auth('viewNotifications'),
    validate(notificationValidation.getPriorityNotifications),
    notificationController.getPriorityNotifications
  );

router.route('/obsolete').delete(auth('deleteNotifications'), notificationController.deleteObsoleteNotifications);

module.exports = router;
/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Gestion des notifications utilisateur
 */

/**
 * @swagger
 * /notifications:
 *   post:
 *     summary: Créer une notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - message
 *               - type
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *                 description: ID de l'utilisateur cible
 *               message:
 *                 type: string
 *                 description: Contenu de la notification
 *               type:
 *                 type: string
 *                 enum: [order_update, promotion, system, custom]
 *                 description: Type de notification
 *               channels:
 *                 type: array
 *                 items:
 *                   type: string
 *                   enum: [in_app, push, email, sms]
 *                 description: Liste des canaux d'envoi (par défaut: ['in_app'])
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high]
 *                 default: medium
 *                 description: Priorité de la notification
 *               expiresAt:
 *                 type: string
 *                 format: date-time
 *                 description: Date d'expiration de la notification
 *               groupId:
 *                 type: string
 *                 description: Identifiant de regroupement de notifications similaires
 *             example:
 *               userId: "60d21b4667d0d8992e610c85"
 *               message: "Votre commande a été expédiée."
 *               type: "order_update"
 *               channels: ["in_app", "email"]
 *               priority: "high"
 *               expiresAt: "2024-12-31T23:59:59.000Z"
 *               groupId: "order_notifications"
 *     responses:
 *       "201":
 *         description: Notification créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /notifications:
 *   get:
 *     summary: Récupérer les notifications utilisateur
 *     tags: [Notifications]
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
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [order_update, promotion, system, custom]
 *         description: Filtrer par type de notification
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Priorité des notifications
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [read, unread]
 *         description: Filtrer par statut de lecture
 *     responses:
 *       "200":
 *         description: Notifications récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Notification'
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
 * /notifications/{notificationId}/read:
 *   patch:
 *     summary: Marquer une notification comme lue
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID de la notification
 *     responses:
 *       "200":
 *         description: Notification marquée comme lue
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Notification'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /notifications:
 *   delete:
 *     summary: Supprimer toutes les notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Toutes les notifications supprimées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deletedCount:
 *                   type: integer
 *                   description: Nombre de notifications supprimées
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /notifications/{notificationId}:
 *   delete:
 *     summary: Supprimer une notification spécifique
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: notificationId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la notification
 *     responses:
 *       "204":
 *         description: Notification supprimée avec succès
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /notifications/read-all:
 *   patch:
 *     summary: Marquer toutes les notifications comme lues
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Toutes les notifications marquées comme lues
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 updatedCount:
 *                   type: integer
 *                   description: Nombre de notifications mises à jour
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /notifications/priority:
 *   get:
 *     summary: Obtenir les notifications par priorité
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: priority
 *         required: true
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Priorité des notifications à récupérer
 *     responses:
 *       "200":
 *         description: Notifications prioritaires récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Notification'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /notifications/obsolete:
 *   delete:
 *     summary: Supprimer les notifications obsolètes
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Notifications obsolètes supprimées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 deletedCount:
 *                   type: integer
 *                   description: Nombre de notifications supprimées
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
