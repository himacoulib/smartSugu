const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const config = require('./config');
const { tokenTypes } = require('./tokens');
const { User } = require('../models');
const logger = require('./logger');

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

/**
 * Vérifie le jeton JWT.
 * @param {Object} payload - Les données extraites du jeton.
 * @param {Function} done - Callback pour la stratégie Passport.
 */
const jwtVerify = async (payload, done) => {
  try {
    if (payload.type !== tokenTypes.ACCESS) {
      logger.warn(`Invalid token type: ${payload.type}`);
      throw new Error('Invalid token type');
    }

    const user = await User.findById(payload.sub);
    if (!user) {
      logger.warn(`User not found: ID=${payload.sub}`);
      return done(null, false);
    }

    if (!user.isActive) {
      logger.warn(`Inactive user attempted login: ID=${user.id}`);
      return done(null, false);
    }

    done(null, user);
  } catch (error) {
    logger.error(`JWT verification failed: ${error.message}`);
    done(error, false);
  }
};

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

module.exports = {
  jwtStrategy,
};
