const morgan = require('morgan');
const config = require('./config');
const logger = require('./logger');

// Définir un seuil pour les requêtes lentes (en millisecondes)
const SLOW_REQUEST_THRESHOLD = 2000;

morgan.token('message', (req, res) => res.locals.errorMessage || '');
morgan.token('slowRequest', (req, res) => (res.responseTime > SLOW_REQUEST_THRESHOLD ? 'SLOW' : ''));

const getIpFormat = () => (config.env === 'production' ? ':remote-addr - ' : '');
const successResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms :slowRequest`;
const errorResponseFormat = `${getIpFormat()}:method :url :status - :response-time ms - message: :message`;

const successHandler = morgan(successResponseFormat, {
  skip: (req, res) => res.statusCode >= 400,
  stream: {
    write: (message) => {
      logger.info(message.trim());
    },
  },
});

const errorHandler = morgan(errorResponseFormat, {
  skip: (req, res) => res.statusCode < 400,
  stream: {
    write: (message) => {
      logger.error(message.trim());
    },
  },
});

module.exports = {
  successHandler,
  errorHandler,
};
