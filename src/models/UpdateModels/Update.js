const mongoose = require("mongoose");

const updateSchema = new mongoose.Schema({
  versionNumber: {
    type: String,
    required: true,

  },
  buildNumber: {
    type: String,
    required: true,
  },
  timestamp: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },
  updateFile: {
    type: String, // Assuming you're storing file paths here
    required: true,
  },
  configFile: {
    type: String, // Assuming you're storing file paths here
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Channel",
    required: true,
  },
});

const Update = mongoose.model("Update", updateSchema);

module.exports = Update;
