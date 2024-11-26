const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const reviewValidation = require('../../validations/review.validation');
const reviewController = require('../../controllers/review.controller');

const router = express.Router();

router
  .route('/')
  .post(auth('addReview'), validate(reviewValidation.addReview), reviewController.addReview) // Ajouter une évaluation
  .get(auth('getMerchantReviews'), validate(reviewValidation.getMerchantReviews), reviewController.getMerchantReviews); // Obtenir les évaluations d'un marchand

router
  .route('/:reviewId')
  .patch(auth('updateReview'), validate(reviewValidation.updateReview), reviewController.updateReview) // Mettre à jour une évaluation
  .delete(auth('deleteReview'), validate(reviewValidation.deleteReview), reviewController.deleteReview); // Supprimer une évaluation

router
  .route('/product/:productId')
  .get(auth('getReviewsForProduct'), validate(reviewValidation.getReviewsForProduct), reviewController.getReviewsForProduct); // Obtenir les évaluations d'un produit

router.route('/stats').get(auth('getMerchantReviewStats'), reviewController.getReviewStats); // Obtenir les statistiques des évaluations

router.route('/keywords').get(auth('getTopKeywords'), reviewController.getTopKeywords); // Obtenir les mots-clés les plus fréquents

router.route('/periodic-stats').get(auth('getPeriodicStats'), reviewController.getPeriodicStats); // Obtenir les statistiques périodiques

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Gestion des évaluations des produits et commerçants
 */

/**
 * @swagger
 * /reviews:
 *   post:
 *     summary: Ajouter une évaluation
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Review'
 *     responses:
 *       "201":
 *         description: Évaluation ajoutée avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *   get:
 *     summary: Obtenir les évaluations d'un marchand
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page de pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limite par page
 *     responses:
 *       "200":
 *         description: Évaluations récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReviewPagination'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /reviews/{reviewId}:
 *   patch:
 *     summary: Mettre à jour une évaluation
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'évaluation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReviewUpdate'
 *     responses:
 *       "200":
 *         description: Évaluation mise à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Review'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     summary: Supprimer une évaluation
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l'évaluation
 *     responses:
 *       "204":
 *         description: Évaluation supprimée avec succès
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /reviews/product/{productId}:
 *   get:
 *     summary: Obtenir les évaluations pour un produit
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du produit
 *     responses:
 *       "200":
 *         description: Évaluations récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReviewPagination'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /reviews/stats:
 *   get:
 *     summary: Obtenir les statistiques des évaluations
 *     tags: [Reviews]
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
 *                 totalReviews:
 *                   type: integer
 *                 averageRating:
 *                   type: number
 *                   format: float
 *                 distribution:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       rating:
 *                         type: integer
 *                       count:
 *                         type: integer
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /reviews/keywords:
 *   get:
 *     summary: Obtenir les mots-clés les plus fréquents
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Mots-clés récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 keywords:
 *                   type: array
 *                   items:
 *                     type: string
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /reviews/periodic-stats:
 *   get:
 *     summary: Obtenir les statistiques périodiques
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Statistiques périodiques récupérées avec succès
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 weekly:
 *                   type: object
 *                   additionalProperties:
 *                     type: integer
 *                 monthly:
 *                   type: object
 *                   additionalProperties:
 *                     type: integer
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
