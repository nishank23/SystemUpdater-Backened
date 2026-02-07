const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const otpVerificationSchema = new Schema({
  email: { type: String, required: true, length: 10 },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  used: { default: false, type: Boolean },
});

const OtpVerification = mongoose.model(
  "OtpVerification",
  otpVerificationSchema
);
module.exports = OtpVerification;
