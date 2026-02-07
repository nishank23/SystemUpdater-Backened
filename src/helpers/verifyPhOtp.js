const PhOtp = require("../models/PhoneModels/phOtpVerify");
const Update = require("../models/UpdateModels/Update");
const Channel = require("../models/UpdateModels/Channel");

const verifyStableChannelOtp = async (req, res, next) => {
  try {
    const { channelName, email, otp, updateId } = req.body;
    console.log(req.body);
    let resolvedChannelName = channelName;
    if (updateId && !channelName) {
      const update = await Update.findById(updateId);
      if (!update) {
        return res.status(400).json({ message: "Invalid updateId." });
      }
      const channel = await Channel.findById(update.channelId);
      if (!channel) {
        return res.status(400).json({ message: "Invalid channelId." });
      }
      resolvedChannelName = channel.name;
    }
    if (resolvedChannelName === "stable") {
      if (!email || !otp) {
        return res.status(400).json({
          message: "email and otp are required for stable channel operations.",
        });
      }
      const otpDoc = await PhOtp.findOne({
        email,
        otp,
        used: false,
      }).sort({
        expiresAt: -1,
      });
      if (!otpDoc || otpDoc.otp !== otp || new Date() > otpDoc.expiresAt) {
        return res.status(400).send("Invalid or expired OTP.");
      }
      otpDoc.used = true;
      await otpDoc.save();
    }
    next();
  } catch (error) {
    res.status(500).json({ message: "Failed to verify OTP.", error });
  }
};
module.exports = verifyStableChannelOtp;
