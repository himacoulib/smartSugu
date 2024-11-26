const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const clientSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    addresses: [
      {
        id: { type: mongoose.Schema.Types.ObjectId, default: new mongoose.Types.ObjectId() },
        address: { type: String, trim: true },
        coordinates: {
          latitude: { type: Number },
          longitude: { type: Number },
        },
      },
    ],
    orders: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Order' }],
    cart: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cart',
    },
    refunds: [
      {
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
        reason: { type: String },
        status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
        date: { type: Date, default: Date.now },
      },
    ],
    ratings: [
      {
        orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String },
      },
    ],
    feedback: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Feedback',
      },
    ],
    notifications: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Notification',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Ajouter les plugins
clientSchema.plugin(toJSON);
clientSchema.plugin(paginate);

// Méthode : Annuler une commande
clientSchema.methods.cancelOrder = async function (orderId) {
  const orderIndex = this.orders.findIndex((order) => order.toString() === orderId.toString());
  if (orderIndex !== -1) {
    this.orders.splice(orderIndex, 1);
    await this.save();
  } else {
    throw new Error('Order not found');
  }
};

// Méthode : Demander un remboursement
clientSchema.methods.requestRefund = async function (orderId, reason) {
  this.refunds.push({ orderId, reason });
  await this.save();
};

// Méthode : Obtenir l’historique des évaluations
clientSchema.methods.getRatings = function () {
  return this.ratings;
};

// Méthode : Ajouter une évaluation
clientSchema.methods.addRating = async function (orderId, rating, comment = '') {
  this.ratings.push({ orderId, rating, comment });
  await this.save();
};

// Méthode : Ajouter une adresse
clientSchema.methods.addAddress = async function (newAddress) {
  this.addresses.push(newAddress);
  await this.save();
};

// Méthode : Mettre à jour une adresse
clientSchema.methods.updateAddress = async function (addressId, updatedAddress) {
  const addressIndex = this.addresses.findIndex((addr) => addr.id.toString() === addressId.toString());
  if (addressIndex === -1) {
    throw new Error('Address not found');
  }
  this.addresses[addressIndex] = { ...this.addresses[addressIndex], ...updatedAddress };
  await this.save();
};

// Méthode : Supprimer une adresse
clientSchema.methods.deleteAddress = async function (addressId) {
  this.addresses = this.addresses.filter((addr) => addr.id.toString() !== addressId.toString());
  await this.save();
};

// Méthode : Obtenir l’historique des commandes
clientSchema.methods.getOrderHistory = async function () {
  return this.orders;
};

// Méthode : Vérifier si un remboursement est déjà demandé pour une commande
clientSchema.methods.hasRequestedRefund = function (orderId) {
  return this.refunds.some((refund) => refund.orderId.toString() === orderId.toString());
};

const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
