const { generateApkStorage } = require("../helpers/multerhelper");
const fs = require("fs");
const path = require("path");
const ApkModel = require("../models/apk"); // Assuming you have the model

// Upload APK
const uploadApk = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // Save the file information to the database
    const newFile = new ApkModel({
      filename: req.file.filename,
      path: req.file.path,
      mimetype: req.file.mimetype,
    });

    await newFile.save();
    return res.status(200).json({
      message: "File uploaded successfully",
      file: newFile,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ message: "Error saving file info", error: error });
  }
};

// Get All APKs
const getAllApks = async (req, res) => {
  try {
    const files = await ApkModel.find();
    if (!files) {
      return res.status(404).json({ message: "No files are on the server" });
    }
    return res.status(200).json({ files });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error retrieving files" });
  }
};

// Delete APK
const deleteApk = async (req, res) => {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(404).json({ message: "Id not found" });
    }

    const apkDelete = await ApkModel.findById(id);
    if (!apkDelete) {
      return res.status(404).json({ message: "File not found" });
    }

    await ApkModel.deleteOne({ _id: apkDelete });

    const deleteFile = (filePath) => {
      if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    };

    deleteFile(apkDelete.path);

    res.status(200).json({ message: "File Deleted Successfully" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error deleting file" });
  }
};

module.exports = { uploadApk, getAllApks, deleteApk };
