const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const productValidation = require('../../validations/product.validation');
const productController = require('../../controllers/product.controller');

const router = express.Router();

// Routes pour la gestion des produits
router
  .route('/')
  .post(auth('addProduct'), validate(productValidation.createProduct), productController.createProduct)
  .get(validate(productValidation.searchProducts), productController.searchProducts);

router.route('/stats').get(auth('manageProducts'), productController.getProductStats);

router
  .route('/:productId')
  .get(validate(productValidation.getProduct), productController.getProductDetails)
  .patch(auth('updateProduct'), validate(productValidation.updateProduct), productController.updateProduct)
  .delete(auth('removeProduct'), validate(productValidation.deleteProduct), productController.deleteProduct);

router
  .route('/:productId/stock')
  .patch(auth('updateProductStock'), validate(productValidation.updateStock), productController.updateStock);

router
  .route('/:productId/visibility')
  .patch(auth('setProductVisibility'), validate(productValidation.updateVisibility), productController.updateVisibility);

router
  .route('/:productId/images')
  .patch(auth('updateProduct'), validate(productValidation.updateImages), productController.addOrUpdateImages);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Gestion des produits
 */

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Ajouter un produit
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductInput'
 *     responses:
 *       "201":
 *         description: Produit créé avec succès
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   get:
 *     summary: Rechercher des produits
 *     tags: [Products]
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
 *         description: Filtrer par catégorie
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Prix minimum
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Prix maximum
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Recherche textuelle
 *     responses:
 *       "200":
 *         description: Liste des produits
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedProducts'
 */

/**
 * @swagger
 * /products/stats:
 *   get:
 *     summary: Obtenir les statistiques des produits
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Statistiques des produits
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalProducts:
 *                   type: integer
 *                 totalActiveProducts:
 *                   type: integer
 *                 avgPrice:
 *                   type: number
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */

/**
 * @swagger
 * /products/{productId}:
 *   get:
 *     summary: Obtenir les détails d'un produit
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du produit
 *     responses:
 *       "200":
 *         description: Détails du produit
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   patch:
 *     summary: Mettre à jour un produit
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID du produit
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ProductUpdate'
 *     responses:
 *       "200":
 *         description: Produit mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /products/{productId}/stock:
 *   patch:
 *     summary: Mettre à jour le stock d'un produit
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
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
 *               reason:
 *                 type: string
 *                 description: Raison de la modification
 *     responses:
 *       "200":
 *         description: Stock mis à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
