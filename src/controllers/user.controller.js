const httpStatus = require('http-status');
const pick = require('../utils/pick');
const ApiError = require('../utils/ApiError');
const catchAsync = require('../utils/catchAsync');
const { userService } = require('../services');
const logger = require('../config/logger');

/**
 * Créer un utilisateur.
 */
const createUser = catchAsync(async (req, res) => {
  logger.info(`[REQUEST] Création d'un utilisateur : IP=${req.ip}, Data=${JSON.stringify(req.body)}`);
  const user = await userService.createUser(req.body);
  logger.info(`[SUCCESS] Utilisateur créé : UserID=${user.id}`);
  res.status(httpStatus.CREATED).send(user);
});

/**
 * Obtenir la liste des utilisateurs avec pagination et filtres avancés.
 */
const getUsers = catchAsync(async (req, res) => {
  const filter = pick(req.query, ['name', 'role', 'isActive', 'createdAt', 'updatedAt']);
  const options = pick(req.query, ['sortBy', 'limit', 'page']);
  logger.info(`[REQUEST] Récupération des utilisateurs avec filtres : ${JSON.stringify(filter)}`);
  const result = await userService.queryUsers(filter, options);
  logger.info(`[SUCCESS] Utilisateurs récupérés : Total=${result.totalResults}`);
  res.send(result);
});

/**
 * Récupérer un utilisateur par ID.
 */
const getUser = catchAsync(async (req, res) => {
  logger.info(`[REQUEST] Récupération de l'utilisateur : UserID=${req.params.userId}`);
  const user = await userService.getUserById(req.params.userId);
  if (!user) {
    logger.warn(`[ERROR] Utilisateur introuvable : UserID=${req.params.userId}`);
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  logger.info(`[SUCCESS] Utilisateur récupéré : UserID=${user.id}`);
  res.send(user);
});

/**
 * Mettre à jour un utilisateur.
 */
const updateUser = catchAsync(async (req, res) => {
  logger.info(`[REQUEST] Mise à jour de l'utilisateur : UserID=${req.params.userId}`);
  const user = await userService.updateUserById(req.params.userId, req.body);
  logger.info(`[SUCCESS] Utilisateur mis à jour : UserID=${user.id}`);
  res.send(user);
});

/**
 * Supprimer un utilisateur.
 */
const deleteUser = catchAsync(async (req, res) => {
  logger.info(`[REQUEST] Suppression de l'utilisateur : UserID=${req.params.userId}`);
  await userService.deleteUserById(req.params.userId);
  logger.info(`[SUCCESS] Utilisateur supprimé : UserID=${req.params.userId}`);
  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Vérifier les identifiants utilisateur.
 */
const verifyCredentials = catchAsync(async (req, res) => {
  logger.info(`[REQUEST] Vérification des identifiants : Email=${req.body.email}`);
  const user = await userService.verifyCredentials(req.body.email, req.body.password);
  logger.info(`[SUCCESS] Identifiants vérifiés pour : UserID=${user.id}`);
  res.status(httpStatus.OK).send(user);
});

/**
 * Ajouter une notification promotionnelle.
 */
const addPromotionNotification = catchAsync(async (req, res) => {
  logger.info(`[REQUEST] Ajout d'une notification promotionnelle pour : UserID=${req.params.userId}`);
  await userService.addPromotionNotification(req.params.userId, req.body.message);
  logger.info(`[SUCCESS] Notification promotionnelle ajoutée pour : UserID=${req.params.userId}`);
  res.status(httpStatus.OK).send({ success: true });
});

/**
 * Désactiver un utilisateur temporairement.
 */
const deactivateUser = catchAsync(async (req, res) => {
  logger.info(`[REQUEST] Désactivation de l'utilisateur : UserID=${req.params.userId}`);
  const user = await userService.updateUserById(req.params.userId, { isActive: false });
  logger.info(`[SUCCESS] Utilisateur désactivé : UserID=${user.id}`);
  res.status(httpStatus.OK).send(user);
});

module.exports = {
  createUser,
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  verifyCredentials,
  addPromotionNotification,
  deactivateUser,
};
