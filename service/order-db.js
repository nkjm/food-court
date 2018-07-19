"use strict";

const debug = require("debug")("bot-express:service");
const store_type = process.env.ORDERDB_STORE_TYPE || "memory-cache";
const store = require(`./order-db/${store_type}.js`);
const prefix = `order_`;

class ServiceOrderDb {
    /**
    @typedef {Object} order
    @prop {String} line_user_id
    @prop {String} id
    @prop {Number} timestamp
    @prop {Array.<order_item>} order_item_list
    */

    /**
    Get order list.
    @method
    @return {Array.<order>}
    */
    static async get_order_list(){
        return await store.get_order_list();
    }

    /**
    Save order.
    @method
    @param {order} order
    */
    static async save_order(order){
        return await store.save_order(order);
    }

    /**
    Delete order.
    @method
    @param {String} order_id
    */
    static async delete_order(order_id){
        return await store.delete_order(order_id);
    }
}

module.exports = ServiceOrderDb;
