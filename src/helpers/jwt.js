const jwt = require("jsonwebtoken");
const dotenv = require("dotenv");
const User = require("../models/User"); // Adjust path as necessary
dotenv.config({ path: "./config.env" });
// Generate JWT token

const generateToken = async (payload, secretKey, expiresIn = "720h") => {
  // Increment token version
  //const user = await User.findOne({ email: payload.email });

  const user = await User.findOneAndUpdate(
    { email: payload.email },
    { $inc: { tokenVersion: 1 } },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  const token = jwt.sign(
    { ...payload, tokenVersion: user.tokenVersion },
    secretKey,
    { expiresIn }
  );

  return token;
};

// Verify JWT token
function extractToken(req) {
  if (
    req.headers.authorization &&
    req.headers.authorization.split(" ")[0] === "Bearer"
  ) {
    return req.headers.authorization.split(" ")[1];
  } else if (req.query && req.query.token) {
    return req.query.token;
  }
  return null;
}
async function authenticateToken(req, res, next) {
  const token = extractToken(req);
  if (!token) {
    return res.status(401).json({
      auth: false,
      message: "No token provided.",
    });
  }

  jwt.verify(token, process.env.JWT_SECRET_KEY, async (error, decoded) => {
    if (error) {
      console.log(error.message);
      return res.status(401).json({
        auth: false,
        message: "Failed to authenticate token.",
      });
    }
    console.log(decoded);

    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(401).json({
        auth: false,
        message: "User not found.",
      });
    }

    console.log(":" + user);
    console.log("nn" + decoded);

    // Check if the token version is still valid
    if (decoded.tokenVersion !== user.tokenVersion) {
      return res.status(401).json({
        auth: false,
        message: "Token has been invalidated.",
      });
    }

    req.email = decoded.email;
    next();
  });
}

module.exports = {
  generateToken,
  authenticateToken,
};
