const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const productSchema = mongoose.Schema(
  {
    merchant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    price: {
      type: Number,
      required: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category', // Utilisation d’un modèle `Category` pour une meilleure gestion
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    stockHistory: [
      {
        date: { type: Date, default: Date.now },
        change: { type: Number }, // Quantité ajoutée ou retirée
        reason: { type: String }, // Raison de la modification
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    images: [
      {
        url: { type: String },
        altText: { type: String },
        width: { type: Number }, // Dimensions de l’image
        height: { type: Number },
      },
    ],
    promotion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Promotion', // Association à un modèle Promotion
    },
    reviewStats: {
      averageRating: { type: Number, default: 0 },
      totalReviews: { type: Number, default: 0 },
    },
    feedbacks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Feedback',
      },
    ],
    metaTitle: {
      type: String, // Pour le référencement SEO
    },
    metaDescription: {
      type: String, // Description pour le SEO
    },
    averageRating: {
      type: Number,
      default: 0, // Calculé dynamiquement
    },
  },
  {
    timestamps: true,
  }
);

// Ajouter les plugins
productSchema.plugin(toJSON);
productSchema.plugin(paginate);

// **Méthodes et Statics**

/**
 * Calculer la note moyenne des feedbacks
 */
productSchema.methods.calculateAverageRating = async function () {
  const Feedback = mongoose.model('Feedback');
  const feedbacks = await Feedback.find({ product: this._id });

  if (feedbacks.length > 0) {
    const totalRating = feedbacks.reduce((sum, feedback) => sum + feedback.rating, 0);
    this.averageRating = totalRating / feedbacks.length;
  } else {
    this.averageRating = 0;
  }

  await this.save();
};

/**
 * Mettre à jour le stock.
 * @param {Number} quantity - Quantité à ajouter ou retirer.
 * @param {String} reason - Raison de la modification.
 */
productSchema.methods.updateStock = async function (quantity, reason = 'update') {
  this.stock += quantity;
  if (this.stock < 0) throw new Error('Insufficient stock');
  this.stockHistory.push({ change: quantity, reason });
  await this.save();
};

/**
 * Vérifier la disponibilité.
 * @returns {Boolean} - Retourne `true` si le produit est disponible.
 */
productSchema.methods.isAvailable = function () {
  return this.stock > 0 && this.isActive;
};

/**
 * Désactiver temporairement un produit.
 */
productSchema.methods.deactivate = async function () {
  this.isActive = false;
  await this.save();
};

/**
 * Ajouter ou mettre à jour des images.
 * @param {Array} images - Tableau d'objets contenant `url` et `altText`.
 */
productSchema.methods.addOrUpdateImages = async function (images) {
  this.images = images;
  await this.save();
};

/**
 * Mettre à jour les statistiques des évaluations
 * @param {Number} rating - Nouvelle note ajoutée
 */
productSchema.methods.updateReviewStats = async function (rating) {
  const totalReviews = this.reviewStats.totalReviews + 1;
  const currentAverage = this.reviewStats.averageRating;
  this.reviewStats.averageRating = (currentAverage * this.reviewStats.totalReviews + rating) / totalReviews;
  this.reviewStats.totalReviews = totalReviews;
  await this.save();
};

/**
 * Ajouter des statistiques globales sur les produits.
 */
productSchema.statics.getProductStats = async function () {
  const totalProducts = await this.countDocuments();
  const totalActiveProducts = await this.countDocuments({ isActive: true });
  const avgPrice = await this.aggregate([{ $group: { _id: null, avgPrice: { $avg: '$price' } } }]);
  return {
    totalProducts,
    totalActiveProducts,
    avgPrice: avgPrice.length > 0 ? avgPrice[0].avgPrice : 0,
  };
};

const Product = mongoose.model('Product', productSchema);

module.exports = Product;
