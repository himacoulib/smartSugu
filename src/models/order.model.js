const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const orderSchema = mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: true,
    },
    merchant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Merchant',
      required: true,
    },
    products: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
      },
    ],
    promotion: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Promotion',
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    delivery: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Delivery',
    },
    payment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Payment',
    },
    notes: {
      type: String, // Instructions spéciales pour la commande
    },
    revenue: {
      type: Number, // Montant généré pour le commerçant
    },
    // Champ ajouté pour suivre le statut de livraison
    deliveryStatus: {
      type: String,
      enum: ['not_started', 'in_progress', 'delivered', 'cancelled'],
      default: 'not_started',
    },
  },
  {
    timestamps: true,
  }
);

// Ajouter les plugins
orderSchema.plugin(toJSON);
orderSchema.plugin(paginate);

// Méthode : Calculer le total de la commande
orderSchema.methods.calculateTotalPrice = function () {
  const total = this.products.reduce((acc, product) => acc + product.quantity * product.price, 0);
  this.totalPrice = total;
  return total;
};

// Middleware : Calcul automatique des revenus avant la sauvegarde
orderSchema.pre('save', async function (next) {
  this.revenue = this.products.reduce((acc, product) => acc + product.quantity * product.price, 0);
  next();
});

// Méthode : Vérifier les stocks pour les produits
orderSchema.methods.validateStock = async function () {
  const Product = mongoose.model('Product');
  // eslint-disable-next-line no-restricted-syntax
  for (const item of this.products) {
    // eslint-disable-next-line no-await-in-loop
    const product = await Product.findById(item.productId);
    if (!product || product.stock < item.quantity) {
      throw new Error(`Product ${item.productId} does not have enough stock`);
    }
  }
};

// Méthode : Mettre à jour le statut de la commande
orderSchema.methods.updateStatus = async function (newStatus) {
  if (!['pending', 'accepted', 'in_progress', 'completed', 'cancelled'].includes(newStatus)) {
    throw new Error('Invalid order status');
  }
  this.status = newStatus;
  await this.save();
};

// Méthode : Générer un reçu
orderSchema.methods.generateReceipt = function () {
  return {
    orderId: this._id,
    client: this.client,
    merchant: this.merchant,
    products: this.products,
    totalPrice: this.totalPrice,
    revenue: this.revenue,
    status: this.status,
  };
};

// Ajouter un index pour optimiser les recherches fréquentes
orderSchema.index({ client: 1, status: 1 });
orderSchema.index({ merchant: 1, status: 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
