const AllowedEmail = require("../models/PhoneModels/allowedphone");
const otpGenerator = require("otp-generator");
var admin = require("firebase-admin");
const OTP = require("../models/otp");
const myjwt = require("../helpers/jwt");
const axios = require("axios");
const { sendEmail } = require("../helpers/emailService");
const PhOtp = require("../models/PhoneModels/phOtpVerify");
const dotenv = require("dotenv");
dotenv.config({ path: "./config.env" });

const addAllowedPhones = async (req, res) => {
  const { emails } = req.body;

  console.log(req.email != process.env.ADMIN_EMAIL);
  if (req.email != process.env.ADMIN_EMAIL) {
    return res
      .status(400)
      .json({ message: "Only admins have access to this." });
  }

  if (!Array.isArray(emails)) {
    return res.status(400).json({ message: "Emails array is required." });
  }

  try {
    const validEmails = [];

    // Regular expression for validating an Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    for (let email of emails) {
      if (emailRegex.test(email)) {
        const isAllowed = await AllowedEmail.findOne({ email: email });
        if (!isAllowed) {
          validEmails.push({ email: email });
        }
      }
    }

    // Insert only the valid emails
    if (validEmails.length === 0) {
      return res
        .status(400)
        .json({ message: "No valid email addresses to add." });
    }
    const addedEmails = await AllowedEmail.insertMany(validEmails, {
      ordered: false,
    });
    res.status(200).json({ message: "Email added successfully.", addedEmails });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to add emails.", error });
  }
};
const getAllowedPhoneNumbers = async (req, res) => {
  try {
    const addedEmails = await AllowedEmail.find();
    res.status(200).json({
      message: "Emails allowed for stable ota modifications",
      addedEmails,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to get phone numbers.", error });
  }
};
const isAllowedPhoneNumber = async (email) => {
  const allowedPhone = await AllowedEmail.findOne({ email });
  return !!allowedPhone;
};
// Endpoint to delete allowed phone numbers
const deleteAllowedPhones = async (req, res) => {
  const { emails } = req.body;
  try {
    if (req.email !== process.env.ADMIN_EMAIL) {
      return res
        .status(400)
        .json({ message: "Only admins have access to this." });
    }

    const deletedEmails = await AllowedEmail.deleteMany({
      email: { $in: emails },
    });
    res
      .status(200)
      .json({ message: "Emails deleted successfully.", deletedEmails });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to delete phone numbers.", error });
  }
};
const verifyPassword = async (email, password) => {
  try {
    const response = await axios.post(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.FIREBASE_API_KEY}`,
      {
        email,
        password,
        returnSecureToken: true,
      }
    );
    return response.data; // Includes idToken
  } catch (error) {
    console.error("Error verifying password:", error);
    return null;
  }
};
const verifyOtp = async (req, res) => {
  try {
    const { email, password, otp } = req.body;
    const authResponse = await verifyPassword(email, password);
    if (!authResponse || !authResponse.idToken) {
      return res.status(401).send("Invalid email or password.");
    }
    const otpDoc = await OTP.findOne({ email, otp, used: false }).sort({
      expiresAt: -1,
    });
    console.log(req.body);
    console.log(new Date());
    if (!otpDoc || otpDoc.otp !== otp || new Date() > otpDoc.expiresAt) {
      return res.status(400).send("Invalid or expired OTP.");
    }

    otpDoc.used = true;
    await otpDoc.save();

    const token = await myjwt.generateToken(
      { email: email },
      process.env.JWT_SECRET_KEY
    );
    res.status(200).json({ authToken: token });
  } catch (error) {
    console.log(error);
    res.status(400).send("Error verifying OTP.");
  }
};
const getOtp = async (req, res) => {
  try {
    const { email } = req.body;
    console.log(req.body);
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(email);
      if (!userRecord) {
        return res.status(404).send("User not found.");
      }
    } catch (error) {
      console.log(error);
      return res.status(404).send("User not found. Please contact admin.");
    }
    const otp = otpGenerator.generate(6, {
      upperCase: true,
      specialChars: false,
    });
    var now = new Date();
    now.setMinutes(now.getMinutes() + 5); // timestamp
    now = new Date(now); // OTP expires in 5 minutes
    await OTP.updateMany({ email: email }, { used: true });
    const otpDoc = new OTP({
      email,
      otp,
      expiresAt: now,
      used: false,
    });
    await otpDoc.save();
    const mailOptions = {
      from: "mail@lighko.com", // Replace with your domain's email address
      to: email,
      subject: "Your OTP Code for OTA ACCESS",
      text: `Your OTP code is: ${otp}\nIt will expire in 5 minutes.`,
    };

    // Send OTP via email
    await sendEmail(mailOptions);
    //res.status(200).send("OTP sent successfully.");
    res.status(200).send("OTP sent successfully.");
    //res.status(200).send(`OTP sent: ${otp}`);
  } catch (error) {
    console.log(error);
    res.status(400).send("Error sending OTP.");
  }
};
const sendPhOtp = async (req, res) => {
  const { email } = req.body;

  try {
    let allowedPhone = await isAllowedPhoneNumber(email);
    console.log(allowedPhone);
    if (!allowedPhone) {
      return res
        .status(400)
        .json({ message: "This Email not allowed. Contact admin" });
    }
    const otp = otpGenerator.generate(6, {
      upperCase: true,
      specialChars: false,
    });

    var now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    now = new Date(now);
    await PhOtp.updateMany({ email: email }, { used: true });
    const otpDoc = new PhOtp({
      email,
      otp,
      expiresAt: now,
      used: false,
    });
    await otpDoc.save();
    let usNumber = email;
    const mailOptions = {
      from: "mail@lighko.com", // Replace with your domain's email address
      to: usNumber,
      subject: "Your OTP Code for OTA STABLE ACCESS",
      text: `Your OTP code is: ${otp}\nIt will expire in 24 hours.`,
    };

    // Send OTP via email
    await sendEmail(mailOptions);
    res.status(200).send("OTP sent successfully.");
    // res.status(200).json({ message: "OTP sent successfully.", phOtp: otpDoc });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Failed to send OTP.", error });
  }
};
module.exports = {
  addAllowedPhones,
  deleteAllowedPhones,
  getAllowedPhoneNumbers,
  getOtp,
  verifyOtp,
  sendPhOtp,
};
