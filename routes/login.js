const express = require("express");
const login = express.Router();
const db = require("../model/msgdb");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Facebook = require("facebook-js-sdk");
require("dotenv").config();

const SECRET_KEY = process.env.SESSION_SECRET;
const facebook = new Facebook({
    appId: process.env.APP_ID,
    appSecret: process.env.APP_SECRET,
    redirectUrl: "http://localhost:5000/login/callback",
    graphVersion: "v22.0",
    accessToken: process.env.ACCESS_TOKEN
  });
login.get('/login', function (req, res) {
    console.log("reached facebook login");
    res.send(facebook.getLoginUrl(["email"]));
});

login.get("/callback", function (req, res) {
    if (req.query.code) {
      facebook
        .callback(req.query.code)
        .then((response) => {
            console.log("returned token ",response.data.token);
          res.send(response.data.access_token); // store access_token in database for later use
        })
        .catch((error) => {
          res.send(error.response.data);
        });
    }
  });

// API route to login a user
login.post('/read', (req, res) => {
    console.log("reached login page")
    const { username, password } = req.body;
    console.log([username]);
    const sql = 'SELECT * FROM users WHERE username = ?';
    db.get(sql, [username], (err, user) => {
        if (err || !user) {
            console.log("no user");
            res.status(400).json({"error": "Invalid username or password"});
            return;
        }
        if (bcrypt.compareSync(password, user.password)) {
            const token = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY);
            res.json({ "message": "success", "token": token });
        } else {
            console.log("Loginfailed");
            res.status(400).json({"error": "Invalid username or password"});
        }
    });
});




module.exports = login

