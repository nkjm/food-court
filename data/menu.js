"use strict";

module.exports = [{
    label: "豚玉",
    image: "https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_2_restaurant.png",
    price: 700
},{
    label: "豚玉モダン焼き",
    image: "https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_2_restaurant.png",
    price: 850
},{
    label: "いか玉",
    image: "https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_2_restaurant.png",
    price: 700
},{
    label: "いか玉モダン焼き",
    image: "https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_2_restaurant.png",
    price: 850
},{
    label: "焼きそば",
    image: "https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_2_restaurant.png",
    price: 800,
    option: {
        size: {
            multiple: false,
            option: ["中", "大"]
        },
        topping: {
            multiple: true,
            option: ["キムチまぜ", "ねぎかけ"]
        }
    }
},{
    label: "生ビール",
    image: "https://scdn.line-apps.com/n/channel_devcenter/img/fx/01_2_restaurant.png",
    price: 500
}]
