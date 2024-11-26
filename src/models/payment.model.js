const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const paymentSchema = mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      validate(value) {
        if (value <= 0) throw new Error('Amount must be greater than zero');
      },
    },
    fees: {
      type: Number,
      default: 0,
      validate(value) {
        if (value < 0) throw new Error('Fees cannot be negative');
      },
    },
    method: {
      type: String,
      enum: ['credit_card', 'paypal', 'cash'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    transactionId: {
      type: String,
      unique: true,
      sparse: true, // Autorise des valeurs nulles tout en gardant l'unicité
    },
    type: {
      type: String,
      enum: ['payment', 'refund', 'fee'],
      required: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      validate(value) {
        if (typeof value !== 'object') throw new Error('Metadata must be an object');
      },
    },
    history: [
      {
        status: { type: String },
        updatedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Ajouter les plugins
paymentSchema.plugin(toJSON);
paymentSchema.plugin(paginate);

// Index pour optimiser les recherches
paymentSchema.index({ status: 1, createdAt: -1 });
paymentSchema.index({ method: 1, createdAt: -1 });
paymentSchema.index({ order: 1 });

// Méthode : Mettre à jour le statut du paiement
paymentSchema.methods.updateStatus = async function (newStatus) {
  if (!['pending', 'completed', 'failed'].includes(newStatus)) {
    throw new Error('Invalid payment status');
  }
  this.history.push({ status: this.status }); // Sauvegarde du statut actuel
  this.status = newStatus;
  await this.save();
};

// Méthode : Calculer les revenus nets
paymentSchema.methods.calculateNetRevenue = function () {
  return this.amount - this.fees;
};

// Méthode : Calculer le pourcentage des frais
paymentSchema.methods.calculateFeesPercentage = function () {
  if (this.amount === 0) return 0;
  return ((this.fees / this.amount) * 100).toFixed(2);
};

// Méthode statique : Récupérer les paiements par statut
paymentSchema.statics.getByStatus = async function (status) {
  if (!['pending', 'completed', 'failed'].includes(status)) {
    throw new Error('Invalid status');
  }
  return this.find({ status }).sort({ createdAt: -1 });
};

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
