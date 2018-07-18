"use strict";

const debug = require("debug")("bot-express:service");
const data = require("../../data/menu");

class ServiceMenuFile {
    /**
    Get menu list.
    @method
    @return {Array.<menu>}
    */
    static async get_menu_list(){
        return new Promise((resolve, reject) => {
            return resolve(data);
        })
    }
}

module.exports = ServiceMenuFile;
