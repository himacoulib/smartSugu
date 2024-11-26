const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const reviewSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    merchant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 500,
    },
    keywords: [
      {
        type: String,
      },
    ],
    stats: {
      weekly: {
        type: Map,
        of: Number,
        default: {},
      },
      monthly: {
        type: Map,
        of: Number,
        default: {},
      },
    },
  },
  {
    timestamps: true,
  }
);

// Ajouter les plugins
reviewSchema.plugin(toJSON);
reviewSchema.plugin(paginate);

// Index pour optimiser les recherches
reviewSchema.index({ product: 1, rating: -1 });
reviewSchema.index({ merchant: 1, rating: -1 });

// Méthode : Vérifier si une évaluation peut être modifiée par l'utilisateur
reviewSchema.methods.canBeModifiedBy = function (userId) {
  return this.user.toString() === userId.toString();
};

// Méthode : Calculer la note moyenne pour un produit ou un commerçant
reviewSchema.statics.calculateAverageRating = async function (referenceId, referenceType = 'product') {
  const filter = referenceType === 'merchant' ? { merchant: referenceId } : { product: referenceId };
  const reviews = await this.find(filter);

  if (!reviews.length) return 0;
  const total = reviews.reduce((acc, review) => acc + review.rating, 0);
  return total / reviews.length;
};

// Méthode : Mise à jour des statistiques périodiques
reviewSchema.methods.updateStats = async function () {
  const now = new Date();
  const weekKey = `${now.getFullYear()}-W${Math.ceil(now.getDate() / 7)}`;
  const monthKey = `${now.getFullYear()}-${now.getMonth() + 1}`;

  this.stats.weekly.set(weekKey, (this.stats.weekly.get(weekKey) || 0) + 1);
  this.stats.monthly.set(monthKey, (this.stats.monthly.get(monthKey) || 0) + 1);

  await this.save();
};

// Méthode : Récupérer les mots-clés les plus fréquents
reviewSchema.statics.getTopKeywords = async function (merchantId, limit = 10) {
  const reviews = await this.find({ merchant: merchantId });
  const keywordCounts = {};

  reviews.forEach((review) => {
    review.keywords.forEach((keyword) => {
      keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
    });
  });

  return Object.entries(keywordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([keyword]) => keyword);
};

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
