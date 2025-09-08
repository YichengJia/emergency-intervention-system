const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    specialty: {
      type: String,
      required: true
    },
    licenseNumber: {
      type: String,
      required: true,
      unique: true
    },
    phone: {
      type: String
    },
    email: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Doctor', doctorSchema);