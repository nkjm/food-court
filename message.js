"use strict";

class WaiterMessage {
    constructor(){
        // Menu

        // Confirm order and ask anything else

        // Review order
        this.review_order = {
            type: "flex",
            altText: `ご注文はこちらの内容でよろしいでしょうか？`,
            contents: {
                type: "bubble",
                body: {
                    type: "box",
                    layout: "vertical",
                    spacing: "md",
                    contents: [{
                        type: "text",
                        text: `ご注文はこちらの内容でよろしいでしょうか？`,
                        wrap: true
                    },{
                        type: "separator",
                        margin: "xl",
                    },{
                        type: "box",
                        layout: "vertical",
                        margin: "xl",
                        spacing: "md",
                        contents: [{
                            type: "box",
                            layout: "baseline",
                            contents: [{
                                type: "text",
                                text: `豚玉`,
                                size: "xs",
                                color: "#666666",
                                wrap: true,
                                flex: 0
                            },{
                                type: "text",
                                text: `（2個）`,
                                size: "xs",
                                color: "#666666",
                            },{
                                type: "text",
                                text: `1400円`,
                                size: "md",
                                align: "end"
                            }]
                        },{
                            type: "box",
                            layout: "baseline",
                            contents: [{
                                type: "text",
                                text: `げそ塩焼き`,
                                size: "xs",
                                color: "#666666",
                                wrap: true,
                                flex: 0
                            },{
                                type: "text",
                                text: `（1個）`,
                                size: "xs",
                                color: "#666666",
                            },{
                                type: "text",
                                text: `650円`,
                                size: "md",
                                align: "end"
                            }]
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
                                text: `2050円`,
                                size: "xxl",
                                align: "end"
                            }]
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

        // Delete order item

        // Payment
    }

    j(message){
        return JSON.stringify(this[message]);
    }
}

module.exports = new WaiterMessage();
