"use strict";

const express = require('express');
const router = express.Router();
const debug = require("debug")("bot-express:route");
const order_db = require("../service/order-db");
const Pay = require("line-pay");
const cache = require("memory-cache");
const line_event = require("../service/line-event");
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

        debug("Going to save order.");
        return order_db.save_order({
            line_user_id: reservation.userId,
            id: reservation.orderId,
            timestamp: Date.now(),
            order_item_list: reservation.order_item_list
        });
    }).then(async (response) => {
        debug("Going to send completion message to user.");
        return line_event.fire({
            type: "bot-express:push",
            to: {
                type: "user",
                userId: reservation.userId
            },
            intent: {
                name: "send-receipt",
                parameters: {
                    order_item_list: reservation.order_item_list
                }
            },
            language: reservation.language
        });
    }).catch((error) => {
        debug("Failed to capture payment.");
        debug(error);
        res.sendStatus(400);

        // This is temp code. We should not send receipt when payment fails.
        return line_event.fire({
            type: "bot-express:push",
            to: {
                type: "user",
                userId: reservation.userId
            },
            intent: {
                name: "send-receipt",
                parameters: {
                    order_item_list: reservation.order_item_list
                }
            },
            language: reservation.language
        });
    });
});

module.exports = router;
