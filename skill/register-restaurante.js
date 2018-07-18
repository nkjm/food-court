"use strict";

const debug = require("debug")("bot-express:skill");
const user_db = require("../service/user-db");
const flex = require("../service/flex");
const web = require("../service/web");

class SkillRegisterRestaurante {
    async begin(bot, event, context, resolve, reject){
        if (event.message && event.message.text){
            if (typeof event.message.text != "string") return resolve();

            let matched_value;
            for (let row of event.message.text.split("\n")){
                matched_value = row.match(/^https:\/\/tabelog\.com\/[\w]+\/[\w]+\/[\w]+\/[\w]+/);
            }

            if (matched_value && matched_value[0]){
                await bot.apply_parameter("restaurante_url", matched_value[0]);
            }
        }
        return resolve();
    }

    constructor(){
        this.clear_context_on_finish = (process.env.BOT_EXPRESS_ENV === "test") ? false : true;

        this.required_parameter = {
            restaurante_url: {
                message_to_confirm: {
                    type: "text",
                    text: `お店の食べログのURLを教えてください。`
                },
                parser: async (value, bot, event, context, resolve, reject) => {
                    if (typeof value != "string") return resolve();

                    let matched_value;
                    for (let row of event.message.text.split("\n")){
                        matched_value = row.match(/^https:\/\/tabelog\.com\/[\w]+\/[\w]+\/[\w]+\/[\w]+/);
                    }

                    if (matched_value && matched_value[0]){
                        return resolve(matched_value[0]);
                    }

                    return reject();
                }
            }
        }
    }

    async finish(bot, event, context, resolve, reject){
        await bot.send(bot.extract_sender_id(), {
            type: "text",
            text: `レストランを登録中です。しばらくお待ちください。`
        });

        let bc = await web.init_browser_context(bot.extract_sender_id());
        let page = await web.init_page(bc);

        let restaurante = await web.get_restaurante(page, context.confirmed.restaurante_url);
        debug(`restaurante follows.`);
        debug(restaurante);

        if (!restaurante.support_online_reservation){
            await bot.reply({
                type: "text",
                text: `残念ながらこちらのレストランはオンライン予約ができないようです。`
            })
            return resolve();
        }

        let user = await user_db.get_user(bot.extract_sender_id());
        if (!user){
            user = {};
        }
        if (user.restaurante_list){
            user.restaurante_list.unshift(restaurante);
        } else {
            user.restaurante_list = [restaurante]
        }

        debug(`user follows.`);
        debug(user);
        await user_db.save_user(bot.extract_sender_id(), user);

        let carousel_restaurante_message = flex.carousel_message("restaurante", "よく行くレストラン", [restaurante]);

        await bot.reply([{
            type: "text",
            text: `${restaurante.label}を登録しました。`
        }, carousel_restaurante_message]);

        await web.close_browser_context(bot.extract_sender_id());

        return resolve();
    }
}

module.exports = SkillRegisterRestaurante;
