const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

//const uri = `mongodb+srv://myadmin:admin@studentcluster.nxhqg6z.mongodb.net/?retryWrites=true&w=majority`;

const uri =
  "mongodb://localhost:27017,localhost:27018,localhost:27019/?replicaSet=rs0";

function connectDB() {
  return mongoose.connect(uri);
}

module.exports = connectDB;
