const httpStatus = require('http-status');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const logger = require('../config/logger'); // Ajout de logs détaillés

/**
 * Créer un utilisateur.
 * @param {Object} userBody
 * @returns {Promise<User>}
 */
const createUser = async (userBody) => {
  if (await User.isEmailTaken(userBody.email)) {
    logger.error(`[SERVICE ERROR] L'email ${userBody.email} est déjà pris.`);
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  logger.info(`[CREATE USER] Tentative de création d'un utilisateur : ${JSON.stringify(userBody)}`);
  return User.create(userBody);
};

/**
 * Rechercher des utilisateurs avec pagination et filtres avancés.
 * @param {Object} filter - MongoDB filter
 * @param {Object} options - Options de requête
 * @param {string} [options.sortBy] - Tri : format champ:(asc|desc)
 * @param {number} [options.limit] - Résultats max par page (par défaut = 10)
 * @param {number} [options.page] - Page actuelle (par défaut = 1)
 * @returns {Promise<QueryResult>}
 */
const queryUsers = async (filter, options) => {
  logger.info(`[QUERY USERS] Requête avec filtre : ${JSON.stringify(filter)}, options : ${JSON.stringify(options)}`);
  const users = await User.paginate(filter, options);
  logger.info(`[SERVICE SUCCESS] ${users.results.length} utilisateurs récupérés.`);
  return users;
};

/**
 * Obtenir un utilisateur par ID.
 * @param {ObjectId} id
 * @returns {Promise<User>}
 */
const getUserById = async (id) => {
  logger.info(`[SERVICE] Recherche de l'utilisateur par ID=${id}`);
  const user = await User.findById(id);
  if (!user) {
    logger.error(`[SERVICE ERROR] Utilisateur non trouvé : ID=${id}`);
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  logger.info(`[SERVICE SUCCESS] Utilisateur trouvé : ${JSON.stringify(user)}`);
  return user;
};

/**
 * Obtenir un utilisateur par email.
 * @param {string} email
 * @returns {Promise<User>}
 */
const getUserByEmail = async (email) => {
  logger.info(`[GET USER BY EMAIL] Requête pour email=${email}`);
  return User.findOne({ email });
};

/**
 * Mettre à jour un utilisateur par ID.
 * @param {ObjectId} userId
 * @param {Object} updateBody
 * @returns {Promise<User>}
 */
const updateUserById = async (userId, updateBody) => {
  logger.info(`[SERVICE] Mise à jour de l'utilisateur : ID=${userId}`);
  const user = await getUserById(userId);
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    logger.error(`[SERVICE ERROR] Email déjà utilisé : ${updateBody.email}`);
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }
  Object.assign(user, updateBody);
  await user.save();
  logger.info(`[SERVICE SUCCESS] Utilisateur mis à jour : ${JSON.stringify(user)}`);
  return user;
};

/**
 * Supprimer un utilisateur par ID.
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deleteUserById = async (userId) => {
  logger.info(`[DELETE USER] Tentative de suppression pour UserID=${userId}`);
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await user.remove();
  logger.info(`[SUCCESS] Utilisateur supprimé : UserID=${userId}`);
  return user;
};

/**
 * Vérifier les identifiants utilisateur.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<User>}
 */
const verifyCredentials = async (email, password) => {
  logger.info(`[VERIFY CREDENTIALS] Vérification des identifiants pour email=${email}`);
  const user = await getUserByEmail(email);
  if (!user || !(await user.isPasswordMatch(password))) {
    logger.warn(`[ERROR] Identifiants invalides pour email=${email}`);
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Invalid credentials');
  }
  logger.info(`[SUCCESS] Identifiants vérifiés pour UserID=${user.id}`);
  return user;
};

/**
 * Ajouter une notification promotionnelle pour un utilisateur.
 * @param {ObjectId} userId
 * @param {string} message
 * @returns {Promise<void>}
 */
const addPromotionNotification = async (userId, message) => {
  logger.info(`[ADD PROMOTION NOTIFICATION] Pour UserID=${userId}, message="${message}"`);
  const user = await getUserById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await user.addPromotionNotification(message);
  logger.info(`[SUCCESS] Notification promotionnelle ajoutée pour UserID=${userId}`);
};

/**
 * Désactiver temporairement un utilisateur.
 * @param {ObjectId} userId
 * @returns {Promise<User>}
 */
const deactivateUserById = async (userId) => {
  logger.info(`[DEACTIVATE USER] Désactivation pour UserID=${userId}`);
  const user = await updateUserById(userId, { isActive: false });
  logger.info(`[SUCCESS] Utilisateur désactivé : UserID=${userId}`);
  return user;
};

module.exports = {
  createUser,
  queryUsers,
  getUserById,
  getUserByEmail,
  updateUserById,
  deleteUserById,
  verifyCredentials,
  addPromotionNotification,
  deactivateUserById,
};
