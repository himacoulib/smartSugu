const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const categorySchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category', // Association avec une catégorie parent
    },
    image: {
      url: { type: String }, // URL de l'image associée à la catégorie
      altText: { type: String }, // Texte alternatif pour l'accessibilité
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    seo: {
      metaTitle: { type: String }, // Titre pour le SEO
      metaDescription: { type: String }, // Description pour le SEO
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product', // Association avec les produits de la catégorie
      },
    ],
    stats: {
      totalProducts: { type: Number, default: 0 }, // Nombre total de produits
      averagePrice: { type: Number, default: 0 }, // Prix moyen des produits
    },
  },
  {
    timestamps: true,
  }
);

// **Ajouter les plugins**
categorySchema.plugin(toJSON);
categorySchema.plugin(paginate);

// **Méthodes et Statics**

/**
 * Mettre à jour les statistiques de la catégorie.
 */
categorySchema.methods.updateStats = async function () {
  const Product = mongoose.model('Product');
  const products = await Product.find({ category: this._id });

  this.stats.totalProducts = products.length;

  if (products.length > 0) {
    const totalPrice = products.reduce((acc, product) => acc + product.price, 0);
    this.stats.averagePrice = totalPrice / products.length;
  } else {
    this.stats.averagePrice = 0;
  }

  await this.save();
};

/**
 * Récupérer les catégories actives.
 * @returns {Promise<Array>}
 */
categorySchema.statics.getActiveCategories = async function () {
  return this.find({ isActive: true });
};

/**
 * Désactiver une catégorie et ses sous-catégories.
 */
categorySchema.methods.deactivateCategory = async function () {
  this.isActive = false;
  await this.save();

  const subCategories = await mongoose.model('Category').find({ parentCategory: this._id });
  for (const subCategory of subCategories) {
    await subCategory.deactivateCategory();
  }
};

/**
 * Ajouter un produit à une catégorie.
 * @param {ObjectId} productId - ID du produit à ajouter.
 */
categorySchema.methods.addProduct = async function (productId) {
  if (!this.products.includes(productId)) {
    this.products.push(productId);
    await this.updateStats();
  }
};

/**
 * Supprimer un produit d'une catégorie.
 * @param {ObjectId} productId - ID du produit à supprimer.
 */
categorySchema.methods.removeProduct = async function (productId) {
  this.products = this.products.filter((id) => id.toString() !== productId.toString());
  await this.updateStats();
};

/**
 * Récupérer toutes les sous-catégories.
 */
categorySchema.methods.getSubCategories = async function () {
  return mongoose.model('Category').find({ parentCategory: this._id });
};

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
