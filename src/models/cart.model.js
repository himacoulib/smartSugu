const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const cartSchema = mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    items: [
      {
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true, min: 1 },
        priceAtAddition: { type: Number }, // Prix au moment de l'ajout pour éviter les fluctuations de prix
      },
    ],
    totalPrice: {
      type: Number,
      default: 0, // Calculé dynamiquement
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Ajouter les plugins
cartSchema.plugin(toJSON);
cartSchema.plugin(paginate);

/**
 * Calculer le prix total du panier
 * @returns {Number}
 */
cartSchema.methods.calculateTotalPrice = async function () {
  const total = this.items.reduce((acc, item) => acc + item.priceAtAddition * item.quantity, 0);
  this.totalPrice = total;
  this.lastUpdated = Date.now();
  await this.save();
  return this.totalPrice;
};

/**
 * Ajouter un produit au panier
 * @param {ObjectId} productId - L'ID du produit
 * @param {Number} quantity - Quantité à ajouter
 */
cartSchema.methods.addItem = async function (productId, quantity) {
  const Product = mongoose.model('Product');
  const product = await Product.findById(productId);
  if (!product) {
    throw new Error('Product not found');
  }

  const existingItem = this.items.find((item) => item.product.toString() === productId.toString());
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    this.items.push({ product: productId, quantity, priceAtAddition: product.price });
  }
  await this.calculateTotalPrice();
};

/**
 * Mettre à jour la quantité d'un produit dans le panier
 * @param {ObjectId} productId - L'ID du produit
 * @param {Number} quantity - Nouvelle quantité
 */
cartSchema.methods.updateItemQuantity = async function (productId, quantity) {
  const item = this.items.find((item) => item.product.toString() === productId.toString());
  if (!item) {
    throw new Error('Item not found in cart');
  }
  if (quantity <= 0) {
    this.items = this.items.filter((item) => item.product.toString() !== productId.toString());
  } else {
    item.quantity = quantity;
  }
  await this.calculateTotalPrice();
};

/**
 * Retirer un produit du panier
 * @param {ObjectId} productId - L'ID du produit
 */
cartSchema.methods.removeItem = async function (productId) {
  this.items = this.items.filter((item) => item.product.toString() !== productId.toString());
  await this.calculateTotalPrice();
};

/**
 * Vider le panier
 */
cartSchema.methods.clearCart = async function () {
  this.items = [];
  this.totalPrice = 0;
  this.lastUpdated = Date.now();
  await this.save();
};

/**
 * Vérifier si le panier contient un produit spécifique
 * @param {ObjectId} productId - L'ID du produit
 * @returns {Boolean}
 */
cartSchema.methods.containsProduct = function (productId) {
  return this.items.some((item) => item.product.toString() === productId.toString());
};

/**
 * Obtenir le nombre total d'articles dans le panier
 * @returns {Number}
 */
cartSchema.methods.getTotalItems = function () {
  return this.items.reduce((acc, item) => acc + item.quantity, 0);
};

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
