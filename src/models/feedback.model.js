const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const feedbackSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product', // Ajout de la référence au produit (si applicable)
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    message: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'], // Ajout des priorités
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'resolved'], // Gestion des statuts
      default: 'pending',
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Ajouter les plugins
feedbackSchema.plugin(toJSON);
feedbackSchema.plugin(paginate);

/**
 * Analyser les retours pour une tendance (e.g., moyenne des notes)
 * @returns {Promise<Object>}
 */
feedbackSchema.statics.analyzeFeedback = async function () {
  const feedbacks = await this.find({});
  const averageRating = feedbacks.reduce((acc, feedback) => acc + feedback.rating, 0) / feedbacks.length;
  return { averageRating, totalFeedbacks: feedbacks.length };
};

// Index pour optimiser les recherches
feedbackSchema.index({ rating: 1, priority: 1, status: 1 });

/**
 * Marquer un feedback comme résolu
 * @param {String} resolution - Description de la résolution (optionnel)
 */
feedbackSchema.methods.markAsResolved = async function (resolution = '') {
  this.status = 'resolved';
  if (resolution) {
    this.description += `\n[Résolution]: ${resolution}`;
  }
  await this.save();
};

/**
 * Récupérer les feedbacks par priorité
 * @param {String} priority - Niveau de priorité ('low', 'medium', 'high')
 * @returns {Promise<Array>}
 */
feedbackSchema.statics.getByPriority = async function (priority) {
  return this.find({ priority }).sort({ createdAt: -1 });
};

/**
 * Récupérer les feedbacks par statut
 * @param {String} status - Statut du feedback ('pending', 'in_progress', 'resolved')
 * @returns {Promise<Array>}
 */
feedbackSchema.statics.getByStatus = async function (status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

const Feedback = mongoose.model('Feedback', feedbackSchema);

module.exports = Feedback;
