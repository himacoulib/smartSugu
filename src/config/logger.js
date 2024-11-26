const winston = require('winston');
const config = require('./config');
const path = require('path');

// Ajout de formattage enrichi pour les erreurs
const enumerateErrorFormat = winston.format((info) => {
  if (info instanceof Error) {
    Object.assign(info, { message: info.stack });
  }
  return info;
});

// Configuration des transports pour différents environnements
const transports = [
  new winston.transports.Console({
    stderrLevels: ['error'],
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.printf(({ level, message }) => `${level}: ${message}`)
    ),
  }),
];

// En production, ajouter des fichiers pour les logs
if (config.env === 'production') {
  transports.push(
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join(__dirname, '../logs/combined.log'),
    })
  );
}

// Création du logger
const logger = winston.createLogger({
  level: config.env === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    enumerateErrorFormat(),
    config.env === 'development' ? winston.format.colorize() : winston.format.uncolorize(),
    winston.format.splat(),
    winston.format.printf(({ level, message }) => `${level}: ${message}`)
  ),
  transports,
});

module.exports = logger;
