"use strict";

const debug = require("debug")("bot-express:service");
const store_type = process.env.MENU_STORE_TYPE || "file"; // file | redis
const store = require(`./menu/${store_type}.js`);
const prefix = `menu_`;

class ServiceMenu {
    /**
    @typedef {Object} menu
    @prop {String} label
    @prop {String} image
    @prop {Number} price
    */

    /**
    Get menu list.
    @method
    @return {Array.<menu>}
    */
    static async get_menu_list(){
        return await store.get_menu_list();
    }
}

module.exports = ServiceMenu;
