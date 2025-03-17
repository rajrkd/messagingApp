const express = require("express");
const register = express.Router();
const db = require("../model/msgdb");
const bcrypt = require('bcryptjs');

// API route to register a new user
register.post('/', (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 10);
    const sql = 'INSERT INTO users (username, password) VALUES (?, ?)';
    const params = [username, hashedPassword];
    db.run(sql, params, function(err) {
        if (err) {
            res.status(400).json({"error": err.message});
            return;
        }
        res.json({ "message": "success", "data": { id: this.lastID, username } });
    });
});

module.exports = register