const httpStatus = require('http-status');
const Admin = require('../models/admin.model');
const ApiError = require('../utils/ApiError');

/**
 * Créer un nouvel administrateur.
 * @param {Object} adminBody - Données de l'administrateur.
 * @returns {Promise<Admin>}
 */
const createAdmin = async (adminBody) => {
  // Vérification : L'utilisateur existe-t-il déjà comme administrateur ?
  const adminExists = await Admin.findOne({ user: adminBody.user });
  if (adminExists) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cet utilisateur est déjà un administrateur.');
  }

  const admin = await Admin.create(adminBody);
  return admin;
};

/**
 * Mettre à jour les permissions d’un administrateur.
 * @param {ObjectId} adminId - ID de l’administrateur.
 * @param {Array<String>} permissions - Permissions à mettre à jour.
 * @returns {Promise<Admin>}
 */
const updatePermissions = async (adminId, permissions) => {
  const admin = await Admin.findById(adminId);
  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Administrateur non trouvé.');
  }

  admin.permissions = permissions;
  await admin.save();
  return admin;
};

/**
 * Supprimer un administrateur.
 * @param {ObjectId} adminId - ID de l’administrateur à supprimer.
 * @returns {Promise<void>}
 */
const deleteAdmin = async (adminId) => {
  const admin = await Admin.findById(adminId);
  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Administrateur non trouvé.');
  }

  const isSuperAdmin = admin.level === 'superAdmin';
  if (isSuperAdmin) {
    const superAdminsCount = await Admin.countDocuments({ level: 'superAdmin' });
    if (superAdminsCount === 1) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Impossible de supprimer le dernier superAdmin.');
    }
  }

  await admin.remove();
};

/**
 * Obtenir la liste des administrateurs avec recherche avancée.
 * @param {Object} query - Paramètres de recherche et de pagination.
 * @returns {Promise<Object>}
 */
const getAdmins = async ({ page = 1, limit = 10, sortBy = 'createdAt', order = 'desc', level }) => {
  const filters = level ? { level } : {};
  const options = {
    page,
    limit,
    sort: { [sortBy]: order === 'desc' ? -1 : 1 },
  };

  const admins = await Admin.paginate(filters, options);
  return admins;
};

/**
 * Obtenir les logs d’actions d’un administrateur.
 * @param {ObjectId} adminId - ID de l’administrateur.
 * @param {Object} query - Paramètres de recherche et de pagination.
 * @returns {Promise<Array>}
 */
const getActionLogs = async (adminId, { page = 1, limit = 10 }) => {
  const admin = await Admin.findById(adminId);
  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Administrateur non trouvé.');
  }

  const startIndex = (page - 1) * limit;
  const logs = admin.actionLogs.slice(startIndex, startIndex + limit);
  return logs;
};

/**
 * Ajouter un log d’action pour un administrateur.
 * @param {ObjectId} adminId - ID de l’administrateur.
 * @param {String} action - Description de l’action.
 * @param {Object} metadata - Métadonnées associées.
 * @returns {Promise<Admin>}
 */
const addActionLog = async (adminId, action, metadata = {}) => {
  const admin = await Admin.findById(adminId);
  if (!admin) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Administrateur non trouvé.');
  }

  admin.actionLogs.push({ action, metadata });
  await admin.save();
  return admin;
};

module.exports = {
  createAdmin,
  updatePermissions,
  deleteAdmin,
  getAdmins,
  getActionLogs,
  addActionLog,
};
