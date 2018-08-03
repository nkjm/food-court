"use strict";

const debug = require("debug")("bot-express:skill");
const Translation = require("../translation/translation");
let t;
const Flex = require("../service/flex");
let flex;

module.exports = class SkillSendReceipt {
    async begin(bot, event, context, resolve, reject){
        t = new Translation(bot.translator, context.sender_language);
        flex = new Flex(t);
        return resolve();
    }

    constructor(){
        this.clear_context_on_finish = (process.env.BOT_EXPRESS_ENV === "test") ? false : true;

        this.required_parameter = {
            order_item_list: {}
        }
    }

    async finish(bot, event, context, resolve, reject){
        let message = await flex.receipt_message(context.confirmed.order_item_list);

        try {
            await bot.reply(message);
        } catch(e) {
            return reject(e);
        }

        return resolve();
    }
}
