"use strict";

const debug = require("debug")("bot-express:skill");
const cache = require("memory-cache");
const wanakana = require("wanakana");
const user_db = require("../service/user-db");
const flex = require("../service/flex");
const web = require("../service/web");
const PPTR_BROWSER_CONTEXT_RETENTION = (process.env.PPTR_BROWSER_CONTEXT_RETENTION) ? Number(process.env.PPTR_BROWSER_CONTEXT_RETENTION) * 1000 : 1800 * 1000;

class SkillReserveRestaurante {

    async begin(bot, event, context, resolve, reject){
        // Check user information.
        let user = await user_db.get_user(bot.extract_sender_id());

        // We won't ask user for known fields.
        if (user){
            const contact_field_list = ["lastname", "firstname", "lastname_kana", "firstname_kana", "phone", "email"];
            for (let f of contact_field_list){
                if (user[f]){
                    await bot.apply_parameter(f, user[f]);
                }
            }
        }

        // Message to ask user to wait for a second.
        const inprogress_sticker_message_list = [{
            type: "sticker",
            packageId: "2",
            stickerId: "161"
        },{
            type: "sticker",
            packageId: "2",
            stickerId: "159"
        },{
            type: "sticker",
            packageId: "2",
            stickerId: "502"
        }]
        const inprogress_sticker_message_offset = Math.floor(Math.random() * (inprogress_sticker_message_list.length));
        await bot.send(bot.extract_sender_id(), [{
            type: "text",
            text: `空き状況をお調べしますので少々お待ちください。`
        }, inprogress_sticker_message_list[inprogress_sticker_message_offset]]);

        return resolve();
    }

    constructor(){
        this.clear_context_on_finish = (process.env.BOT_EXPRESS_ENV === "test") ? false : true;

        this.required_parameter = {
            restaurante_url: {
                message_to_confirm: {
                    type: "text",
                    text: "restaurante_url"
                }
            },
            date: {
                message_to_confirm: async (bot, event, context, resolve, reject) => {
                    let bc = await web.init_browser_context(bot.extract_sender_id());
                    let p = await web.init_page(bc);
                    cache.put(`pptr_page_${bot.extract_sender_id()}`, p, PPTR_BROWSER_CONTEXT_RETENTION);

                    context.confirmed.available_date = await web.get_available_date(p, context.confirmed.restaurante_url);

                    let message = flex.available_date_message(context.confirmed.available_date);
                    return resolve(message);
                },
                parser: (value, bot, event, context, resolve, reject) => {
                    if (typeof value === "object" && value.data){
                        let date = JSON.parse(value.data);
                        if (context.confirmed.available_date.find(available_date => available_date.month == date.month && available_date.day == date.day)){
                            return resolve(date);
                        }
                    }
                    return reject();
                },
                reaction: async (error, value, bot, event, context, resolve, reject) => {
                    if (error) return resolve();

                    // Click the date

                    let p = cache.get(`pptr_page_${bot.extract_sender_id()}`);
                    try {
                        await web.click_date(p, value);
                    } catch (e) {
                        return reject(e);
                    }

                    return resolve();
                }
            },
            seats: {
                message_to_confirm: async (bot, event, context, resolve, reject) => {
                    let p = cache.get(`pptr_page_${bot.extract_sender_id()}`);
                    let option_selector = `p.p-booking-calendar__select-target > select.js-svps > option`;
                    await p.waitForSelector(option_selector);
                    let option_list = await p.$$(option_selector);

                    context.confirmed.available_seats = [];
                    for (let option of option_list){

                        let label = await (await option.getProperty("textContent")).jsonValue();
                        debug(label);
                        if (label.match(/○/)){
                            context.confirmed.available_seats.push(await (await option.getProperty("value")).jsonValue());
                        }
                    }

                    let message = flex.seats_message(context.confirmed.available_seats);
                    return resolve(message);
                },
                parser: (value, bot, event, context, resolve, reject) => {
                    if (typeof value == "object" && value.data){
                        value = String(value.data);
                    } else if (typeof value == "number"){
                        value = String(value);
                    } else if (typeof value != "string"){
                        return reject();
                    }

                    if (context.confirmed.available_seats.includes(value)){
                        return resolve(value);
                    }

                    return reject();
                },
                reaction: async (error, value, bot, event, context, resolve, reject) => {
                    if (error) return resolve();

                    let p = cache.get(`pptr_page_${bot.extract_sender_id()}`);
                    await p.waitForSelector(`p.p-booking-calendar__select-target > select.js-svps`);
                    await p.select(`p.p-booking-calendar__select-target > select.js-svps`, value);

                    return resolve();
                }
            },
            time: {
                message_to_confirm: async (bot, event, context, resolve, reject) => {
                    let p = cache.get(`pptr_page_${bot.extract_sender_id()}`);
                    let option_selector = `p.p-booking-calendar__select-target > select.js-svt > option`;
                    await p.waitForSelector(option_selector);
                    let option_list = await p.$$(option_selector);

                    context.confirmed.available_time = [];
                    for (let option of option_list){

                        let label = await (await option.getProperty("textContent")).jsonValue();
                        debug(label);
                        if (label.match(/○/)){
                            context.confirmed.available_time.push(await (await option.getProperty("value")).jsonValue());
                        }
                    }

                    let message = flex.time_message(context.confirmed.available_time);
                    return resolve(message);
                },
                parser: (value, bot, event, context, resolve, reject) => {
                    if (typeof value == "object" && value.data){
                        value = String(value.data);
                    } else if (typeof value == "number"){
                        value = String(value);
                    } else if (typeof value != "string"){
                        return reject();
                    }

                    if (context.confirmed.available_time.includes(value)){
                        return resolve(value);
                    }

                    return reject();
                },
                reaction: async (error, value, bot, event, context, resolve, reject) => {
                    if (error) return resolve();

                    let p = cache.get(`pptr_page_${bot.extract_sender_id()}`);
                    await p.waitForSelector(`p.p-booking-calendar__select-target > select.js-svt`, {
                        timeout: 1000
                    });
                    await p.select(`p.p-booking-calendar__select-target > select.js-svt`, value);

                    // Click "予約する" button to go to contact form.
                    await p.waitForSelector(`a.js-booking-form-open`, {
                        timeout: 1000
                    });
                    await p.click(`a.js-booking-form-open`);

                    // Go to contact form.
                    let url = await (await (await p.$(`a.js-booking-form-open`)).getProperty("href")).jsonValue();
                    await p.goto(url);

                    return resolve();
                }
            },
            lastname: {
                message_to_confirm: {
                    type: "text",
                    text: `お名前（姓）をお願いします。`
                },
                parser: (value, bot, event, context, resolve, reject) => {
                    if (typeof value != "string") return reject();

                    return resolve(value);
                }
            },
            firstname: {
                message_to_confirm: {
                    type: "text",
                    text: `お名前（名）をお願いします。`
                },
                parser: (value, bot, event, context, resolve, reject) => {
                    if (typeof value != "string") return reject();

                    return resolve(value);
                }
            },
            lastname_kana: {
                message_to_confirm: {
                    type: "text",
                    text: `お名前（姓）のよみがなをお願いします。`
                },
                parser: (value, bot, event, context, resolve, reject) => {
                    if (typeof value != "string") return reject();

                    let hiragana_value = wanakana.toHiragana(value);
                    if (wanakana.isHiragana(hiragana_value)){
                        return resolve(hiragana_value);
                    }

                    return reject();
                }
            },
            firstname_kana: {
                message_to_confirm: {
                    type: "text",
                    text: `お名前（名）のよみがなをお願いします。`
                },
                parser: (value, bot, event, context, resolve, reject) => {
                    if (typeof value != "string") return reject();

                    let hiragana_value = wanakana.toHiragana(value);
                    if (wanakana.isHiragana(hiragana_value)){
                        return resolve(hiragana_value);
                    }

                    return reject();
                }
            },
            phone: {
                message_to_confirm: {
                    type: "text",
                    text: `お電話番号をお願いします。＊ハイフンなし`
                },
                parser: (value, bot, event, context, resolve, reject) => {
                    if (typeof value != "string") return reject();

                    value = value.replace(/-/g, "").replace(/ /g, "");
                    if (value.match(/^\d{9}$/) || value.match(/^\d{10}$/) || value.match(/^\d{11}$/)){
                        return resolve(value);
                    }

                    return resolve(value);
                }
            },
            email: {
                message_to_confirm: {
                    type: "text",
                    text: `Emailをお願いします。`
                },
                parser: (value, bot, event, context, resolve, reject) => {
                    if (typeof value != "string") return reject();

                    if (value.match(/^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/)) {
                        return resolve(value);
                    }

                    return reject();
                }
            }
        }
    }

    async finish(bot, event, context, resolve, reject){
        const contact_field_list = [{
            selector: "#sei",
            param: "lastname",
        },{
            selector: "#mei",
            param: "firstname",
        },{
            selector: "#sei_kana",
            param: "lastname_kana",
        },{
            selector: "#mei_kana",
            param: "firstname_kana",
        },{
            selector: "#tel",
            param: "phone"
        },{
            selector: "#mail_address",
            param: "email"
        }]

        // Input contact fields.
        let p = cache.get(`pptr_page_${bot.extract_sender_id()}`);
        for (let f of contact_field_list){
            await p.waitForSelector(f.selector);
            await p.type(f.selector, context.confirmed[f.param]);
        }

        // Opt out mail magazine.
        let opt_out_label = await p.waitForSelector(`#js-booking-info > div.booking-modal__mail > div > label`);
        await opt_out_label.click();

        // Click submit button.
        /*
        await p.waitForSelector(`#js-booking-info > div.booking-modal__submit-wrap > button`);
        await Promise.all([
            p.waitForNavigation({
                timeout: PPTR_NAVIGATION_TIMEOUT
            }),
            p.click(`#js-booking-info > div.booking-modal__submit-wrap > button`)
        ])
        */

        await bot.reply({
            type: "text",
            text: "予約完了です！"
        })

        // Update user information.
        let user = {};
        for (let f of contact_field_list){
            if (context.confirmed[f.param]){
                user[f.param] = context.confirmed[f.param];
            }
        }
        debug(`Upserting user..`);
        await user_db.upsert_user(bot.extract_sender_id(), user);
        debug(`Upserted.`);

        if (process.env.BOT_EXPRESS_ENV != "test"){
            await web.close_browser_context(bot.extract_sender_id());
        }

        return resolve();
    }
}

module.exports = SkillReserveRestaurante;
