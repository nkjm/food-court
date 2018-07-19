"use strict";

const debug = require("debug")("bot-express:skill");
const menu_db = require("../service/menu");
const parser = require("../parser/order");
const flex = require("../service/flex");
const cache = require("memory-cache");
const Pay = require("line-pay");
const pay = new Pay({
    channelId: process.env.LINE_PAY_CHANNEL_ID,
    channelSecret: process.env.LINE_PAY_CHANNEL_SECRET,
    isSandbox: true
});

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
                    let menu_list_message = flex.carousel_message("menu", "ご注文をおうかがいします。", context.confirmed.menu_list);
                    return resolve([{
                        type: "text",
                        text: `ご注文の商品をお選びください。`
                    }, menu_list_message]);
                },
                parser: parser.order_item,
                reaction: async (error, value, bot, event, context, resolve, reject) => {
                    if (error) return resolve();

                    // If there is the same menu in order item list, we move the order item to top of the list and increment the quantity if it is set in value.
                    let is_existing = false;
                    let i = 0;
                    for (let order_item of context.confirmed.order_item_list){
                        if (order_item.label == value.label){
                            is_existing = true;
                            let order_item_to_increment_quantity = context.confirmed.order_item_list.splice(i, 1)[0];
                            context.confirmed.order_item_list.unshift(order_item_to_increment_quantity);

                            if (value.quantity){
                                context.confirmed.order_item_list[0].quantity += value.quantity;
                            }
                        }
                        i++;
                    }

                    if (!is_existing){
                        // This is new item so we just add it to top of the order item list.
                        context.confirmed.order_item_list.unshift(value);
                    }

                    // Calculate amount. It can be 0 since quantity may be 0 but will be set in reaction of quantity.
                    context.confirmed.order_item_list[0].amount = context.confirmed.order_item_list[0].quantity * context.confirmed.order_item_list[0].unit_price;

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

                        await bot.apply_parameter("order_item", value);
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

                    context.confirmed.order_item_list[0].quantity += value;
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
        if (process.env.BOT_EXPRESS_ENV == "test"){
            await bot.reply(flex.receipt_message(context.confirmed.order_item_list));
            return resolve();
        }

        let total_amount = 0;
        for (let order_item of context.confirmed.order_item_list){
            total_amount += order_item.amount;
        }

        let reservation = {
            productName: `飲食費`,
            amount: total_amount,
            currency: "JPY",
            orderId: `${bot.extract_sender_id()}-${Date.now()}`,
            confirmUrl: process.env.LINE_PAY_CONFIRM_URL,
            confirmUrlType: "SERVER"
        }

        // Call LINE Pay reserve API.
        let reserve_response;
        try {
            reserve_response = await pay.reserve(reservation);
        } catch(e) {
            return reject(e);
        }

        reservation.transactionId = reserve_response.info.transactionId;
        reservation.userId = bot.extract_sender_id();
        reservation.language = context.sender_language;
        reservation.payment_url = reserve_response.info.paymentUrl.web;
        reservation.order_item_list = context.confirmed.order_item_list;

        // Save reservation so taht confirm URL can retrieve this information.
        cache.put(reservation.orderId, reservation);

        // Now we can provide payment URL.
        let pay_message = flex.multi_button_message({
            message_text: `ありがとうございます、こちらからお支払いお進みください。`,
            action_list: [{
                type: "uri",
                label: `${reservation.amount}円を支払う`,
                uri: reservation.payment_url
            }]
        });

        await bot.reply(pay_message);

        return resolve();
    }
}

module.exports = SkillOrder;
