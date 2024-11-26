const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const inventorySchema = mongoose.Schema(
  {
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
    quantity: {
      type: Number,
      required: true,
      default: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 5, // Déclenche une alerte si le stock est inférieur
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
inventorySchema.plugin(toJSON);
inventorySchema.plugin(paginate);

/**
 * Méthode : Mettre à jour la quantité en stock
 * @param {Number} delta - Quantité à ajouter ou à retirer
 */
inventorySchema.methods.updateQuantity = async function (delta) {
  this.quantity += delta;
  if (this.quantity < 0) throw new Error('Insufficient stock');
  this.lastUpdated = Date.now();
  await this.save();
};

/**
 * Vérifier si le stock est faible
 * @returns {Boolean}
 */
inventorySchema.methods.isLowStock = function () {
  return this.quantity < this.lowStockThreshold;
};

/**
 * Obtenir tous les produits avec un stock faible pour un commerçant
 * @param {ObjectId} merchantId - ID du commerçant
 * @returns {Promise<Array>}
 */
inventorySchema.statics.getLowStockProducts = async function (merchantId) {
  return this.find({ merchant: merchantId, quantity: { $lt: mongoose.Types.Decimal128(this.lowStockThreshold) } });
};

const Inventory = mongoose.model('Inventory', inventorySchema);

module.exports = Inventory;
