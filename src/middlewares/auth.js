const passport = require('passport');
const httpStatus = require('http-status');
const ApiError = require('../utils/ApiError');
const { roleRights } = require('../config/roles');

/**
 * Vérifie si l'utilisateur possède les droits requis.
 * @param {Object} user - L'utilisateur authentifié.
 * @param {Array<string>} requiredRights - Les permissions requises.
 * @param {Object} req - La requête HTTP pour vérifier des règles contextuelles.
 * @returns {boolean} - True si l'utilisateur possède les permissions, False sinon.
 */
const hasRequiredPermissions = (user, requiredRights, req) => {
  const userRights = roleRights.get(user.role) || [];

  // Vérification des permissions explicites
  const hasExplicitRights = requiredRights.every((right) => userRights.includes(right));

  // Vérification contextuelle (ex. : accès à ses propres données)
  const hasContextualAccess = req.params.userId && req.params.userId === user.id;

  return hasExplicitRights || hasContextualAccess;
};

/**
 * Fonction de callback pour Passport.js.
 * @param {Object} req - La requête HTTP.
 * @param {Function} resolve - Résolution de la promesse.
 * @param {Function} reject - Rejet de la promesse.
 * @param {Array<string>} requiredRights - Les permissions requises.
 * @returns {Function} - La fonction de callback pour Passport.
 */
const verifyCallback = (req, resolve, reject, requiredRights) => async (err, user, info) => {
  if (err || info || !user) {
    return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
  }

  req.user = user;

  // Vérification des permissions
  if (requiredRights.length && !hasRequiredPermissions(user, requiredRights, req)) {
    return reject(new ApiError(httpStatus.FORBIDDEN, 'Forbidden'));
  }

  resolve();
};

/**
 * Middleware d'authentification et de vérification des permissions.
 * @param {...string} requiredRights - Les permissions requises pour l'accès.
 * @returns {Function} - Le middleware d'authentification.
 */
const auth =
  (...requiredRights) =>
  async (req, res, next) => {
    return new Promise((resolve, reject) => {
      passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject, requiredRights))(req, res, next);
    })
      .then(() => next())
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error(`[AUTH ERROR]: ${err.message}`, {
          user: req.user ? req.user.email : 'Unauthenticated',
          requiredRights,
        });
        next(err);
      });
  };

module.exports = auth;
