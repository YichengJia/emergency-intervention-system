const mongoose = require('mongoose');

const privacyConsentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    consentType: {
      type: String,
      required: true
    },
    accepted: {
      type: Boolean,
      default: false
    },
    acceptedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('PrivacyConsent', privacyConsentSchema);