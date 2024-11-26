const mongoose = require('mongoose');
const { roleRights } = require('../config/roles');

const adminSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // Un administrateur unique par utilisateur
    },
    permissions: [
      {
        type: String,
        enum: roleRights.get('admin'), // Permissions définies pour les admins
        required: true,
      },
    ],
    actionLogs: [
      {
        action: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        metadata: { type: mongoose.Schema.Types.Mixed }, // Métadonnées optionnelles
      },
    ],
    level: {
      type: String,
      enum: ['superAdmin', 'admin', 'moderator'], // Différents niveaux d'administration
      default: 'admin',
    },
  },
  {
    timestamps: true,
  }
);

// Méthode : Vérifie une permission spécifique
adminSchema.methods.hasPermission = function (permission) {
  return this.permissions.includes(permission);
};

// Méthode : Ajouter un log d'action
adminSchema.methods.addActionLog = async function (action, metadata = {}) {
  this.actionLogs.push({ action, metadata });
  await this.save();
};

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
