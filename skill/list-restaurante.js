"use strict";

const debug = require("debug")("bot-express:skill");
const user_db = require("../service/user-db");
const flex = require("../service/flex");

class SkillListRestaurante {
    constructor(){
        this.clear_context_on_finish = (process.env.BOT_EXPRESS_ENV === "test") ? false : true;
    }

    async finish(bot, event, context, resolve, reject){
        let user = await user_db.get_user(bot.extract_sender_id());

        let message;
        if (!user || !user.restaurante_list || user.restaurante_list.length === 0){
            message = {
                type: "text",
                text: `まだレストランが登録されていないようです。お気に入りのレストランを食べログで検索し、そのお店のURLを教えていただければ登録できます。`
            }
        } else {
            message = [{
                type: "text",
                text: `どのレストランを予約しますか？`
            }, flex.carousel_message("restaurante", "よく行くレストラン", user.restaurante_list)];
        }

        await bot.reply(message);

        return resolve();
    }
}

module.exports = SkillListRestaurante;
