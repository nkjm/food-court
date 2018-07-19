"use strict";

const cache = require("memory-cache");

/**
Implementation of user-db using memory-cache.
@class
*/
class ServiceOrderDbMemoryCache {
    /**
    @constructor
    */
    constructor(){
        this.client = cache;
    }

    async get_order_list(){
        return new Promise((resolve, reject) => {
            try {
                let order_list = this.client.get(`order_list`);
                return resolve(order_list);
            } catch(e) {
                return reject(e);
            }
        })
    }

    async save_order(order){
        return new Promise((resolve, reject) => {
            try {
                let order_list = this.client.get(`order_list`);
                if (!order_list){
                    order_list = [];
                }
                order_list.push(order);
                this.client.put(`order_list`, order_list);
                return resolve();
            } catch(e) {
                return reject(e);
            }
        })
    }

    async delete_order(order_id){
        return new Promise((resolve, reject) => {
            try {
                let order_list = this.client.get(`order_list`);

                if (order_list && order_list.length > 0){
                    let i = 0;
                    for (let order of order_list){
                        if (order.id === order_id){
                            order_list.splice(i, 1);
                        }
                        i++;
                    }
                }

                this.client.put(`order_list`, order_list);
                return resolve();
            } catch(e) {
                return reject(e);
            }
        })
    }

    async close(){
        // memory-cache does not have to close connection so this is dummy.
        return Promise.resolve();
    }
}

module.exports = new ServiceOrderDbMemoryCache();
