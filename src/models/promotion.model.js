const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const promotionSchema = mongoose.Schema(
  {
    merchant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
    },
    code: {
      type: String,
      required: true,
      unique: true,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      validate(value) {
        if (value <= 0) {
          throw new Error('Discount value must be positive.');
        }
      },
    },
    expirationDate: {
      type: Date,
      validate(value) {
        if (value && value < Date.now()) {
          throw new Error('Expiration date must be in the future.');
        }
      },
    },
    usageLimit: {
      type: Number,
      default: 1,
    },
    usedCount: {
      type: Number,
      default: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    redemptionHistory: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
        date: { type: Date, default: Date.now },
      },
    ],
    applicableRegions: [
      {
        type: String, // Régions spécifiques
      },
    ],
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Produits spécifiques
      },
    ],
    stats: {
      weekly: {
        type: Map,
        of: Number,
        default: {}, // Clés : `YYYY-WW`
      },
      monthly: {
        type: Map,
        of: Number,
        default: {}, // Clés : `YYYY-MM`
      },
      yearly: {
        type: Map,
        of: Number,
        default: {}, // Clés : `YYYY`
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User', // Ajout de l'auteur de la création
    },
  },
  {
    timestamps: true,
  }
);

// Plugins
promotionSchema.plugin(toJSON);
promotionSchema.plugin(paginate);

// Indexations
promotionSchema.index({ isActive: 1 });
promotionSchema.index({ expirationDate: 1 });
promotionSchema.index({ merchant: 1, code: 1 });

// Méthodes

/**
 * Vérifier la validité d'un code promotionnel.
 */
promotionSchema.methods.isValid = function () {
  const now = new Date();
  return this.isActive && this.usageLimit > this.usedCount && (!this.expirationDate || now <= this.expirationDate);
};

/**
 * Appliquer une promotion.
 */
promotionSchema.methods.applyPromotion = async function (userId, orderId) {
  if (!this.isValid()) {
    throw new Error('Promotion not valid or expired.');
  }
  this.usedCount += 1;
  this.redemptionHistory.push({ userId, orderId });

  // Mise à jour des statistiques
  const now = new Date();
  const currentWeek = `${now.getFullYear()}-${Math.ceil(now.getDate() / 7)}`;
  const currentMonth = `${now.getFullYear()}-${now.getMonth() + 1}`;
  const currentYear = `${now.getFullYear()}`;

  this.stats.weekly.set(currentWeek, (this.stats.weekly.get(currentWeek) || 0) + 1);
  this.stats.monthly.set(currentMonth, (this.stats.monthly.get(currentMonth) || 0) + 1);
  this.stats.yearly.set(currentYear, (this.stats.yearly.get(currentYear) || 0) + 1);

  await this.save();
};

/**
 * Désactiver une promotion.
 */
promotionSchema.methods.deactivate = async function () {
  this.isActive = false;
  await this.save();
};

/**
 * Activer une promotion.
 */
promotionSchema.methods.activate = async function () {
  this.isActive = true;
  await this.save();
};

/**
 * Récupérer les performances des promotions.
 */
promotionSchema.methods.getPerformanceStats = function () {
  const totalRedemptions = this.usedCount;
  const conversionRate = totalRedemptions / (this.usageLimit || 1); // Taux de conversion
  return {
    totalRedemptions,
    conversionRate,
    weeklyRedemptions: [...this.stats.weekly.entries()],
    monthlyRedemptions: [...this.stats.monthly.entries()],
    yearlyRedemptions: [...this.stats.yearly.entries()],
  };
};

const Promotion = mongoose.model('Promotion', promotionSchema);

module.exports = Promotion;
