const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const merchantValidation = require('../../validations/merchant.validation');
const merchantController = require('../../controllers/merchant.controller');

const router = express.Router();

// Routes pour les produits
router.route('/products').post(auth('addProduct'), validate(merchantValidation.addProduct), merchantController.addProduct);

router
  .route('/products/:productId')
  .patch(auth('updateProduct'), validate(merchantValidation.updateProduct), merchantController.updateProduct)
  .delete(auth('deleteProduct'), validate(merchantValidation.deleteProduct), merchantController.deleteProduct);

router
  .route('/products/:productId/deactivate')
  .patch(auth('deactivateProduct'), validate(merchantValidation.deactivateProduct), merchantController.deactivateProduct);

// Routes pour les commandes
router
  .route('/orders/pending')
  .get(auth('manageOrders'), validate(merchantValidation.getPendingOrders), merchantController.getPendingOrders);

router
  .route('/orders/:orderId')
  .patch(auth('processOrder'), validate(merchantValidation.processOrder), merchantController.processOrder);

router
  .route('/orders/history')
  .get(auth('viewOrderHistory'), validate(merchantValidation.getOrderHistory), merchantController.getOrderHistory);

// Routes pour les rapports et statistiques
router
  .route('/reports/financial')
  .get(
    auth('viewReports'),
    validate(merchantValidation.generateFinancialReport),
    merchantController.generateFinancialReport
  );

router
  .route('/sales/stats')
  .get(auth('viewAnalytics'), validate(merchantValidation.getSalesStats), merchantController.getSalesStats);

// Route pour le tableau de bord
router.route('/dashboard').get(auth('viewAnalytics'), merchantController.getRealTimeDashboard);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Merchants
 *   description: Merchant management and operations
 */

/**
 * @swagger
 * /merchants/products:
 *   post:
 *     summary: Add a product
 *     description: Merchants can add products to their inventory.
 *     tags: [Merchants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       "201":
 *         description: Product added successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *
 * /merchants/products/{productId}:
 *   patch:
 *     summary: Update a product
 *     description: Merchants can update their product details.
 *     tags: [Merchants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       "200":
 *         description: Product updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Product'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Delete a product
 *     description: Merchants can delete their products.
 *     tags: [Merchants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       "204":
 *         description: Product deleted successfully.
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 * /merchants/products/{productId}/deactivate:
 *   patch:
 *     summary: Deactivate a product
 *     description: Temporarily deactivate a product.
 *     tags: [Merchants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *     responses:
 *       "200":
 *         description: Product deactivated successfully.
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 * /merchants/orders/pending:
 *   get:
 *     summary: Get pending orders
 *     description: Merchants can view all pending orders.
 *     tags: [Merchants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: List of pending orders.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *
 * /merchants/orders/{orderId}:
 *   patch:
 *     summary: Process an order
 *     description: Merchants can update the status of an order.
 *     tags: [Merchants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *         description: Order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [processing, completed, cancelled]
 *             example:
 *               status: completed
 *     responses:
 *       "200":
 *         description: Order processed successfully.
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 *
 * /merchants/orders/history:
 *   get:
 *     summary: Get order history
 *     description: Merchants can retrieve their order history with filters.
 *     tags: [Merchants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: List of order history.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Order'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */
