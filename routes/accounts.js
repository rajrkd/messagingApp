const express = require("express");
const acct = express.Router();
const jwt = require('jsonwebtoken');
const db = require("../model/msgdb");
const axios = require("axios");

const SECRET_KEY = '123';

// Read variables from environment
require("dotenv").config();
const {
    HOST,
    PORT,
    REDIRECT_URI,
    CLIENT_ID,
    APP_ID,
    API_SECRET,
    GRAPH_API_ORIGIN,
    GRAPH_API_VERSION,
    ACCESS_TOKEN,
} = process.env;
const accessToken = process.env.ACCESS_TOKEN;
var accountsData = '';
//console.log("appid ",process.env.ACCESS_TOKEN);
const getUserAccounts = async (accessToken, callbackfunc) => {
 // console.log("what came ",accessToken);
  const response = await axios.get(
      `https://graph.facebook.com/v22.0/me/accounts?access_token=${accessToken}`
  );
  
  accountsData= response.data;
  var instagramData =[];
  var count =0;
  //console.log(response.data);
  try {
    console.log("resp ", accountsData.data[0].id);
    for (i=0; i < accountsData.data.length; i++) {
      console.log("ids ",accountsData.data[i].id);
      var id = accountsData.data[i].id;
      var pageAccessToken = accountsData.data[i].access_token;
      console.log("page acc ",pageAccessToken);
      const output = await axios.get(
        `https://graph.facebook.com/v22.0/${id}?fields=instagram_accounts&access_token=${pageAccessToken}`
        
      );
      console.log("output", output.data);
      if (output.data.instagram_accounts) {
      for (k=0; k < output.data.instagram_accounts.data.length; k++) {
          var igId = output.data.instagram_accounts.data[k].id;
          console.log("ig id ", igId, ++count);
          const igDetails = await axios.get (
            `https://graph.facebook.com/v22.0/${igId}?fields=username&access_token=${accessToken}`
          )
          console.log("igDetails ",igDetails.data);
          instagramData.push(igDetails.data);
      }}
      //accountsData = instagramData;
      console.log("instagramData ",instagramData);
    }
    
  }
  catch(e) {
    console.log(e);
    //instagramData = [];
  }
  callbackfunc(instagramData);
};




acct.post('/add-igAccount', (req, res) => {
    console.log("body acc ",req.body)
    //const { instagram_id, ig_username } = req.body;
    const {accounts} = req.body;
    const token = req.headers['authorization'];
    const today = new Date().toLocaleString('en-US');
    console.log(token);
    console.log("what came ",accounts);
    // Authenticate user
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) return res.status(401).send("Unauthorized");
      const userId = decoded.id;
      var rows = 0;
      for (var i=0;i < accounts.length; i++) {
        db.run("INSERT INTO instagram_accounts (user_id, ig_id, ig_username,created_date,updated_date) \
          VALUES (?, ?, ?,?,?)", [userId, accounts[i].id, accounts[i].username, today, today], (err) => {
          if (err) return res.status(500).send("Error adding Account");
          rows +=1;
        });
      }
      console.log("num rows added ",  rows);
    });
    
  });
  
acct.get('/igAccounts', (req, res) => {
    //console.log("request headers ",req.headers);
    const  token  =  req.headers['authorization'];
    console.log("rece ",token);
    // Authenticate user
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) return res.status(401).send("Unauthorized");
      const userId = decoded.id;
  
      db.all("SELECT * FROM instagram_accounts WHERE user_id = ?", [userId], (err, rows) => {
        if (err) return res.status(500).send("Error fetching instagram accounts");
        res.status(200).send(rows);
      });
    });
  });

  acct.get('/igPages', (req, res) => {
   // console.log(" headers ",req.headers);
    const  token  =  req.headers['authorization'];
    console.log("pages ",token);
    // Authenticate user
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
      if (err) return res.status(401).send("Unauthorized");
      const userId = decoded.id;
      getUserAccounts(accessToken, function(igData){
        console.log("igdata ",igData);
        if (igData.length > 0) {
          res.status(200).send(igData);
        }
        else {
          res.status(500).send("Error while fetching Accounts");
        }
      });
      
    });
  });


  module.exports= acct;
  