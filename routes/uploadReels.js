const multer = require('multer');
const path = require('path');
const cron = require('node-cron');
const jwt = require('jsonwebtoken');
const db = require("../model/msgdb");
const SECRET_KEY = '123';
const session = require("express-session");
var FileStore = require('session-file-store')(session);
const { default: axios } = require("axios");
const { isUploadSuccessful } = require("./utils");
const { URLSearchParams } = require("url");

const DEFAULT_GRAPH_API_ORIGIN = 'https://graph.facebook.com';
const DEFAULT_GRAPH_API_VERSION = '';


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
    SESSION_SECRET,
    NGROK_URL,
} = process.env;

const GRAPH_API_BASE_URL = (GRAPH_API_ORIGIN ?? DEFAULT_GRAPH_API_ORIGIN) + '/' +
    (GRAPH_API_VERSION ? GRAPH_API_VERSION + '/' : DEFAULT_GRAPH_API_VERSION);

function buildGraphAPIURL(path, searchParams, accessToken) {
    const url = new URL(path, GRAPH_API_BASE_URL);
    Object.keys(searchParams).forEach((key) => !searchParams[key] && delete searchParams[key]);
    url.search = new URLSearchParams(searchParams);
    if (accessToken)
        //console.log("acc to ",accessToken);
        url.searchParams.append('access_token', accessToken);

    console.log(url.toString());
    return url.toString();
}



const storage = multer.diskStorage(
    {
    destination: function (req, file, cb) {
       // console.log("reached ",file);
        cb(null, './uploads');
    },
    filename: function (req, file, cb) {
        const id = req.params.id;
       // console.log("id ", id);
        var fileDate = new Date().toLocaleDateString("en-US",{year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        }).split('/').reverse().join('-');
        cb(null, `${id}--${Date.now()}--${file.originalname}`);
    }
});

const upload = multer({ storage: storage,
    limits: {
        fileSize: 1024 * 1024 * 10
    }
 });

const express = require('express');
const uploadreels = express.Router();
uploadreels.use(express.json());
uploadreels.use(express.urlencoded({ extended: true }));
let PRODUCT = "REELS";
let containerId ="";
var post_id="";
//uploadreels.use(cookieParser);
uploadreels.use(
    session({
        secret: process.env.API_SECRET,
        resave: false,
        saveUninitialized: true,
        store: new FileStore,
        cookie: {
            maxAge: 6000000,
        },
    })
);

// Create `uploads` folder if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('./uploads')) {
    fs.mkdirSync('./uploads');
}
// date function
function getDate() {
    var newDate = new Date().toLocaleDateString("en-US",{year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).split('/').reverse().join('-');
    return newDate;
}

function setPostId(id) {
    post_id = id;
}

// Endpoint to upload video
uploadreels.post('/upload/:id', upload.single('video'),(req, res) =>  {
        
        if (!req.file) {
            return res.status(400).send('No file uploaded.');
        }      
        res.status(200).json({
            message: 'File uploaded successfully',
            filePath: NGROK_URL + "/" +req.file.path.replace("\\","/")
        });
    }
);
function setContainerId (Id) {
    containerId = Id;

}
uploadreels.post("/uploadReels", async function (req, res) {
        var containerId;
        var { videoUrl, caption, coverUrl, thumbOffset, accountId } = req.body;
        coverUrl = "";
        //Store in posts table
        const sql = 'INSERT INTO posts (ig_id,user_id,reel_path,caption,cover_url,thumb_offset,creation_date) \
         VALUES (?, ?, ?,?,?,?,?)';
        const params = [accountId,1,videoUrl, caption,coverUrl,thumbOffset,getDate()];
        db.run(sql, params, function(err) {
            console.log("entered db run ", err);
            if (err) {
                res.status(400).json({"error": err.message});
                return;
            }
            var sqlResponse = {"message" : "success", "output" : {post_id: this.lastID}}
            setPostId(this.lastID);
        });
        containerId = await storeReels(req,videoUrl,caption,coverUrl,thumbOffset,accountId);
        console.log("containr ",containerId);
        if (containerId === null) {
            res.send( {
                uploaded: false,
                error: true,
                message: `Error during upload. [Selected account id - ${accountId}]: ${e}`,
            });
        }
        else {
            res.send( {
                uploaded: true,
                accountId,
                containerId,
                message: `${PRODUCT.toLowerCase()} uploaded successfully on IG UserID #${accountId} at Container ID #${containerId}. You can Publish now.`
            });
       }

});
 async function storeReels(req,videoUrl,caption,coverUrl,thumbOffset,accountId ){
    console.log("act id ",accountId);
    ;
    let { locationId, isStories } = req.body;
    
    if(typeof locationId === 'undefined') {
        locationId = "";
    }
    if(isStories !== undefined) {
        PRODUCT = "STORIES";
    } 
    const uploadVideoUri = buildGraphAPIURL(`${accountId}/media`, {
        media_type: PRODUCT,
        video_url: videoUrl,
        caption: caption,
        cover_url: "",
        thumb_offset: thumbOffset,
        location_id: locationId,
    }, ACCESS_TOKEN);
    
    try {
        // Upload Reel Video
        const uploadResponse = await axios.post(uploadVideoUri);
        const containerId = uploadResponse.data.id;
        console.log("upload resp ", uploadResponse.data.id);
        return uploadResponse.data.id;
        // add variables to the session
        //Object.assign(req.session, { accountId, containerId });
 
    } catch(e) {
        return null;
        
    }
};

uploadreels.post("/publishReels", async function (req, res) {
    const {accountId, containerId,videoUrl,caption,coverUrl,thumbOffset} = req.body;
    const { publishedMediaId, permalink, usageRemaining} = await publishReels(req,accountId,containerId);
    if (publishedMediaId === null) {
        res.send( {
            uploaded: false,
            error: true,
            message: `Reel Upload Failed for IG UserID # ${accountId} !`
        });
    }
    else {
        var dbMsg = "";
        var sqlResponse = "";
        var error =false;
        const inputSql = 'INSERT INTO post_reels (post_id,ig_id,user_id,reel_path,caption,cover_url,thumb_offset, \
        published_media_id,permalink,posted,creation_date) \
        VALUES (?, ?, ?, ?,?,?,  ?,?,?,?,?)';
        const inputParams = [post_id,accountId,1,videoUrl, caption,coverUrl,thumbOffset,
            publishedMediaId,permaLink,posted,new Date().toLocaleString("en-US")];
        db.run(inputSql, inputParams, function(err) {
            console.log("entered db run ", err);
            if (err) {
                error=true;
                dbMsg = "Reel Data not saved";
                sqlResponse = {"message" : {dbMsg}, "output" : null}
                //res.status(400).json({"error": err.message});
                //return;
            }else {
                sqlResponse = {"message" : {dbMsg}, "output" : {id: this.lastID}}
            }
            //sqlResp = res.json({ "message": "success", "data": { id: this.lastID, accountId, cronTime } });
            console.log("sql resp ",sqlResponse);
        });
        var returnMsg = "Reel Published successfully on IG UserID #${accountId} with Publish Media ID #${publishedMediaId}, \
                Publishes remaining - ${usageRemaining}";
        if (error) {
            returnMsg = returnMsg + " but " +dbMsg;
        }
        res.send( {
            uploaded: true,
            published: true,
            accountId,
            permalink,
            publishedMediaId,
            message: returnMsg
        });

    }
});

async function publishReels(req,accountIds, containerIds) {
    
    
    const  accountId = accountIds;
    const containerId = containerIds;
    console.log("conta body ",  containerId);
    // Upload happens asynchronously in the backend,
    // so you need to check upload status before you Publish
    const checkStatusUri = buildGraphAPIURL(`${containerId}`, {fields: 'status_code'}, ACCESS_TOKEN);
    const isUploaded = await isUploadSuccessful(0, checkStatusUri);
    console.log("uploaded",isUploaded);
    // When uploaded successfully, publish the video
    
    if(isUploaded) {
        try {
            const publishVideoUri = buildGraphAPIURL(`${accountId}/media_publish`, {
                        creation_id: containerId,
                    }, ACCESS_TOKEN);
            const publishResponse = await axios.post(publishVideoUri);
            const publishedMediaId = publishResponse.data.id;
            
            const rateLimitCheckUrl = buildGraphAPIURL(`${accountId}/content_publishing_limit`, {
                fields: 'config,quota_usage',
            }, ACCESS_TOKEN);
            const rateLimitResponse = await axios.get(rateLimitCheckUrl);
            //await _wait(3000);
            const { config: {quota_total}, quota_usage} = rateLimitResponse.data.data[0];
            const usageRemaining = quota_total - quota_usage;
            console.log("publishedMediaId id",publishedMediaId);
            
            // Get PermaLink to redirect the user to the post
            const permaLinkUri = buildGraphAPIURL(`${publishedMediaId}`, {
                fields: 'permalink',
            }, ACCESS_TOKEN);
            const permalinkResponse = await axios.get(permaLinkUri);
            const permalink = permalinkResponse.data.permalink;
            console.log("permalink id",permalink);
            // Render Publish Success

            return  {publishedMediaId, permalink, usageRemaining};
             
        }
        catch (e) {
            console.log("An error occured while publishing media on instagram..",e.message);
            return null;
        }
        
    } else {
        return null;
    }
};
uploadreels.post('/schedule', async function (req, res) {
    
    console.log("msg body ", req.body);
    
    const token = req.headers['authorization'];
    // Authenticate user
    jwt.verify(token, SESSION_SECRET, (err, decoded) => {
        if (err) return res.status(401).send("Unauthorized");
        const {videoUrl,caption,thumbOffset,accountId,scheduled_date,scheduled_time,scheduled_frequency,cronTime} = req.body;
        
        console.log("crontime ",cronTime);
        var postId = "";
        var coverUrl = "";
        var sqlResponse = "";
        var containerId = "";
        var publishedMediaIds = "";
        var permaLinks = "";
        var usageRemainings = "";
        var posted = "NO";
        var error =false;
        var dbMsg = "Reel Posted Successfully";
        var  today = getDate();
      // Schedule message
        const sql = 'INSERT INTO posts (ig_id,user_id,reel_path,caption,cover_url,thumb_offset,scheduled_date, \
        scheduled_time,scheduled_frequency,post_type,creation_date) VALUES (?, ?, ?,?,?,?,?,?,?,?,?)';
        const params = [accountId,1,videoUrl, caption,coverUrl,thumbOffset,scheduled_date,scheduled_time,scheduled_frequency,"SCHEDULED",today];
        db.run(sql, params, function(err) {
        console.log("entered db run ", err);
        if (err) {
        res.status(400).json({"error": err.message});
        return;
        }
        sqlResponse = {"message" : "success", "output" : {post_id: this.lastID}}
        postId = sqlResponse.output.post_id;
        //sqlResp = res.json({ "message": "success", "data": { id: this.lastID, accountId, cronTime } });
        console.log("sql resp ",sqlResponse);
        });
        console.log(res.statusCode);
        cron.schedule(cronTime, async () => {
            console.log("started ",thumbOffset);
            try {
                containerId = await storeReels(req,videoUrl,caption,coverUrl,thumbOffset,accountId );
                console.log("c id ",containerId);
                const {publishedMediaId,permaLink, usageRemaining} = await publishReels(req,accountId, containerId);
                publishedMediaIds= publishedMediaId;
                permaLinks = permaLink;
                usageRemainings = usageRemaining;
            }
            catch(e) {
                console.log("error ",e);
                error =true;
            }
            
            if (error === false) {
                posted = "YES";
            }
            const updateSql = 'INSERT INTO post_reels (post_id,ig_id,user_id,reel_path,caption,cover_url,thumb_offset,scheduled_date, \
            scheduled_time,scheduled_frequency,published_media_id,permalink,posted,creation_date) \
            VALUES (?, ?, ?, ?,?,?, ?,?,?, ?,?,?,?,?)';
            const updateParams = [postId,accountId,1,videoUrl, caption,coverUrl,thumbOffset,
                scheduled_date,scheduled_time,scheduled_frequency,
                publishedMediaIds,permaLinks,posted,new Date().toLocaleString("en-US")];
            db.run(updateSql, updateParams, function(err) {
            console.log("entered db run ", err);
                if (err) {
                    dbMsg = "Reel Data not saved";
                    sqlResponse = {"message" : {dbMsg}, "output" : null}
                    //res.status(400).json({"error": err.message});
                    //return;
                }else {
                    sqlResponse = {"message" : {dbMsg}, "output" : {id: this.lastID}}
                }
                //sqlResp = res.json({ "message": "success", "data": { id: this.lastID, accountId, cronTime } });
                console.log("sql resp ",sqlResponse);
            });
            console.log(res.statusCode);
            if(error === false) {
                res.status(200).send({
                    message: "Reel posted successfully"
                }); 
            }
            else {
                res.status(res.statusCode).send ({
                    message: "Reel Posting failed "
                } );
            }       
        });
    });
  });
module.exports = uploadreels;
