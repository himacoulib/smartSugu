const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const livreurSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    location: {
      latitude: {
        type: Number,
        required: true,
        validate(value) {
          if (value < -90 || value > 90) {
            throw new Error('Latitude must be between -90 and 90');
          }
        },
      },
      longitude: {
        type: Number,
        required: true,
        validate(value) {
          if (value < -180 || value > 180) {
            throw new Error('Longitude must be between -180 and 180');
          }
        },
      },
    },
    isAvailable: { type: Boolean, default: true },
    deliveries: [
      {
        deliveryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Delivery' },
        status: { type: String, enum: ['pending', 'in_progress', 'completed', 'cancelled'], default: 'pending' },
      },
    ],
    totalEarnings: { type: Number, default: 0 },
    ratingsGiven: [
      {
        clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
        rating: { type: Number, required: true, min: 1, max: 5 },
        comment: { type: String },
      },
    ],
    deliveriesAssigned: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Delivery',
      },
    ],
    performance: {
      deliveriesCompleted: { type: Number, default: 0 },
      averageDeliveryTime: { type: Number, default: 0 }, // Temps moyen en minutes
    },
  },
  {
    timestamps: true,
  }
);

// Ajouter les plugins
livreurSchema.plugin(toJSON);
livreurSchema.plugin(paginate);

// Méthode : Mettre à jour le statut d'une livraison
livreurSchema.methods.updateDeliveryStatus = async function (deliveryId, newStatus) {
  const delivery = this.deliveries.find((d) => d.deliveryId.toString() === deliveryId.toString());
  if (!delivery) throw new Error('Delivery not found');
  delivery.status = newStatus;
  await this.save();
};

// Méthode : Calculer les gains totaux
livreurSchema.methods.calculateTotalEarnings = async function () {
  const completedDeliveries = this.deliveries.filter((d) => d.status === 'completed');
  const total = completedDeliveries.reduce((acc, delivery) => acc + delivery.paymentAmount, 0);
  this.totalEarnings = total;
  await this.save();
  return total;
};

// Méthode : Évaluer un client
livreurSchema.methods.rateClient = async function (clientId, rating, comment) {
  this.ratingsGiven.push({ clientId, rating, comment });
  await this.save();
};

// Méthode : Obtenir l'historique des livraisons
livreurSchema.methods.getDeliveryHistory = function () {
  return this.deliveries.filter((d) => ['completed', 'cancelled'].includes(d.status));
};

// Méthode : Mettre à jour la disponibilité
livreurSchema.methods.setAvailability = async function (availability) {
  this.isAvailable = availability;
  await this.save();
};

// Méthode : Mettre à jour la localisation
livreurSchema.methods.updateLocation = async function (coordinates) {
  this.location.latitude = coordinates.latitude;
  this.location.longitude = coordinates.longitude;
  await this.save();
};

/**
 * Méthode : Ajouter une livraison assignée.
 */
livreurSchema.methods.addDelivery = async function (deliveryId) {
  this.deliveriesAssigned.push(deliveryId);
  await this.save();
};

/**
 * Méthode : Mettre à jour les performances.
 */
livreurSchema.methods.updatePerformance = async function (timeTaken) {
  this.performance.deliveriesCompleted += 1;
  const totalCompleted = this.performance.deliveriesCompleted;
  const currentAverage = this.performance.averageDeliveryTime;
  this.performance.averageDeliveryTime = (currentAverage * (totalCompleted - 1) + timeTaken) / totalCompleted;
  await this.save();
};

const Livreur = mongoose.model('Livreur', livreurSchema);

module.exports = Livreur;
