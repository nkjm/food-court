"use strict";

const express = require('express');
const router = express.Router();
const debug = require("debug")("bot-express:route");
const Pay = require("line-pay");
const cache = require("memory-cache");
const line_event = require("../service/line-event");
const flex = require("../service/flex");
const request = require("request");
let Promise = require("bluebird");
Promise.promisifyAll(request);

const pay = new Pay({
    channelId: process.env.LINE_PAY_CHANNEL_ID,
    channelSecret: process.env.LINE_PAY_CHANNEL_SECRET,
    isSandbox: true
});

/**
Payment confirm URL
*/

router.get('/confirm', (req, res, next) => {
    if (!req.query.transactionId || !req.query.orderId){
        // Required query string not found.
        return res.sendStatus(400);
    }

    // Get reserved info
    let order;
    debug(`Transaction Id is ${req.query.transactionId}`);
    debug(`Order Id is ${req.query.orderId}`);

    // Get reservation from db.
    let reservation = cache.get(req.query.orderId);

    // Confirm & Capture the payment.
    debug(`Going to confirm/capture payment of following reservation..`);
    debug(reservation);
    return pay.confirm({
        transactionId: req.query.transactionId,
        amount: reservation.amount,
        currency: reservation.currency
    }).then((response) => {
        debug("Succeeed to capture payment.");
        res.sendStatus(200);

        debug("Going to send completion message to user.");
        return line_event.fire({
            type: "bot-express:push",
            to: {
                type: "user",
                userId: reservation.userId
            },
            intent: {
                name: "robot-response",
                fulfillment: [flex.receipt_message(reservation.order_item_list)]
            },
            language: reservation.language
        });
    }, (response) => {
        debug("Failed to capture payment.");
        debug(response);
        res.sendStatus(400);

        // This is temp code. We should not send receipt when payment fails.
        return line_event.fire({
            type: "bot-express:push",
            to: {
                type: "user",
                userId: reservation.userId
            },
            intent: {
                name: "robot-response",
                fulfillment: [flex.receipt_message(reservation.order_item_list)]
            },
            language: reservation.language
        });
    }).then((response) => {
        debug("Succeed to send message");
    });
});

module.exports = router;
