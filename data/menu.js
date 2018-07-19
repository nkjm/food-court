"use strict";

module.exports = [{
    label: "豚玉",
    image: "https://line-objects-dev.com/waiter/menu/butatama.jpg",
    price: 700
},{
    label: "豚玉モダン焼き",
    image: "https://line-objects-dev.com/waiter/menu/modern.jpg",
    price: 850
},{
    label: "焼きそば",
    image: "https://line-objects-dev.com/waiter/menu/yakisoba.jpg",
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
    image: "https://line-objects-dev.com/waiter/menu/beer.jpg",
    price: 500
}]
