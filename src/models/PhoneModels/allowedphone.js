const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const allowedEmailSchema = new Schema({
  email: { type: String, required: true, unique: true, length: 10 },
});

const AllowedEmail = mongoose.model("Email", allowedEmailSchema);
module.exports = AllowedEmail;
