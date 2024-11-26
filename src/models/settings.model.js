const mongoose = require('mongoose');
const { toJSON } = require('./plugins');

const settingsSchema = mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed, // Peut contenir n'importe quel type
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Ajouter le plugin
settingsSchema.plugin(toJSON);

const Settings = mongoose.model('Settings', settingsSchema);

module.exports = Settings;
