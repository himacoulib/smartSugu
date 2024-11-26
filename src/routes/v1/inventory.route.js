const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const inventoryValidation = require('../../validations/inventory.validation');
const inventoryController = require('../../controllers/inventory.controller');

const router = express.Router();

router
  .route('/')
  .get(auth('viewInventory'), validate(inventoryValidation.getInventory), inventoryController.getInventory) // Récupérer l'inventaire
  .post(auth('addProduct'), validate(inventoryValidation.addProductToInventory), inventoryController.addProductToInventory); // Ajouter un produit à l'inventaire

router
  .route('/:productId')
  .patch(
    auth('updateProduct'),
    validate(inventoryValidation.updateInventoryProduct),
    inventoryController.updateInventoryProduct
  ) // Mettre à jour un produit
  .delete(
    auth('deleteProduct'),
    validate(inventoryValidation.deleteProductFromInventory),
    inventoryController.deleteProductFromInventory
  ); // Supprimer un produit

router
  .route('/:productId/stock')
  .patch(auth('updateStock'), validate(inventoryValidation.updateProductStock), inventoryController.updateProductStock); // Mettre à jour le stock d'un produit

router.route('/stats').get(auth('viewInventory'), inventoryController.getInventoryStats); // Obtenir des statistiques d'inventaire

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Inventory
 *   description: Gestion de l'inventaire
 */

/**
 * @swagger
 * /inventory:
 *   get:
 *     summary: Récupérer l'inventaire
 *     tags: [Inventory]
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
 *         description: Nombre d'éléments par page
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: ID de la catégorie à filtrer
 *       - in: query
 *         name: minStock
 *         schema:
 *           type: integer
 *         description: Filtrer par stock minimal
 *     responses:
 *       "200":
 *         description: Inventaire récupéré avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Inventory'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   post:
 *     summary: Ajouter un produit à l'inventaire
 *     tags: [Inventory]
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
 *                 description: Quantité initiale
 *               lowStockThreshold:
 *                 type: integer
 *                 description: Seuil de stock bas
 *             example:
 *               productId: "60d21b4667d0d8992e610c85"
 *               quantity: 50
 *               lowStockThreshold: 10
 *     responses:
 *       "201":
 *         description: Produit ajouté avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Inventory'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /inventory/{productId}:
 *   patch:
 *     summary: Mettre à jour un produit dans l'inventaire
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID du produit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *               lowStockThreshold:
 *                 type: integer
 *             example:
 *               quantity: 30
 *               lowStockThreshold: 5
 *     responses:
 *       "200":
 *         description: Produit mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Inventory'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *   delete:
 *     summary: Supprimer un produit de l'inventaire
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID du produit
 *     responses:
 *       "200":
 *         description: Produit supprimé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Inventory'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /inventory/{productId}/stock:
 *   patch:
 *     summary: Mettre à jour le stock d’un produit
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: ID du produit
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
 *                 description: Quantité à ajouter ou retirer
 *             example:
 *               quantity: -5
 *     responses:
 *       "200":
 *         description: Stock mis à jour avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Inventory'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /inventory/stats:
 *   get:
 *     summary: Obtenir les statistiques d’inventaire
 *     tags: [Inventory]
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
 *                 totalItems:
 *                   type: integer
 *                 lowStockItems:
 *                   type: integer
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
