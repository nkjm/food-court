"use strict";

module.exports = [{
    label: {
        en: "Okonomiyaki",
        ja: "豚玉"
    },
    image: "https://line-objects-dev.com/waiter/menu/butatama.jpg",
    price: 700
},{
    label: {
        en: "Okonomiyaki with fried noodle",
        ja: "豚玉モダン焼き"
    },
    image: "https://line-objects-dev.com/waiter/menu/modern.jpg",
    price: 850
},{
    label: {
        en: "Fried noodle",
        ja: "焼きそば"
    },
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
    label: {
        en: "Beer",
        ja: "生ビール"
    },
    image: "https://line-objects-dev.com/waiter/menu/beer.jpg",
    price: 500
}]
