const mongoose = require("mongoose");

const ApkSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true,
  },
  path: {
    type: String,
    required: true,
  },
  mimetype: {
    type: String,
    required: true,
  },
  uploadDate: {
    type: Date,
    default: Date.now,
  },
});

const ApkModel = mongoose.model("Apk", ApkSchema);

module.exports = ApkModel;
