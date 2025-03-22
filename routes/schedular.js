const uploadReelsModule =require("./uploadReels");
const {storeReels} = require("./uploadReels");
//const publishReels =require("./uploadReels").publishReels;
const express = require("express");
const sch = express.Router();
const cron = require('node-cron');
const jwt = require('jsonwebtoken');
const db = require("../model/msgdb");
const axios = require("axios");
require("dotenv").config();
const SECRET_KEY = process.env.SESSION_SECRET;
var containerId;
sch.use(uploadReelsModule);//('storeReels','publishReels'));


//sch.use(publishReels);
sch.post('/', async function (req, res) {
  sch.use("/uploadReels",uploadReelsModule.uploadReelsFunction);
  console.log("type of", uploadReelsModule);
  console.log("msg body ", req.body);
  
  const token = req.headers['authorization'];
  // Authenticate user
  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(401).send("Unauthorized");
    const {videoUrl,caption,thumbOffset,accountId,scheduled_date,scheduled_time,scheduled_frequency,cronTime} = req.body;
    
    console.log("crontime ",cronTime);
    var coverUrl = "";
    var sqlResponse = "";
    var  today = new Date().toLocaleDateString("en-US",{year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).split('/').reverse().join('-');
    // Schedule message
    cron.schedule(cronTime, async () => {
      console.log("started ",thumbOffset);
      try {
        const {containerId} = await uploadReelsFunction(req,res);
      }
      catch(e) {
        console.log("error ",e);
      }
      const {publishedMediaId,permaLink, usageRemaining} =  publishReels(req,accountId, containerId);
      
      const sql = 'INSERT INTO post_reels (ig_id,user_id,reel_path,caption,thumb_offset,scheduled_date, \
                  scheduled_time,scheduled_frequency,creation_date) VALUES (?, ?, ?,?,?,?,?,?,?)';
      const params = [accountId,1,videoUrl, caption,thumbOffset,scheduled_date,scheduled_time,scheduled_frequency,today];
      db.run(sql, params, function(err) {
        console.log("entered db run ", err);
          if (err) {
              res.status(400).json({"error": err.message});
              return;
          }
          sqlResponse = {"message" : "success", "output" : {post_id: this.lastID}}
          //sqlResp = res.json({ "message": "success", "data": { id: this.lastID, accountId, cronTime } });
          console.log("sql resp ",sqlResponse);
      });
        //console.log("sending messages ",new Date().toLocaleString('en-US'),sqlResponse);
        console.log(res.status);
        //res.status(200).send({
        //response : sqlResponse,
        //  message: "Message scheduled successfully"
       // }); 
      
    });
  });
});

module.exports = sch;
