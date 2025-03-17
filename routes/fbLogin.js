
require('dotenv').config();
const express = require('express');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const bodyParser = require('body-parser');

const fbLogin = express();
fbLogin.use(bodyParser.json());

// Replace these with your actual credentials
const APP_ID = process.env.FB_APP_ID;
const APP_SECRET = process.env.FB_APP_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;

fbLogin.post('/auth/facebook', async (req, res) => {
  const { accessToken } = req.body;
  if (!accessToken) {
    return res.status(400).json({ message: "Access token is required." });
  }

  try {
    // Verify the token using Facebook's Graph API Debug endpoint
    const debugURL = `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${APP_ID}|${APP_SECRET}`;
    const debugResponse = await axios.get(debugURL);
    const debugData = debugResponse.data.data;

    if (!debugData.is_valid) {
      return res.status(401).json({ message: "Invalid Facebook access token." });
    }

    // Here you could fetch additional details if needed:
    const fbUserId = debugData.user_id;
    const userInfoURL = `https://graph.facebook.com/${fbUserId}?fields=id,name,email&access_token=${accessToken}`;
    const userInfoResponse = await axios.get(userInfoURL);
    const user = userInfoResponse.data;

    // Create or update the user in your SQLite DB as appropriate (pseudocode)
    // const savedUser = await createUserOrUpdate(user);

    // Generate a JWT for your application
    const token = jwt.sign({ id: fbUserId, name: user.name }, JWT_SECRET, { expiresIn: '1h' });
    
    res.json({ token, user });
    
  } catch (error) {
    console.error("Error during Facebook token verification:", error.response ? error.response.data : error.message);
    res.status(500).json({ message: "Internal server error." });
  }
});

module.exports = fbLogin;
