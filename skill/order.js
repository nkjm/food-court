"use strict";

const debug = require("debug")("bot-express:skill");
const menu_db = require("../service/menu");
const parser = require("../parser/order");
const flex = require("../service/flex");

class SkillOrder {
    async begin(bot, event, context, resolve, reject){
        context.confirmed.order_item_list = [];
        return resolve();
    }

    constructor(){
        this.clear_context_on_finish = (process.env.BOT_EXPRESS_ENV == "test") ? false : true;

        this.required_parameter = {
            order_item: {
                message_to_confirm: async (bot, event, context, resolve, reject) => {
                    context.confirmed.menu_list = await menu_db.get_menu_list();
                    let message = flex.carousel_message("menu", "ご注文をおうかがいします。", context.confirmed.menu_list);
                    return resolve(message);
                },
                parser: parser.order_item,
                reaction: async (error, value, bot, event, context, resolve, reject) => {
                    if (error) return resolve();

                    context.confirmed.order_item_list.unshift(value);

                    if (!value.quantity){
                        bot.collect("quantity");
                    }

                    return resolve();
                }
            },
            anything_else: {
                message_to_confirm: async (bot, event, context, resolve, reject) => {
                    let message = flex.multi_button_message({
                        message_text: `${context.confirmed.order_item_list[0].label}を${String(context.confirmed.order_item_list[0].quantity)}個ですね。\n他にご注文はございますか？`,
                        action_list: [{
                            type: "message",
                            label: "以上",
                            text: "以上"
                        },{
                            type: "message",
                            label: "まだある",
                            text: "まだある"
                        }]
                    })
                    return resolve(message);
                },
                parser: (value, bot, event, context, resolve, reject) => {
                    if (typeof value == "string"){
                        if (["以上", "まだある"].includes(value)){
                            return resolve(value);
                        }
                    }

                    return parser.order_item(value, bot, event, context, resolve, reject);
                },
                reaction: async (error, value, bot, event, context, resolve, reject) => {
                    if (error) return resolve();

                    if (typeof value == "string"){
                        if (value == "以上"){
                            debug("Just go to review.");
                        } else if (value == "まだある"){
                            bot.collect("anything_else");
                            bot.collect("order_item");
                        }
                    } else if (typeof value == "object"){
                        bot.collect("anything_else");

                        await bot.apply("order_item", value);
                    }

                    return resolve();
                }
            },
            review: {
                message_to_confirm: async (bot, event, context, resolve, reject) => {
                    let message = flex.review_message(context.confirmed.order_item_list);
                    return resolve(message);
                },
                reaction: async (error, value, bot, event, context, resolve, reject) => {
                    if (error) return resolve();

                    if (value == "訂正"){
                        debug(`We will cancel some order item.`);
                        bot.collect("review");
                        bot.collect("order_item_to_cancel");
                    } else if (value == "追加"){
                        debug(`We will add another order item.`);
                        bot.collect("review");
                        bot.collect("order_item");
                    } else if (value == "会計"){
                        debug(`We can proceed to payment.`);
                    }
                    return resolve();
                }
            }
        }

        this.optional_parameter = {
            quantity: {
                message_to_confirm: (bot, event, context, resolve, reject) => {
                    let message = {
                        type: "text",
                        text: `${context.confirmed.order_item_list[0].label}の数量を教えていただけますか？`
                    }
                    return resolve(message);
                },
                parser: (value, bot, event, context, resolve, reject) => {
                    if (typeof value == "number"){
                        return value;
                    } else if (typeof value == "string"){
                        if (Number(value) === NaN){
                            return reject();
                        } else {
                            return resolve(Number(value));
                        }
                    }

                    return reject();
                },
                reaction: (error, value, bot, event, context, resolve, reject) => {
                    if (error) return resolve();

                    context.confirmed.order_item_list[0].quantity = value;
                    context.confirmed.order_item_list[0].amount = context.confirmed.order_item_list[0].quantity * context.confirmed.order_item_list[0].unit_price;

                    return resolve();
                }
            },
            order_item_to_cancel: {
                message_to_confirm: (bot, event, context, resolve, reject) => {
                    let message = flex.carousel_message("cancel_order_item", `取り消す注文を選択してください。`, context.confirmed.order_item_list);
                    return resolve(message);
                },
                parser: (value, bot, event, context, resolve, reject) => {
                    if (typeof value != "string") return reject();

                    let order_item_to_cancel = context.confirmed.order_item_list.find(order_item => order_item.label === value);

                    if (order_item_to_cancel){
                        return resolve(order_item_to_cancel);
                    }

                    return reject();
                },
                reaction: (error, value, bot, event, context, resolve, reject) => {
                    if (error) return resolve();

                    let i = 0;
                    for (let order_item of context.confirmed.order_item_list){
                        if (order_item.label === value.label){
                            context.confirmed.order_item_list.splice(i, 1);
                        }
                        i++;
                    }

                    return resolve();
                }
            }
        }
    }

    async finish(bot, event, context, resolve, reject){
        await bot.reply({
            type: "text",
            text: `ご注文とお支払いが完了しました。`
        })

        return resolve();
    }
}

module.exports = SkillOrder;
