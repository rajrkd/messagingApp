const sqlite3 = require('sqlite3').verbose();

let db = new sqlite3.Database('./db/msgdb.db', (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Connected to the messages database.');
});
//db.run('drop table users');

// Create users table
db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    instagram_access_token TEXT
)`, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log("Users table created");
});

db.run('CREATE TABLE IF NOT EXISTS recipients (id INTEGER PRIMARY KEY AUTOINCREMENT, user_id INTEGER,    instagram_id TEXT,    message TEXT)',
    (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log("Recipients table created");
});


// Create messages table
db.run(`CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT,
    scheduledTime TEXT,
    user_id INTEGER
)`, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log("Messges table created");
});

// Create fb-business-account table
db.run(`CREATE TABLE IF NOT EXISTS fb_business_account (
    fb_id INTEGER PRIMARY KEY,
    fb_secret TEXT,
    fb_acess_token TEXT,
    created_date TEXT,
    updated_date TEXT,
    user_id INTEGER
)`, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log("Facebook business account table created");
});

// Create Instagram accounts table
db.run(`CREATE TABLE IF NOT EXISTS instagram_accounts (
    ig_id INTEGER PRIMARY KEY,
    ig_username TEXT,
    ig_acess_token TEXT,
    created_date TEXT,
    updated_date TEXT,
    user_id INTEGER
)`, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log("Instagram account table created");
});

// Create Schedule Posts table
db.run(`CREATE TABLE IF NOT EXISTS schedule_posts (
    sid INTEGER PRIMARY KEY AUTOINCREMENT,
    ig_id INTEGER,
    user_id INTEGER,
    reel_path TEXT,
    scheduled_time TEXT,
    creation_date TEXT
)`, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log("schedule posts table created");
});

// Create Posts table
db.run(`CREATE TABLE IF NOT EXISTS posts (
    post_id INTEGER PRIMARY KEY AUTOINCREMENT,
    ig_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL DEFAULT 1,
    product TEXT DEFAULT "REELS",
    reel_path TEXT,
    caption TEXT,
    cover_url TEXT,
    thumb_offset TEXT,
    scheduled_date TEXT,
    scheduled_time TEXT,
    scheduled_frequency TEXT,
    post_type TEXT DEFAULT "INSTANT",
    creation_date TEXT
)`, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log("posts table created");
});

// Create Schedule Posts table
db.run(`CREATE TABLE IF NOT EXISTS post_reels (
    post_reel_id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    ig_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL DEFAULT 1 ,
    product TEXT DEFAULT "REELS",
    reel_path TEXT,
    caption TEXT,
    cover_url TEXT,
    thumb_offset TEXT,
    scheduled_date TEXT,
    scheduled_time TEXT,
    scheduled_frequency TEXT,
    published_media_id TEXT,
    permalink TEXT,
    posted TEXT DEFAULT "NO",
    creation_date TEXT
)`, (err) => {
    if (err) {
        console.error(err.message);
    }
    console.log("post reels table created");
});

module.exports = db;