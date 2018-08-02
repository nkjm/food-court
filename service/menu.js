"use strict";

const debug = require("debug")("bot-express:service");
const store_type = process.env.MENU_STORE_TYPE || "file";
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
    @param {String} lang
    @return {Array.<menu>}
    */
    static async get_menu_list(lang = "ja"){
        let menu_list = await store.get_menu_list();
        let translated_menu_list = JSON.parse(JSON.stringify(menu_list));

        let i = 0;
        for (let menu of menu_list){
            if (menu.label[lang]){
                translated_menu_list[i].label = menu.label[lang];
            } else {
                translated_menu_list[i].label = menu.label[Object.keys(menu.label)[0]];
            }
            i++;
        }
        debug(translated_menu_list);
        return translated_menu_list;
    }
}

module.exports = ServiceMenu;
