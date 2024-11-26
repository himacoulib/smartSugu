const rateLimit = require('express-rate-limit');
const logger = require('../config/logger');

/**
 * Limiteur de débit pour les requêtes d'authentification.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req, res) => {
    // Limites personnalisées en fonction du rôle
    if (req.user && req.user.role === 'admin') return 100; // Administrateurs : 100 requêtes
    return 20; // Autres utilisateurs : 20 requêtes
  },
  skipSuccessfulRequests: true,
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded: IP=${req.ip}, User=${req.user ? req.user.email : 'Unknown'}, Limit=${options.max}`);
    res.status(429).send({
      code: 429,
      message: 'Too many requests, please try again later.',
    });
  },
});

module.exports = {
  authLimiter,
};
