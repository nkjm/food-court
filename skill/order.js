"use strict";

const debug = require("debug")("bot-express:skill");
const menu_db = require("../service/menu");
const parser = require("../parser/order");
const Flex = require("../service/flex");
let flex;
const Translation = require("../translation/translation");
let t;
const cache = require("memory-cache");
const Pay = require("line-pay");
const pay = new Pay({
    channelId: process.env.LINE_PAY_CHANNEL_ID,
    channelSecret: process.env.LINE_PAY_CHANNEL_SECRET,
    isSandbox: true
});
const LIFF_PAY_SANDBOX = process.env.LIFF_PAY_SANDBOX;

class SkillOrder {
    async begin(bot, event, context, resolve, reject){
        t = new Translation(bot.translator, context.sender_language);
        flex = new Flex(t);
        context.confirmed.order_item_list = [];
        return resolve();
    }

    constructor(){
        this.clear_context_on_finish = (process.env.BOT_EXPRESS_ENV == "test") ? false : true;

        this.required_parameter = {
            order_item: {
                message_to_confirm: async (bot, event, context, resolve, reject) => {
                    context.confirmed.menu_list = await menu_db.get_menu_list(context.sender_language);
                    let menu_list_message = await flex.carousel_message("menu", await t.t(`may_i_have_your_order`), context.confirmed.menu_list);
                    return resolve([{
                        type: "text",
                        text: await t.t(`pls_select_order`)
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
                    let message = await flex.multi_button_message({
                        message_text: `${await t.t("got_x_item", {
                            item_label: context.confirmed.order_item_list[0].label,
                            number: context.confirmed.order_item_list[0].quantity
                        })}\n${await t.t("anything_else")}`,
                        action_list: [{
                            type: "message",
                            label: await t.t(`add`),
                            text: await t.t(`add`)
                        },{
                            type: "message",
                            label: await t.t(`thats_it`),
                            text: await t.t(`thats_it`)
                        }]
                    })
                    return resolve(message);
                },
                parser: async (value, bot, event, context, resolve, reject) => {
                    if (typeof value == "string"){
                        if ([`${await t.t("add")}`, `${await t.t("thats_it")}`].includes(value)){
                            return resolve(value);
                        }
                    }

                    return parser.order_item(value, bot, event, context, resolve, reject);
                },
                reaction: async (error, value, bot, event, context, resolve, reject) => {
                    if (error) return resolve();

                    if (typeof value == "string"){
                        if (value == await t.t(`thats_it`)){
                            debug("Just go to review.");
                        } else if (value == await t.t(`add`)){
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

                    let message;
                    if (context.confirmed.order_item_list.length > 0){
                        // We have some order items.
                        message = await flex.review_message(context.confirmed.order_item_list);
                    } else {
                        // order item list is emply.
                        message = await flex.multi_button_message({
                            message_text: `${await t.t("there_is_no_order")} ${await t.t("do_you_add_order")}`,
                            action_list: [{
                                type: "message",
                                label: await t.t(`cancel`),
                                text: await t.t(`cancel`)
                            },{
                                type: "message",
                                label: await t.t(`add`),
                                text: await t.t(`add`)
                            }]
                        })
                    }
                    return resolve(message);
                },
                parser: async (value, bot, event, context, resolve, reject) => {
                    if (typeof value != "string") reject();

                    if ([await t.t(`modify`), await t.t(`add`), await t.t(`check`), await t.t(`cancel`)].includes(value)){
                        return resolve(value);
                    }

                    return reject();
                },
                reaction: async (error, value, bot, event, context, resolve, reject) => {
                    if (error) return resolve();

                    if (value == await t.t(`modify`)){
                        debug(`We will cancel some order item.`);
                        bot.collect("review");
                        bot.collect("order_item_to_cancel");
                    } else if (value == await t.t(`add`)){
                        debug(`We will add another order item.`);
                        bot.collect("review");
                        bot.collect("order_item");
                    } else if (value == await t.t(`check`)){
                        debug(`We can proceed to payment.`);
                    } else if (value == await t.t(`cancel`)){
                        debug(`We cancel order.`);
                        await bot.reply({
                            type: "text",
                            text: `${await t.t("certainly")} ${await t.t("order_canceled")}`
                        })
                        bot.init();
                    }
                    return resolve();
                }
            }
        }

        this.optional_parameter = {
            quantity: {
                message_to_confirm: async (bot, event, context, resolve, reject) => {
                    let message = {
                        type: "text",
                        text: await t.t(`pls_tell_me_quantity_of_the_item`, {
                            item_label: context.confirmed.order_item_list[0].label
                        })
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
                message_to_confirm: async (bot, event, context, resolve, reject) => {
                    let message = await flex.carousel_message("cancel_order_item", await t.t(`pls_select_order_to_cancel`), context.confirmed.order_item_list);
                    return resolve(message);
                },
                parser: async (value, bot, event, context, resolve, reject) => {
                    if (typeof value != "string") return reject();

                    let order_item_to_cancel = context.confirmed.order_item_list.find(order_item => order_item.label === value);

                    if (order_item_to_cancel){
                        return resolve(order_item_to_cancel);
                    }

                    return reject();
                },
                reaction: async (error, value, bot, event, context, resolve, reject) => {
                    if (error) return resolve();

                    let i = 0;
                    for (let order_item of context.confirmed.order_item_list){
                        if (order_item.label === value.label){
                            let canceled_order_item = context.confirmed.order_item_list.splice(i, 1)[0];
                            bot.queue({
                                type: "text",
                                text: `${await t.t("certainly")} ${await t.t("the_item_has_been_canceled", {
                                    item_label: canceled_order_item.label
                                })}`
                            })
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
            await bot.reply(await flex.receipt_message(context.confirmed.order_item_list));
            return resolve();
        }

        let total_amount = 0;
        for (let order_item of context.confirmed.order_item_list){
            total_amount += order_item.amount;
        }

        let reservation = {
            productName: await t.t(`food_fee`),
            amount: total_amount,
            currency: "JPY",
            orderId: `${bot.extract_sender_id()}-${Date.now()}`,
            confirmUrl: process.env.LINE_PAY_CONFIRM_URL,
            confirmUrlType: "SERVER",
        }

        if (context.sender_language){
            reservation.langCd = context.sender_language;
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

        debug(reservation.payment_url);
        let query_string = reservation.payment_url.split("?")[1];
        debug(query_string);

        // Save reservation so taht confirm URL can retrieve this information.
        cache.put(reservation.orderId, reservation);

        // Now we can provide payment URL.
        let pay_message = await flex.multi_button_message({
            message_text: `${await t.t("pls_go_to_payment")} ${await t.t("let_you_know_when_food_is_ready")}`,
            action_list: [{
                type: "uri",
                label: await t.t("pay_x_yen", {
                    amount: reservation.amount
                }),
                uri: `line://app/${LIFF_PAY_SANDBOX}/?${query_string}`
                //uri: reservation.payment_url
            }]
        });

        await bot.reply(pay_message);

        return resolve();
    }
}

module.exports = SkillOrder;
