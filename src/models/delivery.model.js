const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const deliverySchema = mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    livreur: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Livreur',
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'delivered', 'cancelled'],
      default: 'pending',
    },
    distance: {
      type: Number, // Distance en kilomètres
    },
    deliveryTime: {
      type: Date, // Temps estimé de livraison
    },
    payment: {
      type: Number, // Paiement pour la livraison
    }, // Nouveaux champs ajoutés pour l'historique des statuts
    statusHistory: [
      {
        status: { type: String, enum: ['pending', 'in_progress', 'delivered', 'cancelled'] },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
    // Champ pour stocker la distance calculée
    distanceCalculated: {
      type: Number,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Ajouter les plugins
deliverySchema.plugin(toJSON);
deliverySchema.plugin(paginate);

// Méthode : Mettre à jour le statut de la livraison avec historique
deliverySchema.methods.updateStatus = async function (newStatus) {
  if (!['pending', 'in_progress', 'delivered', 'cancelled'].includes(newStatus)) {
    throw new Error('Invalid delivery status');
  }
  this.status = newStatus;
  this.statusHistory.push({ status: newStatus });
  await this.save();
};

// Méthode : Calculer la distance de livraison
deliverySchema.methods.calculateDistance = function (startCoords, endCoords) {
  const toRad = (value) => (value * Math.PI) / 180;
  const R = 6371; // Rayon de la Terre en km
  const dLat = toRad(endCoords.latitude - startCoords.latitude);
  const dLon = toRad(endCoords.longitude - startCoords.longitude);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(startCoords.latitude)) * Math.cos(toRad(endCoords.latitude)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance en km
};

const Delivery = mongoose.model('Delivery', deliverySchema);

module.exports = Delivery;
