const nodemailer = require("nodemailer");
const dotenv = require("dotenv");

dotenv.config({ path: "./config.env" });
// Create a transporter object using sendmail
const transporter = nodemailer.createTransport({
  host: "smtp-relay.brevo.com", // Mailgun SMTP host
  port: 587, // Mailgun SMTP port
  auth: {
    user: process.env.SMTP_USER, // Mailgun SMTP login (username)
    pass: process.env.SMTP_PASS, // Mailgun SMTP password
  },
});

/**
 * Send an email with the given options.
 * @param {Object} mailOptions - The email options.
 * @returns {Promise} - A promise that resolves when the email is sent.
 */
const sendEmail = (mailOptions) => {
  return new Promise((resolve, reject) => {
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Error sending email:", error);
        return reject(error);
      }
      console.log("Email sent:", info.response);
      resolve(info);
    });
  });
};

module.exports = { sendEmail };
