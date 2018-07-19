"use strict";

const debug = require("debug")("bot-express:parser");

class ParserOrder {
    static async order_item(value, bot, event, context, resolve, reject){
        if (typeof value == "string"){
            let menu = context.confirmed.menu_list.find(menu => menu.label === value);
            if (menu){
                return resolve({
                    label: menu.label,
                    image: menu.image,
                    unit_price: menu.price,
                    quantity: 0
                });
            } else {
                // Reject.
                return reject();
            }
        } else if (typeof value == "object" && value.data){
            let order_item = JSON.parse(value.data);
            if (order_item.label){
                let menu = context.confirmed.menu_list.find(menu => menu.label === order_item.label);
                if (menu){
                    if (order_item.quantity){
                        return resolve({
                            label: menu.label,
                            image: menu.image,
                            unit_price: menu.price,
                            quantity: order_item.quantity
                        })
                    } else if (order_item.label && !order_item.quantity){
                        return resolve({
                            label: menu.label,
                            image: menu.image,
                            unit_price: menu.price,
                            quantity: 0
                        })
                    }
                }
            }
        }

        return reject();
    }
}

module.exports = ParserOrder;
