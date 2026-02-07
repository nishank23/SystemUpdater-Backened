const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  lastTokenIssuedAt: { type: Date, default: Date.now },
  tokenVersion: { type: Number, default: 0 }, // Add this field

  // Other fields as required
});

const User = mongoose.model('User', userSchema);
module.exports = User;
