"use strict";

/**
Import packages
*/
const express = require('express');
const router = express.Router();
const debug = require("debug")("bot-express:route");
const order_db = require("../service/order-db");

const test_data = require("../data/test_order_list");

/**
Router configuration
*/
router.get("/", async (req, res) => {
    let order_list = await order_db.get_order_list();

    order_list = test_data;

    return res.render("board", {order_list: order_list});
});

module.exports = router;
