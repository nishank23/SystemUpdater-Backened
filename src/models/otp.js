const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const otpSchema = new Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  used: { type: Boolean, default: false }

});

const OTP = mongoose.model('OTP', otpSchema);

module.exports = OTP;
