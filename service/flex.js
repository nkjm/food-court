"use strict";

const debug = require("debug");

class ServiceFlex {

    /**
    Message for receipt
    @method
    @param {Array.<order_item>} order_item_list
    @return {FlexMessageObject}
    */
    static receipt_message(order_item_list){
        let total_amount = 0;
        let order_item_contents = [];
        for (let i of order_item_list){
            order_item_contents.push({
                type: "box",
                layout: "baseline",
                contents: [{
                    type: "text",
                    text: i.label,
                    size: "xs",
                    color: "#666666",
                    wrap: true,
                    flex: 0
                },{
                    type: "text",
                    text: `（${String(i.quantity)}個）`,
                    size: "xs",
                    color: "#666666",
                },{
                    type: "text",
                    text: `${String(i.amount)}円`,
                    size: "md",
                    align: "end"
                }]
            })
            total_amount += i.amount;
        }

        let message = {
            type: "flex",
            altText: "領収証",
            contents: {
                type: "bubble",
                body: {
                    type: "box",
                    layout: "vertical",
                    spacing: "xl",
                    contents: [{
                        type: "text",
                        text: "領収証",
                        weight: "bold",
                        size: "sm",
                        color: "#1DB446"
                    },{
                        type: "text",
                        text: "飲食費",
                        weight: "bold",
                        size: "xl",
                    },{
                        type: "separator"
                    },{
                        type: "box",
                        layout: "vertical",
                        spacing: "md",
                        contents: order_item_contents
                    },{
                        type: "separator"
                    },{
                        type: "box",
                        layout: "baseline",
                        contents: [{
                            type: "text",
                            text: `合計`,
                            size: "md",
                            color: "#000000",
                            wrap: true,
                            flex: 0
                        },{
                            type: "text",
                            text: `${String(total_amount)}円`,
                            size: "xxl",
                            align: "end"
                        }]
                    }]
                }
            }
        } // End of message

        return message;
    }

    /**
    Message to show menu
    @method
    @param {Object} menu
    @param {String} menu.label
    @param {String} menu.image
    @param {Number} menu.price
    */
    static menu_bubble(menu){
        let o = menu;
        const quantity_threshold = 4;

        let bubble = {
            type: "bubble",
            hero: {
                type: "image",
                url: o.image,
                size: "full",
                aspectRatio: "20:13",
                aspectMode: "cover"
            },
            body: {
                type: "box", // Contains label, quantity and amount.
                layout: "vertical",
                spacing: "md",
                contents: [{
                    type: "text", // label
                    text: o.label,
                    size: "xl",
                    weight: "bold"
                },{
                    type: "separator"
                },{
                    type: "box", // Contains price
                    layout: "horizontal",
                    spacing: "xl",
                    contents: [{
                        type: "box", // price.
                        layout: "baseline",
                        contents: [{
                            type: "text",
                            text: `金額`,
                            color: "#999999",
                            size: "sm",
                            flex: 0
                        },{
                            type: "text",
                            text: `${String(o.price)}円`,
                            size: "lg",
                            align: "end"
                        }]
                    }]
                },{
                    type: "separator"
                }]
            },
            footer: {
                type: "box", // Contains select button
                layout: "vertical",
                spacing: "md",
                contents: [{
                    type: "box",
                    layout: "horizontal",
                    spacing: "sm",
                    contents: []
                },{
                    type: "button",
                    style: "secondary",
                    height: "sm",
                    action: {
                        type: "postback",
                        label: `${String(quantity_threshold + 1)}個以上`,
                        displayText: `${o.label}を${String(quantity_threshold + 1)}個以上`,
                        data: JSON.stringify({
                            label: o.label
                        })
                    }
                }]
            }
        }

        let i = 0;
        for (let a of Array(quantity_threshold)){
            i++;
            bubble.footer.contents[0].contents.push({
                type: "button",
                style: "primary",
                height: "sm",
                action: {
                    type: "postback",
                    label: `${String(i)}個`,
                    displayText: `${o.label}を${String(i)}個`,
                    data: JSON.stringify({
                        label: o.label,
                        quantity: i
                    })
                }
            })
        }

        return bubble;
    }

    /**
    Message having text and multiple horizontaly located button
    @method
    @param {Object} options
    @param {String} options.message_text
    @param {Array.<ActionObject>} option.action_list
    @return {FlexMessageObject}
    */
    static multi_button_message(options){
        let o = options;

        let message = {
            type: "flex",
            altText: o.message_text,
            contents: {
                type: "bubble",
                body: {
                    type: "box",
                    layout: "vertical",
                    contents: [{
                        type: "text",
                        text: o.message_text,
                        wrap: true
                    }]
                },
                footer: {
                    type: "box",
                    layout: "horizontal",
                    spacing: "sm",
                    contents: []
                }
            }
        }

        for (let action of o.action_list){
            message.contents.footer.contents.push({
                type: "button",
                style: "link",
                height: "sm",
                action: action
            })
        }

        return message;
    }

    /**
    Object expresses order item
    @typedef {Object} order_item
    @prop {String} label
    @prop {String} image
    @prop {Number} quantity
    @prop {Number} amount
    */

    /**
    Message to review order
    @method
    @param {Array.<order_item>} order_item_list
    @return {FlexMessageObject}
    */
    static review_message(order_item_list){

        let total_amount = 0;
        let order_item_contents = [];
        for (let i of order_item_list){
            order_item_contents.push({
                type: "box",
                layout: "baseline",
                contents: [{
                    type: "text",
                    text: i.label,
                    size: "xs",
                    color: "#666666",
                    wrap: true,
                    flex: 0
                },{
                    type: "text",
                    text: `（${String(i.quantity)}個）`,
                    size: "xs",
                    color: "#666666",
                },{
                    type: "text",
                    text: `${String(i.amount)}円`,
                    size: "md",
                    align: "end"
                }]
            })
            total_amount += i.amount;
        }

        let message = {
            type: "flex",
            altText: `ご注文はこちらの内容でよろしいでしょうか？`,
            contents: {
                type: "bubble",
                body: {
                    type: "box",
                    layout: "vertical",
                    spacing: "xl",
                    contents: [{
                        type: "text",
                        text: `ご注文はこちらの内容でよろしいでしょうか？`,
                        wrap: true
                    },{
                        type: "separator",
                    },{
                        type: "box",
                        layout: "vertical",
                        spacing: "md",
                        contents: order_item_contents
                    },{
                        type: "box",
                        layout: "baseline",
                        contents: [{
                            type: "text",
                            text: `合計`,
                            size: "md",
                            color: "#000000",
                            wrap: true,
                            flex: 0
                        },{
                            type: "text",
                            text: `${String(total_amount)}円`,
                            size: "xxl",
                            align: "end"
                        }]
                    }]
                }, // End of body
                footer: {
                    type: "box",
                    layout: "vertical",
                    spacing: "md",
                    contents: [{
                        type: "button",
                        style: "primary",
                        height: "sm",
                        action: {
                            type: "message",
                            label: "会計",
                            text: "会計"
                        }
                    },{
                        type: "box",
                        layout: "horizontal",
                        spacing: "md",
                        contents: [{
                            type: "button",
                            style: "secondary",
                            height: "sm",
                            action: {
                                type: "message",
                                label: "訂正",
                                text: "訂正"
                            }
                        },{
                            type: "button",
                            style: "secondary",
                            height: "sm",
                            action: {
                                type: "message",
                                label: "追加",
                                text: "追加"
                            }
                        }]
                    }]
                }
            }
        }

        return message;
    }

    /**
    Bubble to cancel order item
    @method
    @param {order_item} order_item
    @return {FlexBubble}
    */
    static cancel_order_item_bubble(order_item){
        let o = order_item;

        let bubble = {
            type: "bubble",
            hero: {
                type: "image",
                url: o.image,
                size: "full",
                aspectRatio: "20:13",
                aspectMode: "cover"
            },
            body: {
                type: "box", // Contains label, quantity and amount.
                layout: "vertical",
                spacing: "md",
                contents: [{
                    type: "text", // label
                    text: o.label,
                    size: "xl",
                    weight: "bold"
                },{
                    type: "separator"
                },{
                    type: "box", // Contains quantity and amount.
                    layout: "horizontal",
                    spacing: "xl",
                    contents: [{
                        type: "box", // quantity.
                        layout: "baseline",
                        contents: [{
                            type: "text",
                            text: `数量`,
                            color: "#999999",
                            size: "sm",
                            flex: 0
                        },{
                            type: "text",
                            text: `${String(o.quantity)}個`,
                            size: "lg",
                            align: "end"
                        }]
                    },{
                        type: "separator"
                    },{
                        type: "box", // amount.
                        layout: "baseline",
                        contents: [{
                            type: "text",
                            text: `金額`,
                            color: "#999999",
                            size: "sm",
                            flex: 0
                        },{
                            type: "text",
                            text: `${String(o.amount)}円`,
                            size: "lg",
                            align: "end"
                        }]
                    }]
                },{
                    type: "separator"
                }]
            },
            footer: {
                type: "box", // Contains cancel button
                layout: "vertical",
                contents: [{
                    type: "button",
                    style: "primary",
                    color: "#ff0000",
                    action: {
                        type: "message",
                        label: "取り消し",
                        text: `${o.label}`
                    }
                }]
            }
        }

        return bubble;
    }

    /**
    Message to pay
    @method
    */


    /**
    Carousel message
    @method
    @param {String} bubble_type - internal static method which is defined in this class
    @param {String} alt_text
    @param {Array.<options>}
    @return {Object} flex message object
    */
    static carousel_message(bubble_type, alt_text, option_list){
        let message = {
            type: "flex",
            altText: alt_text,
            contents: {
                type: "carousel",
                contents: []
            }
        }
        for (let option of option_list){
            message.contents.contents.push(ServiceFlex[`${bubble_type}_bubble`](option));
            if (message.contents.contents.length == 10){
                debug(`Number of contents is now 10 so we omit rest of option list.`);
                break;
            }
        }

        return message;
    }


    static test(message){
        const option = require(`../flex_test_data/${message}`);
        return JSON.stringify(ServiceFlex[message](option));
    }
}

module.exports = ServiceFlex;
