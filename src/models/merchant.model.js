const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const merchantSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    storeName: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true },
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
      },
    ],
    promotions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Promotion',
      },
    ],
    orders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
      },
    ],
    sales: [
      {
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
        totalPrice: { type: Number },
        date: { type: Date },
      },
    ],
    returns: [
      {
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
        reason: { type: String },
        status: { type: String, enum: ['pending', 'resolved'], default: 'pending' },
        date: { type: Date, default: Date.now },
      },
    ],
    inventory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Inventory',
      },
    ],
    reviews: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review', // Évaluations reçues pour les produits
      },
    ],
    averageRating: {
      type: Number,
      default: 0, // Statistique : Note moyenne globale
    },
    notifications: [
      {
        message: { type: String },
        isRead: { type: Boolean, default: false },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    // Ajout des statistiques temporelles pour les ventes, revenus, et retours
    salesStats: {
      weekly: { type: Map, of: Number, default: {} },
      monthly: { type: Map, of: Number, default: {} },
      yearly: { type: Map, of: Number, default: {} },
    },
    revenueStats: {
      weekly: { type: Map, of: Number, default: {} },
      monthly: { type: Map, of: Number, default: {} },
      yearly: { type: Map, of: Number, default: {} },
    },
    returnStats: {
      weekly: { type: Map, of: Number, default: {} },
      monthly: { type: Map, of: Number, default: {} },
      yearly: { type: Map, of: Number, default: {} },
    },
    customSettings: {
      type: mongoose.Schema.Types.Mixed, // Permettre de stocker des configurations personnalisées pour chaque commerçant
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Ajouter les plugins
merchantSchema.plugin(toJSON);
merchantSchema.plugin(paginate);

/**
 * Gérer un retour.
 * @param {ObjectId} orderId - ID de la commande associée au retour.
 * @param {String} status - Nouveau statut du retour.
 */
merchantSchema.methods.manageReturn = async function (orderId, status) {
  const returnIndex = this.returns.findIndex((r) => r.orderId.toString() === orderId.toString());
  if (returnIndex !== -1) {
    this.returns[returnIndex].status = status;
    await this.save();
  } else {
    throw new Error('Return not found');
  }
};

/**
 * Mettre à jour la moyenne des évaluations globales du marchand.
 * @param {Number} newRating - Nouvelle note ajoutée.
 */
merchantSchema.methods.updateAverageRating = async function (newRating) {
  const reviewsCount = this.reviews.length;
  this.averageRating = (this.averageRating * reviewsCount + newRating) / (reviewsCount + 1);
  await this.save();
};

/**
 * Suivre les revenus.
 * @returns {Number} - Total des revenus.
 */
merchantSchema.methods.trackRevenue = function () {
  return this.sales.reduce((acc, sale) => acc + sale.totalPrice, 0);
};

/**
 * Ajouter une promotion.
 */
merchantSchema.methods.addPromotion = async function (promotionId) {
  this.promotions.push(promotionId);
  await this.save();
};

/**
 * Supprimer une promotion.
 */
merchantSchema.methods.removePromotion = async function (promotionId) {
  this.promotions = this.promotions.filter((promo) => promo.toString() !== promotionId.toString());
  await this.save();
};

/**
 * Ajouter une notification.
 * @param {String} message - Message de la notification.
 */
merchantSchema.methods.addNotification = async function (message) {
  this.notifications.push({ message });
  await this.save();
};

/**
 * Marquer toutes les notifications comme lues.
 */
merchantSchema.methods.markNotificationsAsRead = async function () {
  this.notifications.forEach((notification) => {
    // eslint-disable-next-line no-param-reassign
    notification.isRead = true;
  });
  await this.save();
};

/**
 * Mettre à jour les statistiques temporelles (ventes, revenus, retours).
 * @param {String} category - Catégorie à mettre à jour (salesStats, revenueStats, returnStats).
 * @param {String} period - Période (weekly, monthly, yearly).
 * @param {Number} amount - Montant à ajouter.
 */
merchantSchema.methods.updateStats = async function (category, period, amount) {
  if (['salesStats', 'revenueStats', 'returnStats'].includes(category) && ['weekly', 'monthly', 'yearly'].includes(period)) {
    const now = new Date();
    const key =
      period === 'weekly'
        ? `${now.getFullYear()}-W${Math.ceil(now.getDate() / 7)}`
        : period === 'monthly'
        ? `${now.getFullYear()}-${now.getMonth() + 1}`
        : `${now.getFullYear()}`;
    this[category][period].set(key, (this[category][period].get(key) || 0) + amount);
    await this.save();
  }
};

const Merchant = mongoose.model('Merchant', merchantSchema);

module.exports = Merchant;
