const express = require("express");
const msgs = express.Router();
const cron = require('node-cron');
const jwt = require('jsonwebtoken');
const db = require("../model/msgdb");
const axios = require("axios");
require("dotenv").config();
// Middleware to authenticate token
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    console.log("token "+token)
    if (!token) return res.sendStatus(401);
    
    jwt.verify(token, '123', (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
};
/*
msgs.post('/instagram-token', authenticateToken, (req, res) => {
    const { instagramAccessToken } = req.body;
    const sql = 'UPDATE users SET instagram_access_token = ? WHERE id = ?';
    const params = [instagramAccessToken, req.user.id];
    db.run(sql, params, function(err) {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.json({ "message": "success" });
    });
});

// API route to get all messages (requires authentication)
msgs.get('/', authenticateToken, (req, res) => {
    console.log("usr "+[req.user.id])
    const sql = 'SELECT * FROM messages WHERE user_id = ?';
    db.all(sql, [req.user.id], (err, rows) => {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.json({ "message": "success", "data": rows });
    });
});

// API route to add a new message (requires authentication)
msgs.post('/', authenticateToken, (req, res) => {
    const { content, scheduledTime } = req.body;
    const sql = 'INSERT INTO messages (content, scheduledTime, user_id) VALUES (?, ?, ?)';
    const params = [content, scheduledTime, req.user.id];
    db.run(sql, params, function(err) {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.json({ "message": "success", "data": { id: this.lastID, content, scheduledTime } });
    });
});

// Schedule cron job to check and send messages
cron.schedule('* * * * *', () => {
    const sql = 'select * from messages where scheduledTime <= ?';
    //const currentTime = new Date().toISOString();
    currentTime = '2025-02-15T03:08';
    console.log("cron fired", currentTime);
    db.all(sql, [currentTime], (err, messages) => {
        if (err) {
            console.error(err.message);
            return;
        }
        console.log("some data", messages.length);
        messages.forEach((message) => {
            // Logic to send message (e.g., via Instagram API)
            console.log("in messages");
            const userSql = 'SELECT instagram_access_token FROM users WHERE id = ?';
            db.get(userSql, [message.user_id], (err, user) => {
                if (err) {
                    console.error(err.message);
                    return;
                }
                const instagramAccessToken = user.instagram_access_token;
                console.log("reached here");
                const url = `https://graph.instagram.com/v22.0/me/messages?access_token=${instagramAccessToken}`;
                const data = {
                    recipient: { id: '66354131738' }, // Replace with recipient user id
                    message: { text: message.content },
                };
                console.log(data);    
                axios.post(url, data)
                    .then(response => console.log('Message sent: ', response.data))
                    .catch(error => console.error('Error sending message: ', error));
            });

        });
    });
});
*/

msgs.post('/send-message', (req, res) => {
  const { token, recipients, message } = req.body;

  // Authenticate user
  jwt.verify(token, process.env.SESSION_SECRET, (err, decoded) => {
    if (err) return res.status(401).send("Unauthorized");
    const userId = decoded.id;

    recipients.forEach((recipient) => {
      axios.post(`https://graph.instagram.com/${recipient.instagram_id}/messages`, {
        message,
        access_token: process.env.INSTAGRAM_TOKEN
      })
      .then(response => res.status(200).send("Message sent"))
      .catch(error => res.status(500).send("Error sending message"));
    });
  });
});

module.exports= msgs;