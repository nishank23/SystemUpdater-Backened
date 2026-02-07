const express = require("express");
const router = express.Router();
const updateController = require("../controllers/updateController");
const authController = require("../controllers/authController");
const apkController = require("../controllers/apkController");

const {
  generateStorage,
  extractChannelName,
  generateApkStorage,
} = require("../helpers/multerhelper");
const { authenticateToken } = require("../helpers/jwt");
const verifyStableChannelOtp = require("../helpers/verifyPhOtp");
const upload = generateStorage("updateFiles");
const apkUpload = generateApkStorage().single("apkFile");
// Create or Update Client
//router.post('/clients/:clientId?', authenticateToken,upload.single('file'), clientController.createOrUpdateClient);

//router

router.post("/apk", authenticateToken, apkUpload, apkController.uploadApk);
router.get("/apk", apkController.getAllApks);
router.delete("/apk", authenticateToken, apkController.deleteApk);

router.post(
  "/update/",
  authenticateToken,
  verifyStableChannelOtp,
  upload.fields([
    { name: "otaZip", maxCount: 1 },
    { name: "configFile", maxCount: 1 },
  ]),

  updateController.createUpdate
);

router.post("/getotp", authController.getOtp);
router.post("/getsmsotp", authController.sendPhOtp);
router.post("/verifyotp", authController.verifyOtp);

router.post(
  "/allowed-emails",
  authenticateToken,
  authController.addAllowedPhones
);
router.get(
  "/allowed-emails",
  authenticateToken,
  authController.getAllowedPhoneNumbers
);
// Delete allowed phone numbers
router.delete(
  "/allowed-emails",
  authenticateToken,
  authController.deleteAllowedPhones
);

router.get("/update", updateController.getLatestUpdate);
router.delete("/update", verifyStableChannelOtp, updateController.deleteUpdate);
router.get("/updates/allchannel", updateController.getAllChannelsWithUpdates);
router.post(
  "/updates/channel",
  authenticateToken,
  updateController.addSerialNumbersToChannel
);
router.post(
  "/updates/copychannel",
  verifyStableChannelOtp,
  updateController.copyUpdateChannel
);
router.post(
  "/updates/changechannel",
  verifyStableChannelOtp,
  authenticateToken,
  updateController.changeUpdateChannel
);
router.delete(
  "/updates/channel",
  authenticateToken,
  updateController.deleteChannel
);
router.post("/updates/deviceinfo", updateController.postDeviceInfo);
router.get("/updates/deviceinfo", updateController.deviceInfo);
// Route to delete specific serial numbers from an update
router.delete(
  "/updates/serial",
  authenticateToken,
  updateController.deleteSerialNumbersFromChannel
);

// New endpoint for download
module.exports = router;
