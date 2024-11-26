const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const feedbackValidation = require('../../validations/feedback.validation');
const feedbackController = require('../../controllers/feedback.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('createFeedback'), validate(feedbackValidation.createFeedback), feedbackController.createFeedback) // Créer un feedback
  .get(auth('viewFeedbacks'), validate(feedbackValidation.getUserFeedbacks), feedbackController.getUserFeedbacks); // Récupérer les feedbacks de l'utilisateur

router
  .route('/:feedbackId')
  .patch(auth('updateFeedback'), validate(feedbackValidation.updateFeedback), feedbackController.updateFeedback) // Mettre à jour un feedback
  .delete(auth('deleteFeedback'), validate(feedbackValidation.deleteFeedback), feedbackController.deleteFeedback); // Supprimer un feedback

router.route('/stats').get(auth('viewFeedbackStats'), feedbackController.getFeedbackStats); // Statistiques globales

router
  .route('/priority/:priority')
  .get(
    auth('viewFeedbacks'),
    validate(feedbackValidation.getFeedbacksByPriority),
    feedbackController.getFeedbacksByPriority
  ); // Feedbacks par priorité

router
  .route('/status/:status')
  .get(auth('viewFeedbacks'), validate(feedbackValidation.getFeedbacksByStatus), feedbackController.getFeedbacksByStatus); // Feedbacks par statut

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Feedbacks
 *   description: Gestion des retours utilisateurs
 */

/**
 * @swagger
 * /feedbacks:
 *   post:
 *     summary: Créer un feedback
 *     tags: [Feedbacks]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - rating
 *             properties:
 *               title:
 *                 type: string
 *                 description: Titre du feedback
 *               description:
 *                 type: string
 *                 description: Description détaillée du feedback
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Note sur 5
 *               product:
 *                 type: string
 *                 format: uuid
 *                 description: ID du produit concerné (optionnel)
 *             example:
 *               title: "Produit excellent"
 *               description: "J'adore ce produit, il est parfait pour mes besoins"
 *               rating: 5
 *               product: "60d21b4667d0d8992e610c85"
 *     responses:
 *       "201":
 *         description: Feedback créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Feedback'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *   get:
 *     summary: Récupérer les feedbacks de l'utilisateur
 *     tags: [Feedbacks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Numéro de la page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Nombre d'éléments par page
 *     responses:
 *       "200":
 *         description: Liste des feedbacks récupérée
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 results:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Feedback'
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
 * /feedbacks/{feedbackId}:
 *   patch:
 *     summary: Mettre à jour un feedback
 *     tags: [Feedbacks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: feedbackId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID du feedback
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Nouveau titre
 *               description:
 *                 type: string
 *                 description: Nouvelle description
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 description: Nouvelle note
 *             example:
 *               title: "Produit mis à jour"
 *               description: "Le produit a été amélioré, vraiment top maintenant"
 *               rating: 5
 *     responses:
 *       "200":
 *         description: Feedback mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Feedback'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *   delete:
 *     summary: Supprimer un feedback
 *     tags: [Feedbacks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: feedbackId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID du feedback
 *     responses:
 *       "200":
 *         description: Feedback supprimé avec succès
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /feedbacks/stats:
 *   get:
 *     summary: Obtenir des statistiques globales
 *     tags: [Feedbacks]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Statistiques récupérées
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalFeedbacks:
 *                   type: integer
 *                 averageRating:
 *                   type: number
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /feedbacks/priority/{priority}:
 *   get:
 *     summary: Obtenir les feedbacks par priorité
 *     tags: [Feedbacks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: priority
 *         required: true
 *         schema:
 *           type: string
 *           enum: [low, medium, high]
 *         description: Niveau de priorité
 *     responses:
 *       "200":
 *         description: Liste des feedbacks récupérée
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Feedback'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /feedbacks/status/{status}:
 *   get:
 *     summary: Obtenir les feedbacks par statut
 *     tags: [Feedbacks]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: status
 *         required: true
 *         schema:
 *           type: string
 *           enum: [pending, in_progress, resolved]
 *         description: Statut du feedback
 *     responses:
 *       "200":
 *         description: Liste des feedbacks récupérée
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Feedback'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
