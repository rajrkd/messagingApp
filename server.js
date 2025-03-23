const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');
require("dotenv").config();
const port = process.env.PORT || 5000;

const registerRouter = require('./routes/register');
const loginRouter = require('./routes/login');
const acctRouter = require('./routes/accounts');
const msgRouter = require('./routes/messages');
//const scheduleRouter = require('./routes/schedular');
const webhookRouter = require('./routes/webhook');
const uploadReels = require('./routes/uploadReels');
const fbLogin = require('./routes/fbLogin');

app.use(cors());
app.use(express.json());
app.use("/register", registerRouter);
app.use("/login", loginRouter);
app.use("/accounts", acctRouter);
app.use("/messages", msgRouter);
app.use("/schedule", uploadReels);
app.use("/webhook", webhookRouter);
//app.use("/uploads",express.static('uploads'));
app.use("/uploads",uploadReels);
app.use("/fblogin",fbLogin);

app.use(express.static(__dirname, {dotfiles : 'allow'}));

app.get('/', (req, res) => {
   // res.send('Hello World!');
   //res.render('index');
  });

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
