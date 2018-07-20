"use strict";

const debug = require("debug")("bot-express:skill");

/**
Skill to greet and give some initial instruction.
@class
*/
class SkillFollow {
    constructor(){
        this.clear_context_on_finish = true;
    }

    async finish(bot, event, context, resolve, reject){
        let message = {
            type: "text",
            text: "いらっしゃいませ。下のパネルからご希望の操作をお選びください。"
        }
        await bot.reply(message);
        return resolve();
    }
}

module.exports = SkillFollow;
