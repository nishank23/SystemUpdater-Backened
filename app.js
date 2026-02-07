const express = require("express");
const path = require("path");
const fs = require("fs");
var bodyParser = require("body-parser");

const setBaseUrlMiddleware = require("./src/helpers/middleware");
const updateRouter = require("./src/routes/updaterouter");

const app = express();

app.set("view engine", "ejs");

// Set the views directory (folder where EJS templates are located)
app.set("views", path.resolve("./views"));
console.log("mypath" + path.join(__dirname, "views"));

app.use(express.json());
app.use(setBaseUrlMiddleware);
app.use(bodyParser.json());

/*app.use('/public/uploads/product', express.static('public/uploads/product'));*/
app.use(
  "/public",
  express.static("public", {
    setHeaders: function (res, path) {
      if (path.endsWith(".zip")) {
        res.set("Content-Type", "application/zip");
      }
    },
  })
);
//app.use("/public/", express.static("public/"));

app.use(express.static("public"));
app.use(bodyParser.json({ limit: "2048mb" }));
app.use(bodyParser.urlencoded({ limit: "2048mb", extended: true }));

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  next();
});
app.use("/api/v1", updateRouter);

module.exports = app;
