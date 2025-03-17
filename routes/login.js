const express = require("express");
const login = express.Router();
const db = require("../model/msgdb");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Facebook = require("facebook-js-sdk");


const SECRET_KEY = '123';
const facebook = new Facebook({
    appId: "1832746784161036",
    appSecret: "5fe982f83e641e1a0bcbd7f7f402ba75",
    redirectUrl: "https://localhost:5000/login/callback",
    graphVersion: "v22.0",
    accessToken: "EAAaC350IfQwBO1wPw13QpqmsATXnlZAgiQOZA4duJeforDLaevDocNMTAeAClD53RpkgCbYxxnXOfI38rGRRyZCO0dPKnPoJlxp6tICoz47jGBDsX2fcTZAQc27km76Gwad1GxZAQXkTnRZACeXUAbzOkLohetobFr614n3VNv5FvJEqRPoF8lHURtybHltXvDypZC7ogZDZD"
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

