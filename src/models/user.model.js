const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const { toJSON, paginate } = require('./plugins');
const { roles, roleRights } = require('../config/roles');
const logger = require('../config/logger'); // Ajout de logs

const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },
    password: {
      type: String,
      required: true,
      trim: true,
      minlength: 8,
      validate(value) {
        if (!value.match(/\d/) || !value.match(/[a-zA-Z]/)) {
          throw new Error('Password must contain at least one letter and one number');
        }
      },
      private: true,
    },
    role: {
      type: String,
      enum: roles,
      required: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    phone: {
      type: String,
      validate(value) {
        if (!/^\+?[0-9]{10,15}$/.test(value)) {
          throw new Error('Invalid phone number');
        }
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    notifications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Notification',
      },
    ],
    feedback: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Feedback',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Ajouter les plugins
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

/**
 * Vérifie si un utilisateur a une permission spécifique
 * @param {string} permission - La permission à vérifier
 * @returns {boolean}
 */
userSchema.methods.hasPermission = function (permission) {
  const permissions = roleRights.get(this.role) || [];
  return permissions.includes(permission);
};

/**
 * Marquer toutes les notifications comme lues
 */
userSchema.methods.markAllNotificationsAsRead = async function () {
  logger.info(`Marquage de toutes les notifications comme lues pour l'utilisateur : ID=${this._id}`);
  const Notification = mongoose.model('Notification');
  await Notification.updateMany({ user: this._id, isRead: false }, { $set: { isRead: true } });
};

/**
 * Récupérer tous les feedbacks associés à un utilisateur
 * @returns {Promise<Array>}
 */
userSchema.methods.getFeedbacks = async function () {
  logger.info(`Récupération des feedbacks pour l'utilisateur : ID=${this._id}`);
  const Feedback = mongoose.model('Feedback');
  return Feedback.find({ user: this._id });
};

// Méthode : Comparer le mot de passe
userSchema.methods.isPasswordMatch = async function (password) {
  return bcrypt.compare(password, this.password);
};

// Méthode : Vérifier si un email est déjà pris
userSchema.statics.isEmailTaken = async function (email, excludeUserId) {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
};

/**
 * Gérer les notifications liées aux promotions.
 */
userSchema.methods.addPromotionNotification = async function (message) {
  const Notification = mongoose.model('Notification');
  const notification = await Notification.create({
    user: this._id,
    message,
    type: 'promotion',
  });
  this.notifications.push(notification._id);
  await this.save();
};

// Validation avant sauvegarde
userSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 8);
  }

  if (!roles.includes(this.role)) {
    throw new Error(`Invalid role: ${this.role}`);
  }

  next();
});

const User = mongoose.model('User', userSchema);

module.exports = User;
