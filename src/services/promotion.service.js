const httpStatus = require('http-status');
const { Promotion } = require('../models');
const Campaign = require('../models/campaign.model');
const ApiError = require('../utils/ApiError');

/**
 * Créer une promotion.
 * @param {ObjectId} merchantId - ID du commerçant.
 * @param {Object} promotionData - Données de la promotion.
 * @returns {Promise<Promotion>}
 */
const createPromotion = async (merchantId, promotionData) => {
  const promotion = await Promotion.create({ ...promotionData, merchant: merchantId });
  return promotion;
};

/**
 * Mettre à jour une promotion.
 * @param {ObjectId} promotionId - ID de la promotion.
 * @param {Object} updateData - Données de mise à jour.
 * @returns {Promise<Promotion>}
 */
const updatePromotion = async (promotionId, updateData) => {
  const promotion = await Promotion.findById(promotionId);
  if (!promotion) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Promotion not found');
  }
  Object.assign(promotion, updateData);
  await promotion.save();
  return promotion;
};

/**
 * Désactiver ou activer une promotion.
 * @param {ObjectId} promotionId - ID de la promotion.
 * @param {Boolean} isActive - Statut actif ou inactif.
 * @returns {Promise<Promotion>}
 */
const togglePromotionStatus = async (promotionId, isActive) => {
  const promotion = await Promotion.findById(promotionId);
  if (!promotion) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Promotion not found');
  }
  promotion.isActive = isActive;
  await promotion.save();
  return promotion;
};

/**
 * Supprimer une promotion.
 * @param {ObjectId} promotionId - ID de la promotion.
 * @returns {Promise<void>}
 */
const deletePromotion = async (promotionId) => {
  const promotion = await Promotion.findById(promotionId);
  if (!promotion) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Promotion not found');
  }
  await promotion.remove();
};

/**
 * Récupérer les promotions actives.
 * @param {ObjectId} merchantId - ID du commerçant.
 * @param {Object} filters - Filtres de recherche.
 * @returns {Promise<QueryResult>}
 */
const getActivePromotions = async (merchantId, filters) => {
  const query = { merchant: merchantId, isActive: true };
  if (filters.region) {
    query.applicableRegions = filters.region;
  }
  if (filters.product) {
    query.applicableProducts = filters.product;
  }

  return Promotion.paginate(query, filters);
};

/**
 * Récupérer l'historique des promotions.
 * @param {ObjectId} merchantId - ID du commerçant.
 * @param {Object} filters - Filtres de recherche.
 * @returns {Promise<QueryResult>}
 */
const getPromotionHistory = async (merchantId, filters) => {
  const query = { merchant: merchantId };
  if (filters.region) {
    query.applicableRegions = filters.region;
  }
  if (filters.product) {
    query.applicableProducts = filters.product;
  }

  return Promotion.paginate(query, filters);
};

/**
 * Récupérer les statistiques d'une promotion spécifique.
 * @param {ObjectId} promotionId - ID de la promotion.
 * @returns {Promise<Object>}
 */
const getPromotionStats = async (promotionId) => {
  const promotion = await Promotion.findById(promotionId);
  if (!promotion) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Promotion not found');
  }

  return promotion.getPerformanceStats();
};

/**
 * Récupérer les promotions expirant bientôt.
 * @param {Number} days - Nombre de jours avant expiration.
 * @returns {Promise<Array>}
 */
const getExpiringPromotions = async (days) => {
  const now = new Date();
  const expirationThreshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

  return Promotion.find({
    isActive: true,
    expirationDate: { $lte: expirationThreshold },
  });
};

/**
 * Notifier les commerçants des promotions expirant bientôt.
 * @param {Number} days - Nombre de jours avant expiration.
 * @returns {Promise<Number>}
 */
const notifyExpiringPromotions = async (days) => {
  const promotions = await getExpiringPromotions(days);

  for (const promotion of promotions) {
    // Exemple : Appel au service de notification (non inclus ici)
    await notificationService.notifyMerchant(
      promotion.merchant,
      `Votre promotion "${promotion.code}" expire dans ${days} jours.`
    );
  }

  return promotions.length;
};

/**
 * Créer une campagne promotionnelle.
 * @param {ObjectId} merchantId - ID du commerçant.
 * @param {Object} campaignData - Données de la campagne.
 * @returns {Promise<Campaign>}
 */
const createCampaign = async (merchantId, campaignData) => {
  const campaign = await Campaign.create({ ...campaignData, merchant: merchantId });
  return campaign;
};

/**
 * Ajouter une promotion à une campagne.
 * @param {ObjectId} campaignId - ID de la campagne.
 * @param {ObjectId} promotionId - ID de la promotion.
 * @returns {Promise<Campaign>}
 */
const addPromotionToCampaign = async (campaignId, promotionId) => {
  const campaign = await Campaign.findById(campaignId);
  if (!campaign) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Campaign not found');
  }
  await campaign.addPromotion(promotionId);
  return campaign;
};

/**
 * Trouver la meilleure promotion applicable.
 * @param {ObjectId} userId - ID de l'utilisateur.
 * @param {Array} products - Liste des produits de la commande.
 * @returns {Promise<Promotion>}
 */
const findBestPromotion = async (userId, products) => {
  const applicablePromotions = await Promotion.find({
    isActive: true,
    applicableProducts: { $in: products.map((p) => p.productId) },
  });

  let bestPromotion = null;
  let maxDiscount = 0;

  for (const promo of applicablePromotions) {
    let discount = 0;
    if (promo.discountType === 'percentage') {
      discount = (products.reduce((sum, p) => sum + p.price * p.quantity, 0) * promo.discountValue) / 100;
    } else if (promo.discountType === 'fixed') {
      discount = promo.discountValue;
    }

    if (discount > maxDiscount) {
      maxDiscount = discount;
      bestPromotion = promo;
    }
  }

  return bestPromotion;
};

/**
 * Générer un rapport analytique pour les promotions.
 * @returns {Promise<Object>}
 */
const generatePromotionReport = async () => {
  const totalPromotions = await Promotion.countDocuments();
  const activePromotions = await Promotion.countDocuments({ isActive: true });
  const expiredPromotions = await Promotion.countDocuments({ isActive: false, expirationDate: { $lte: new Date() } });

  return {
    totalPromotions,
    activePromotions,
    expiredPromotions,
  };
};

module.exports = {
  createPromotion,
  updatePromotion,
  togglePromotionStatus,
  deletePromotion,
  getActivePromotions,
  getPromotionHistory,
  getPromotionStats,
  getExpiringPromotions,
  notifyExpiringPromotions,
  createCampaign,
  addPromotionToCampaign,
  findBestPromotion,
  generatePromotionReport,
};
