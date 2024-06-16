const db = require('../config/connection')
const collections = require("../config/collections");
const { ObjectId } = require('mongodb');

module.exports = {
    addProduct: (product) => {
        console.log(product);
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION).insertOne(product)
                .then((data) => {
                    resolve(data.insertedId);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    },

    updateProductImage: (productId, imagePath) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION).updateOne(
                { _id: new ObjectId(productId) },
                { $set: { image: imagePath } }
            )
                .then((response) => {
                    resolve(response);
                })
                .catch((err) => {
                    reject(err);
                });
        });
    }

    
};