const Update = require("../models/UpdateModels/Update");
const Channel = require("../models/UpdateModels/Channel");
const DeviceInfo = require("../models/UpdateModels/DeviceInfo");
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const postDeviceInfo = async (req, res) => {
  try {
    const {
      serialNumber,
      appVersion,
      osVersion,
      model,
      imei,
      currentDateTimeGMT,
      updateGroup,
      newWonderOSVersion,
    } = req.body;
    console.log(req.body);
    let deviceInfo = new DeviceInfo({
      appVersion,
      osVersion,
      imei,
      serialNumber,
      model,
      currentDateTimeGMT,
      updateGroup,
      newWonderOSVersion,
    });

    await deviceInfo.save();

    res.status(201).json({ message: "Device information saved successfully." });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to save device information.", error });
  }
};
const deviceInfo = async (req, res) => {
  try {
    const devices = await DeviceInfo.aggregate([
      {
        $group: {
          _id: "$serialNumber",
          updates: {
            $push: {
              appVersion: "$appVersion",
              osVersion: "$osVersion",
              model: "$model",
              imei: "$imei",
              currentDateTimeGMT: "$currentDateTimeGMT",
              updateGroup: "$updateGroup",
              newWonderOSVersion: "$newWonderOSVersion",
            },
          },
        },
      },
    ]);
    const formattedDevices = devices.map((device) => {
      return {
        serialNumber: device._id,
        updates: device.updates,
      };
    });

    res.status(200).json(formattedDevices);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to retrieve device information.", error });
  }
};
const getLatestUpdate = async (req, res) => {
  try {
    const { buildNumber, serialNumber } = req.query;
    if (req.query.isEmpty) {
      const stableChannel = await Channel.findOne({ name: "stable" });

      const latestUpdate = await Update.findOne({
        channelId: stableChannel._id,
      })
        .sort({ createdAt: -1 })
        .limit(1);

      if (!latestUpdate) {
        return res.status(404).json({ message: "No updates found." });
      }

      // Get the file size
      const fileStats = await fs.promises.stat(latestUpdate.updateFile);
      const fileSize = fileStats.size;
      const fileSizeInMB = (fileSize / (1024 * 1024)).toFixed(2); // Convert bytes to MB and format to 2 decimal places

      return res.status(200).json({
        message: "Latest update retrieved successfully.",
        latestUpdate: {
          ...latestUpdate._doc,
          fileSize: fileSizeInMB,
          channelName: "stable",
        },
      });
    }

    let currentTimestamp = "";

    if (buildNumber) {
      const parts = buildNumber.split("_");
      if (parts.length > 1) {
        currentTimestamp = parts.slice(-2).join("_"); // Get the last two parts as timestamp
      }
    }
    console.log(currentTimestamp);
    console.log(req.query);

    // Check for the channel associated with the serial number
    const channel = await Channel.findOne({ serialNumbers: serialNumber });

    let update;
    let channelName = {};

    if (channel) {
      // Find the latest update for the channel
      update = await Update.findOne({ channelId: channel._id })
        .sort({ createdAt: -1 })
        .limit(1);

      channelName = channel.name;
    } else {
      // If no channel found, treat it as stable channel
      const stableChannel = await Channel.findOne({ name: "stable" });

      if (!stableChannel) {
        return res.status(404).json({ message: "Stable channel not found." });
      }

      // Find the latest update for the stable channel
      update = await Update.findOne({ channelId: stableChannel._id })
        .sort({ createdAt: -1 })
        .limit(1);
      channelName = stableChannel.name;
    }

    if (!update) {
      return res.status(404).json({ message: "No updates found." });
    }

    if (update.timestamp <= currentTimestamp) {
      return res.status(404).json({ message: "No new updates available." });
    }

    const fileStats = await fs.promises.stat(update.updateFile);
    const fileSize = fileStats.size;
    const fileSizeInMB = (fileSize / (1024 * 1024)).toFixed(2);

    res.status(200).json({
      message: `Latest update available for ${
        channel ? channel.name : "stable"
      } channel.`,
      latestUpdate: {
        ...update._doc,
        fileSize: fileSizeInMB,
        channelName: channelName,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to check for update.", error });
  }
};
const addSerialNumbersToChannel = async (req, res) => {
  try {
    const { channelName, serialNumbers = [] } = req.body;

    if (!Array.isArray(serialNumbers) || serialNumbers.length === 0) {
      return res
        .status(400)
        .json({ message: "serialNumbers should be a non-empty array." });
    }

    // Check for invalid serial numbers (e.g., containing commas)
    const invalidSerialNumbers = serialNumbers.filter((sn) => sn.includes(","));
    if (invalidSerialNumbers.length > 0) {
      return res.status(400).json({
        message: `The following serial numbers are invalid: ${invalidSerialNumbers.join(
          ", "
        )}`,
      });
    }

    // Check if the channel is stable
    if (channelName === "stable") {
      return res
        .status(400)
        .json({ message: "Stable channel cannot have serial numbers." });
    }

    // Find all channels to check for existing serial numbers
    const allChannels = await Channel.find();
    const existingSerialNumbers = allChannels.flatMap((ch) => ch.serialNumbers);

    // Check for duplicate serial numbers
    const duplicateSerialNumbers = serialNumbers.filter((sn) =>
      existingSerialNumbers.includes(sn)
    );
    if (duplicateSerialNumbers.length > 0) {
      return res.status(400).json({
        message: `The following serial numbers are already assigned to another channel: ${duplicateSerialNumbers.join(
          ", "
        )}`,
      });
    }

    // Find or create the channel
    let channel = await Channel.findOne({ name: channelName });
    if (!channel) {
      channel = new Channel({ name: channelName, serialNumbers });
    } else {
      channel.serialNumbers.push(...serialNumbers);
    }

    await channel.save();

    res.status(200).json({
      message: "Serial numbers added successfully.",
      channel,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to add serial numbers.", error });
  }
};
const getAllChannelsWithUpdates = async (req, res) => {
  try {
    const channels = await Channel.find().lean();

    const channelUpdates = await Promise.all(
      channels.map(async (channel) => {
        const updates = await Update.find({ channelId: channel._id })
          .sort({ createdAt: -1 })
          .lean();
        return {
          ...channel,
          updates,
        };
      })
    );

    res.status(200).json(channelUpdates);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Failed to retrieve channels and updates.", error });
  }
};
const deleteSerialNumbersFromChannel = async (req, res) => {
  try {
    const { channelName, serialNumbers = [] } = req.body;

    if (!Array.isArray(serialNumbers) || serialNumbers.length === 0) {
      return res
        .status(400)
        .json({ message: "serialNumbers should be a non-empty array." });
    }

    let channel = await Channel.findOne({ name: channelName });
    if (!channel) {
      return res.status(404).json({ message: "Channel not found." });
    }

    const currentSerialNumbers = channel.serialNumbers.map(String);
    const serialNumbersToDelete = serialNumbers.map(String);
    const notFoundSerialNumbers = serialNumbersToDelete.filter(
      (sn) => !currentSerialNumbers.includes(sn)
    );
    if (notFoundSerialNumbers.length > 0) {
      return res.status(400).json({
        message: `The following serial numbers are not available for deletion: ${notFoundSerialNumbers.join(
          ", "
        )}`,
      });
    }

    channel.serialNumbers = currentSerialNumbers.filter(
      (sn) => !serialNumbersToDelete.includes(sn)
    );

    await channel.save();

    res.status(200).json({
      message: "Serial numbers deleted successfully.",
      channel,
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Failed to delete serial numbers.", error });
  }
};
const createUpdate = async (req, res) => {
  try {
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
      return res.status(400).json({
        message: "Version number already exists in the specified channel.",
        data: existingVersionUpdate,
      });
    }

    // Check if the build number already exists in the database
    const existingBuildUpdate = await Update.findOne({
      buildNumber: req.body.buildNumber,
    });

    if (existingBuildUpdate) {
      return res.status(400).json({
        message: "Build number already exists.",
        data: existingBuildUpdate,
      });
    }

    console.log(req.body);
    const updateFile = req.files["otaZip"] ? req.files["otaZip"][0] : null;
    const configFile = req.files["configFile"]
      ? req.files["configFile"][0]
      : null;

    let buildNumber = req.body.buildNumber || "";
    let timestamp = "";

    if (buildNumber) {
      const parts = buildNumber.split("_");
      if (parts.length > 1) {
        timestamp = parts.slice(-2).join("_"); // Get the last two parts as timestamp
      }
    }
    let update = new Update({
      versionNumber: req.body.versionNumber,
      description: req.body.description,
      updateFile: updateFile.path,
      configFile: configFile.path,
      buildNumber: buildNumber,
      timestamp: timestamp,
      channelId: channel._id,
    });

    await update.save();
    const updateDetails = {
      _id: update._id,
      versionNumber: update.versionNumber,
      buildNumber: update.buildNumber,
      timestamp: update.timestamp,
      description: update.description,
      updateFile: update.updateFile,
      configFile: update.configFile,
      createdAt: update.createdAt,
      channel: {
        _id: channel._id,
        name: channel.name,
        createdAt: channel.createdAt,
      },
    };

    res.status(200).json({
      message: "Update created successfully.",
      updateDetails: updateDetails,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to create update.", error });
  }
};
const changeUpdateChannel = async (req, res) => {
  try {
    const { updateId, channelName, newDescription } = req.body;

    if (!updateId || !channelName) {
      return res
        .status(400)
        .json({ message: "updateId and newChannelName are required." });
    }

    const update = await Update.findById(updateId);
    if (!update) {
      return res.status(404).json({ message: "Update not found." });
    }

    const newChannel = await Channel.findOne({ name: channelName });
    if (!newChannel) {
      return res.status(404).json({ message: "New channel not found." });
    }

    if (newDescription && newDescription.trim()) {
      update.description = newDescription;
    }

    const existingUpdate = await Update.findOne({
      versionNumber: update.versionNumber,
      channelId: newChannel._id,
    });
    if (existingUpdate) {
      return res
        .status(400)
        .json({ message: "Update already exists in the new channel." });
    }

    // Define old and new file paths for both the ZIP and config files
    const oldZipFilePath = path.resolve(update.updateFile);
    const oldConfigFilePath = path.resolve(update.configFile);

    const newZipFolderPath = path.resolve("public/uploads/zips", channelName);
    const newConfigFolderPath = path.resolve(
      "public/uploads/configs",
      channelName
    );

    if (!fs.existsSync(newZipFolderPath)) {
      fs.mkdirSync(newZipFolderPath, { recursive: true });
    }
    if (!fs.existsSync(newConfigFolderPath)) {
      fs.mkdirSync(newConfigFolderPath, { recursive: true });
    }

    const newZipFilePath = path.join(
      newZipFolderPath,
      path.basename(update.updateFile)
    );

    const newConfigFilePath = path.join(
      newConfigFolderPath,
      path.basename(update.configFile)
    );

    // Move the ZIP file to the new folder
    fs.renameSync(oldZipFilePath, newZipFilePath);

    // Move the config file to the new folder
    fs.renameSync(oldConfigFilePath, newConfigFilePath);

    // Update the update document with the new channel ID and updated file paths
    update.channelId = newChannel._id;
    update.updateFile = path.join(
      "public/uploads/zips",
      channelName,
      path.basename(update.updateFile)
    );
    update.configFile = path.join(
      "public/uploads/configs",
      channelName,
      path.basename(update.configFile)
    );

    await update.save();

    res.status(200).json({
      message: "Update channel changed successfully.",
      updates: update,
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Failed to change update channel.", error });
  }
};

const copyUpdateChannel = async (req, res) => {
  try {
    const { updateId, channelName, newDescription } = req.body;

    if (!updateId || !channelName) {
      return res
        .status(400)
        .json({ message: "updateId and channelName are required." });
    }

    const update = await Update.findById(updateId);
    if (!update) {
      return res.status(404).json({ message: "Update not found." });
    }

    const channel = await Channel.findOne({ name: channelName });
    if (!channel) {
      return res.status(404).json({ message: "Channel not found." });
    }

    if (newDescription && newDescription.trim()) {
      update.description = newDescription;
    }
    const existingUpdate = await Update.findOne({
      versionNumber: update.versionNumber,
      channelId: channel._id,
    });
    if (existingUpdate) {
      return res
        .status(400)
        .json({ message: "Update already copied to this channel." });
    }

    // Define the new file paths for both the ZIP and config files
    const sourceZipFilePath = path.resolve(update.updateFile); // Adjust as needed
    const sourceConfigFilePath = path.resolve(update.configFile); // Adjust as needed

    const destinationFolderPath = path.resolve(
      "public/uploads/zips",
      channelName
    );
    const destinationFolderConfigPath = path.resolve(
      "public/uploads/configs",
      channelName
    );
    if (!fs.existsSync(destinationFolderPath)) {
      fs.mkdirSync(destinationFolderPath, { recursive: true });
    }
    if (!fs.existsSync(destinationFolderConfigPath)) {
      fs.mkdirSync(destinationFolderConfigPath, { recursive: true });
    }
    const destinationZipFilePath = path.join(
      destinationFolderPath,
      path.basename(update.updateFile) // Extract file name from path
    );

    const destinationConfigFilePath = path.join(
      destinationFolderConfigPath,
      path.basename(update.configFile) // Extract file name from path
    );

    // Copy the ZIP file to the new folder
    fs.copyFileSync(sourceZipFilePath, destinationZipFilePath);

    // Copy the config file to the new folder
    fs.copyFileSync(sourceConfigFilePath, destinationConfigFilePath);

    // Create a copy of the update with the new channel's ID and updated file paths
    const copiedUpdate = new Update({
      ...update._doc,
      _id: new mongoose.Types.ObjectId(),
      channelId: channel._id,
      createdAt: new Date(),
      updatedAt: new Date(),
      updateFile: path.join(
        "public/uploads/zips",
        channelName,
        path.basename(update.updateFile)
      ), // Update the ZIP file path in the DB
      configFile: path.join(
        "public/uploads/configs",
        channelName,
        path.basename(update.configFile)
      ), // Update the config file path in the DB
    });

    await copiedUpdate.save();

    res.status(200).json({
      message: "Update copied to new channel successfully.",
      updates: copiedUpdate,
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Failed to copy update to new channel.", error });
  }
};

const deleteUpdate = async (req, res) => {
  try {
    const { updateId } = req.body;
    if (!updateId) {
      return res
        .status(400)
        .json({ message: "updateId is required to delete an update." });
    }
    const update = await Update.findById(updateId);
    if (!update) {
      return res.status(404).json({ message: "Update not found" });
    }

    const isVersionUnique =
      (await Update.countDocuments({
        updateVersion: update.updateVersion,
        _id: { $ne: updateId },
      })) === 0;

    // Define the function to delete files
    const deleteFile = async (filePath) => {
      if (filePath) {
        try {
          await fs.promises.unlink(filePath);
        } catch (error) {
          console.error(`Error deleting file at ${filePath}:`, error);
          throw new Error(`Failed to delete file at ${filePath}`);
        }
      }
    };

    // If the update version is unique, delete the associated files
    await deleteFile(update.updateFile);
    await deleteFile(update.configFile);

    await Update.deleteOne({ _id: updateId });
    res.status(200).json({ message: "Update deleted successfully" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to delete update.", error });
  }
};
const deleteChannel = async (req, res) => {
  try {
    const { channelName } = req.body;
    if (!channelName) {
      return res.status(400).json({ message: "Channel name is required." });
    }
    // Find the channel by its name
    const channel = await Channel.findOne({ name: channelName });
    if (!channel) {
      return res.status(404).json({ message: "Channel not found." });
    }
    // Delete the channel
    await Channel.deleteOne({ name: channelName });
    res.status(200).json({ message: "Channel deleted successfully." });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to delete channel.", error });
  }
};

module.exports = {
  createUpdate,
  getLatestUpdate,
  addSerialNumbersToChannel,
  getAllChannelsWithUpdates,
  deleteSerialNumbersFromChannel,
  changeUpdateChannel,
  copyUpdateChannel,
  deleteChannel,
  deleteUpdate,
  postDeviceInfo,
  deviceInfo,
};
