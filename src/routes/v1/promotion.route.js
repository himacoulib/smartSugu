const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const promotionValidation = require('../../validations/promotion.validation');
const promotionController = require('../../controllers/promotion.controller');

const router = express.Router();

/**
 * Routes principales pour la gestion des promotions
 */
router
  .route('/')
  .post(
    auth('createPromotion'), // Autorisation : création de promotion
    validate(promotionValidation.createPromotion),
    promotionController.createPromotion
  ) // Créer une promotion
  .get(
    auth('viewPromotionPerformance'), // Autorisation : visualisation des promotions actives
    validate(promotionValidation.getActivePromotions),
    promotionController.getActivePromotions
  ); // Récupérer les promotions actives

router
  .route('/history')
  .get(
    auth('viewPromotionPerformance'),
    validate(promotionValidation.getPromotionHistory),
    promotionController.getPromotionHistory
  ); // Historique des promotions

router
  .route('/:promotionId')
  .patch(auth('managePromotions'), validate(promotionValidation.updatePromotion), promotionController.updatePromotion) // Mettre à jour une promotion
  .delete(auth('managePromotions'), validate(promotionValidation.deletePromotion), promotionController.deletePromotion); // Supprimer une promotion

router.route('/:promotionId/activate').patch(auth('managePromotions'), promotionController.activatePromotion); // Activer une promotion

router.route('/:promotionId/deactivate').patch(auth('managePromotions'), promotionController.deactivatePromotion); // Désactiver une promotion

/**
 * Routes pour les statistiques des promotions
 */
router.route('/stats/global').get(auth('viewPromotionPerformance'), promotionController.getGlobalPromotionStats); // Statistiques globales des promotions

router.route('/:promotionId/stats').get(auth('viewPromotionPerformance'), promotionController.getPromotionStats); // Statistiques détaillées d’une promotion

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Promotions
 *   description: Gestion des promotions
 */

/**
 * @swagger
 * /promotions:
 *   post:
 *     summary: Créer une promotion
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Promotion'
 *     responses:
 *       "201":
 *         description: Promotion créée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Promotion'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *   get:
 *     summary: Récupérer les promotions actives
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limite de résultats par page
 *     responses:
 *       "200":
 *         description: Liste des promotions actives récupérée
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PromotionList'
 */

/**
 * @swagger
 * /promotions/{promotionId}:
 *   patch:
 *     summary: Mettre à jour une promotion
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: promotionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la promotion
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Promotion'
 *     responses:
 *       "200":
 *         description: Promotion mise à jour avec succès
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *   delete:
 *     summary: Supprimer une promotion
 *     tags: [Promotions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: promotionId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de la promotion
 *     responses:
 *       "204":
 *         description: Promotion supprimée avec succès
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
