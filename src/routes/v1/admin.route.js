const express = require('express');
const auth = require('../../middlewares/auth');
const validate = require('../../middlewares/validate');
const adminValidation = require('../../validations/admin.validation');
const adminController = require('../../controllers/admin.controller');

const router = express.Router();

/**
 * Routes pour les administrateurs
 */

// Créer un administrateur
router.route('/').post(auth('manageAdmins'), validate(adminValidation.createAdmin), adminController.createAdmin);

// Mettre à jour les permissions d'un administrateur
router
  .route('/:adminId/permissions')
  .patch(auth('manageAdmins'), validate(adminValidation.updatePermissions), adminController.updatePermissions);

// Supprimer un administrateur
router.route('/:adminId').delete(auth('manageAdmins'), validate(adminValidation.deleteAdmin), adminController.deleteAdmin);

// Lister les administrateurs avec filtres et pagination
router.route('/').get(auth('viewAdmins'), validate(adminValidation.getAdmins), adminController.getAdmins);

// Obtenir les logs d'actions d'un administrateur
router
  .route('/:adminId/logs')
  .get(auth('viewAdminLogs'), validate(adminValidation.getActionLogs), adminController.getActionLogs);

module.exports = router;

/**
 * @swagger
 * tags:
 *   name: Admins
 *   description: Gestion des administrateurs
 */

/**
 * @swagger
 * /admins:
 *   post:
 *     summary: Créer un administrateur
 *     description: Seuls les superAdmins peuvent créer un nouvel administrateur.
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/AdminCreation'
 *     responses:
 *       "201":
 *         description: Administrateur créé
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Admin'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *
 *   get:
 *     summary: Lister les administrateurs
 *     description: Seuls les superAdmins et admins peuvent lister les administrateurs.
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 10
 *         description: Limite d’éléments par page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           description: Tri par champ (ex. "name:asc")
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           description: Filtrer par niveau (ex. "superAdmin")
 *     responses:
 *       "200":
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminList'
 */

/**
 * @swagger
 * /admins/{adminId}/permissions:
 *   patch:
 *     summary: Mettre à jour les permissions
 *     description: Seuls les superAdmins peuvent modifier les permissions d’un administrateur.
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l’administrateur
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               permissions:
 *                 type: array
 *                 items:
 *                   type: string
 *             example:
 *               permissions: ["manageUsers", "viewReports"]
 *     responses:
 *       "200":
 *         description: Permissions mises à jour
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Admin'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /admins/{adminId}:
 *   delete:
 *     summary: Supprimer un administrateur
 *     description: Seuls les superAdmins peuvent supprimer un administrateur.
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l’administrateur
 *     responses:
 *       "204":
 *         description: Administrateur supprimé
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */

/**
 * @swagger
 * /admins/{adminId}/logs:
 *   get:
 *     summary: Obtenir les logs d’actions
 *     description: Seuls les superAdmins peuvent consulter les logs d’actions d’un administrateur.
 *     tags: [Admins]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: adminId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID de l’administrateur
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 1
 *         description: Numéro de page
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *         default: 10
 *         description: Limite d’éléments par page
 *     responses:
 *       "200":
 *         description: Logs récupérés
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AdminLogs'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
