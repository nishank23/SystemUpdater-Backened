const app = require("./app");
const connectDB = require("./src/config/database");
const port = process.env.PORT || 3000;
const fs = require("fs");
const mongoose = require("mongoose");
const path = require("path");
var admin = require("firebase-admin");
const monitorUpdates = require("./src/helpers/updateWatcher");

var serviceAccount = require("./src/helpers/serviceAccountKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
connectDB()
  .then(() => console.log("Database connected successfully"))
  .catch((err) => console.error(err));

app.get("/", (req, res) => {});

const db = mongoose.connection;
db.once("open", () => {
  console.log("Connected to MongoDB");

  // Start monitoring updates
  monitorUpdates();
});

app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});
