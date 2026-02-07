const multer = require("multer");
const path = require("path");
const fs = require("fs");
const Update = require("../models/UpdateModels/Update");
const Channel = require("../models/UpdateModels/Channel");
const apkFolderPath = "public/apk/";

// Ensure the upload folder exists
if (!fs.existsSync(apkFolderPath)) {
  fs.mkdirSync(apkFolderPath, { recursive: true });
}

// Define the allowed MIME type for APK files
// const allowedMimeType = "application/vnd.android.package-archive";

const extractChannelName = (req, res, next) => {
  multer().none()(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: "Error parsing form data" });
    }
    next();
  });
};

const generateStorage = () => {
  const folderPaths = {
    zip: "public/uploads/zips/",
    json: "public/uploads/configs/",
  };
  const allowedExtensions = {
    zip: "application/zip",
    json: "application/json",
  };

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      // Extract the channelName from the request object

      
      const channelName = req.body.channelName || "default"; // Use a default if undefined

      // Determine the folder based on the file extension
      const ext = file.originalname.split(".").pop().toLowerCase();
      const folderBase = folderPaths[ext] || "public/uploads/others"; // Fallback directory for other file types
      const folderPath = `${folderBase}${channelName}`;

      // Create the directory if it doesn't exist
      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      cb(null, folderPath);
    },
    filename: async (req, file, cb) => {
      // Retain the original filename
      const ext = file.originalname.split(".").pop().toLowerCase();
      const isValidExt = allowedExtensions.hasOwnProperty(ext);
      
        let channel = await Channel.findOne({ name: req.body.channelName });
        if (!channel) {
          channel = new Channel({ name: req.body.channelName });
          await channel.save();
        }
        // Check if the version number already exists in the database
        const existingVersionUpdate = await Update.findOne({
          versionNumber: req.body.versionNumber,
          channelId: channel._id,
        });
        if (existingVersionUpdate) {
          return cb(
            new Error(
              `"Version number already exists."${existingVersionUpdate}`
            ),
            false
          );
        }
    
        // Check if the build number already exists in the database
        const existingBuildUpdate = await Update.findOne({
          buildNumber: req.body.buildNumber,
          channelId: channel._id,
        });
    
        if (existingBuildUpdate) {

          return cb(
            new Error(
              `Build number already exists.${existingBuildUpdate}`
            ),
            false
          );
          
        }
    






      if (!isValidExt) {
        return cb(
          new Error(
            `Invalid file type. Only .zip and .json files are allowed.`
          ),
          false
        );
      }
      const channelName = req.body.channelName || "default";
      const folderBase = folderPaths[ext] || "public/uploads/others";
      const folderPath = `${folderBase}${channelName}`;
      const filename = file.originalname; // Use the original filename directly
      const filePath = path.join(folderPath, filename);
      // Check if the file already exists
      if (fs.existsSync(filePath)) {
        return cb(
          new Error(
            `File with the name "${filename}" already exists in the "${channelName}" channel.`
          ),
          false
        );
      }
      cb(null, filename);
    },
  });

  const fileFilter = (req, file, cb) => {
    // Check if the file extension is supported
    const ext = file.originalname.split(".").pop().toLowerCase();
    if (allowedExtensions[ext]) {
      cb(null, true);
    } else {
      cb(new Error("Unsupported file type"), false);
    }
  };

  return multer({ storage: storage, fileFilter: fileFilter });
};




const generateApkStorage = () => {
  // Define the storage settings
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, apkFolderPath);
    },
    filename: (req, file, cb) => {
      const filename = file.originalname;

      // Check if the file already exists
      if (fs.existsSync(path.join(apkFolderPath, filename))) {
        return cb(
          new Error(`File with the name "${filename}" already exists.`),
          false
        );
      }

      cb(null, filename);
    },
  });

  return multer({ storage: storage });
};

module.exports = { generateStorage, extractChannelName, generateApkStorage };
