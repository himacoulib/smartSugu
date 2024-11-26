const mongoose = require('mongoose');
const { toJSON, paginate } = require('./plugins');

const analyticsSchema = mongoose.Schema(
  {
    event: {
      type: String,
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, // Contient des données dynamiques
    },
  },
  {
    timestamps: true,
  }
);

// Ajouter les plugins
analyticsSchema.plugin(toJSON);
analyticsSchema.plugin(paginate);

const Analytics = mongoose.model('Analytics', analyticsSchema);

module.exports = Analytics;
