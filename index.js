"use strict";

require("dotenv").config();

/*
** Import Packages
*/
const express = require("express");
const server = express();
const bot_express = require("bot-express");
const debug = require("debug")("bot-express:index");
const path = require('path');

/**
Middleware Configuration
*/
server.set('views', path.join(__dirname, 'views'));
server.set('view engine', 'ejs');
server.use(express.static(path.join(__dirname, 'public')));


/*
** Middleware Configuration
*/
server.listen(process.env.PORT || 5000, () => {
    console.log("server is running...");
});

/*
** Mount bot-express
*/
server.use("/webhook", bot_express({
    language: "ja",
    nlu: {
        type: "dialogflow",
        options: {
            project_id: process.env.GOOGLE_PROJECT_ID,
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY,
            language: "ja"
        }
    },
    parser: [{
        type: "dialogflow",
        options: {
            project_id: process.env.GOOGLE_PROJECT_ID,
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY,
            language: "ja"
        }
    }],
    translator: {
        type: "google",
        enable_lang_detection: true,
        enable_translation: true,
        options: {
            project_id: process.env.GOOGLE_PROJECT_ID,
            client_email: process.env.GOOGLE_CLIENT_EMAIL,
            private_key: process.env.GOOGLE_PRIVATE_KEY
        }
    },
    memory: {
        type: "memory-cache",
        retention: 600
    },
    line_channel_secret: process.env.LINE_CHANNEL_SECRET,
    line_access_token: process.env.LINE_ACCESS_TOKEN,
    follow_skill: "follow",
    default_skill: process.env.DEFAULT_SKILL,
    parallel_event: process.env.PARALLEL_EVENT
}));


/**
Mount Pay
*/
const routes_pay = require("./routes/pay");
server.use("/pay", routes_pay);

/**
Mount Order Board
*/
const routes_board = require("./routes/board");
server.use("/board", routes_board);


module.exports = server;
