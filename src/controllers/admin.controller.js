const httpStatus = require('http-status');
const catchAsync = require('../utils/catchAsync');
const { adminService, notificationService } = require('../services');
const logger = require('../config/logger');
const ApiError = require('../utils/ApiError');

/**
 * Suivi des performances pour mesurer le temps d'exécution des méthodes.
 * @param {Function} fn - Méthode à exécuter.
 * @param {string} action - Nom de l'action à loguer.
 */
const trackPerformance = async (fn, action) => {
  const startTime = Date.now();
  const result = await fn();
  const endTime = Date.now();
  logger.info(`[PERFORMANCE] Action=${action} - ExecutionTime=${endTime - startTime}ms`);
  return result;
};

/**
 * Créer un nouvel administrateur.
 */
const createAdmin = catchAsync(async (req, res) => {
  logger.info(`[REQUEST] Création d'un administrateur : UserID=${req.body.userId}`);

  // Vérification : L'utilisateur existe
  const admin = await trackPerformance(() => adminService.createAdmin(req.body), 'createAdmin');

  logger.info(`[SUCCESS] Administrateur créé : AdminID=${admin.id}`);
  res.status(httpStatus.CREATED).send(admin);
});

/**
 * Mettre à jour les permissions d'un administrateur.
 */
const updatePermissions = catchAsync(async (req, res) => {
  logger.info(`[REQUEST] Mise à jour des permissions pour AdminID=${req.params.adminId}`);

  // Vérification des permissions du demandeur (superAdmin requis)
  const updatedAdmin = await trackPerformance(
    () => adminService.updatePermissions(req.params.adminId, req.body.permissions),
    'updatePermissions'
  );

  logger.info(`[SUCCESS] Permissions mises à jour pour AdminID=${req.params.adminId}`);
  res.status(httpStatus.OK).send(updatedAdmin);
});

/**
 * Supprimer un administrateur.
 */
const deleteAdmin = catchAsync(async (req, res) => {
  logger.info(`[REQUEST] Suppression de l'administrateur : AdminID=${req.params.adminId}`);

  // Empêcher la suppression du dernier superAdmin
  await trackPerformance(() => adminService.deleteAdmin(req.params.adminId), 'deleteAdmin');

  logger.info(`[SUCCESS] Administrateur supprimé : AdminID=${req.params.adminId}`);
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Obtenir les administrateurs avec recherche avancée.
 */
const getAdmins = catchAsync(async (req, res) => {
  const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc', level } = req.query; // Recherche avancée
  logger.info(`[REQUEST] Récupération des administrateurs avec pagination et filtres.`);

  const admins = await trackPerformance(() => adminService.getAdmins({ page, limit, sortBy, order, level }), 'getAdmins');

  logger.info(`[SUCCESS] Administrateurs récupérés : Total=${admins.totalResults}`);
  res.status(httpStatus.OK).send(admins);
});

/**
 * Obtenir les logs d'actions d'un administrateur.
 */
const getActionLogs = catchAsync(async (req, res) => {
  logger.info(`[REQUEST] Récupération des logs pour AdminID=${req.params.adminId}`);

  const logs = await trackPerformance(() => adminService.getActionLogs(req.params.adminId, req.query), 'getActionLogs');

  logger.info(`[SUCCESS] Logs récupérés pour AdminID=${req.params.adminId} : Total=${logs.length}`);
  res.status(httpStatus.OK).send(logs);
});

module.exports = {
  createAdmin,
  updatePermissions,
  deleteAdmin,
  getAdmins,
  getActionLogs,
};
