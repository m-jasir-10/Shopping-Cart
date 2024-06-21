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
    },

    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            try {
                const products = await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray();
                resolve(products);
            } catch (err) {
                reject(err);
            }
        });
    },

    deleteProduct: (productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION).deleteOne({ _id: new ObjectId(productId) })
                .then((response) => {
                    resolve(response);
                });
        });
    },

    getProductDetails: (productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION).findOne({ _id: new ObjectId(productId) })
                .then((product) => {
                    resolve(product);
                });
        });
    },

    updateProduct: (productId, product) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION)
                .updateOne({ _id: new ObjectId(productId) }, {
                    $set: {
                        name: product.name,
                        description: product.description,
                        price: product.price,
                        category: product.category
                    }
                }).then((response) => {
                    resolve();
                });
        });
    }
};