"use strict";

const debug = require("debug")("bot-express:skill");

/**
Skill to clear context.
@class
*/
class SkillClearContext {
    constructor(){
        this.clear_context_on_finish = true;
    }

    finish(bot, event, context, resolve, reject){
        return resolve();
    }
}

module.exports = SkillClearContext
