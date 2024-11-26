const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const cartValidation = require('../../validations/cart.validation');
const cartController = require('../../controllers/cart.controller');

const router = express.Router();

router
  .route('/')
  .get(auth('viewCart'), cartController.getCartDetails) // Obtenir les détails du panier
  .delete(auth('clearCart'), cartController.clearCart); // Vider le panier

router.route('/item').post(auth('addToCart'), validate(cartValidation.addToCart), cartController.addToCart); // Ajouter un produit au panier

router
  .route('/item/:productId')
  .patch(auth('updateCartItem'), validate(cartValidation.updateCartItem), cartController.updateCartItem) // Mettre à jour la quantité d'un produit
  .delete(auth('removeFromCart'), validate(cartValidation.removeFromCart), cartController.removeFromCart); // Supprimer un produit du panier

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Gestion du panier utilisateur
 */

/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Obtenir les détails du panier
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Détails du panier récupérés avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     summary: Vider le panier
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Panier vidé avec succès
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /cart/item:
 *   post:
 *     summary: Ajouter un produit au panier
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *               - quantity
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *                 description: ID du produit à ajouter
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Quantité à ajouter
 *             example:
 *               productId: "60d21b4667d0d8992e610c85"
 *               quantity: 2
 *     responses:
 *       "200":
 *         description: Produit ajouté au panier
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /cart/item/{productId}:
 *   patch:
 *     summary: Mettre à jour la quantité d'un produit dans le panier
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID du produit à mettre à jour
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quantity
 *             properties:
 *               quantity:
 *                 type: integer
 *                 minimum: 1
 *                 description: Nouvelle quantité
 *             example:
 *               quantity: 3
 *     responses:
 *       "200":
 *         description: Quantité mise à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *   delete:
 *     summary: Supprimer un produit du panier
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID du produit à supprimer
 *     responses:
 *       "200":
 *         description: Produit supprimé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Cart'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
