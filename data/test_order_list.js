"use strict";

let order_item_list = require("../flex_test_data/receipt_message");

module.exports = [{
    line_user_id: "hoge1",
    id: "hoge_id_1",
    timestamp: Date.now(),
    order_item_list: order_item_list
},{
    line_user_id: "hoge2",
    id: "order_id_2",
    timestamp: Date.now(),
    order_item_list: [{
        label: "豚玉モダン焼き",
        quantity: 2
    },{
        label: "生ビール",
        quantity: 2
    }]
},{
    line_user_id: "hoge3",
    id: "order_id_3",
    timestamp: Date.now(),
    order_item_list: [{
        label: "豚玉モダン焼き",
        quantity: 1
    },{
        label: "焼きそば",
        quantity: 1
    }]
},{
    line_user_id: "hoge2",
    id: "order_id_2",
    timestamp: Date.now(),
    order_item_list: [{
        label: "豚玉",
        quantity: 4
    },{
        label: "豚玉モダン焼き",
        quantity: 1
    },{
        label: "生ビール",
        quantity: 2
    }]
},{
    line_user_id: "hoge2",
    id: "order_id_2",
    timestamp: Date.now(),
    order_item_list: [{
        label: "豚玉",
        quantity: 1
    },{
        label: "豚玉モダン焼き",
        quantity: 1
    },{
        label: "生ビール",
        quantity: 2
    }]
}]
