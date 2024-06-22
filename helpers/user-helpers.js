const db = require('../config/connection');
const collection = require('../config/collections');
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');
const collections = require('../config/collections');

module.exports = {
    doSignup: (userData) => {
        return new Promise(async (resolve, reject) => {
            if (!userData.name || !userData.email || !userData.password) {
                return resolve({ status: false, message: 'All fields are required' });
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(userData.email)) {
                return resolve({ status: false, message: 'Invalid email format' });
            }

            if (userData.password.length < 6) {
                return resolve({ status: false, message: 'Password must be at least 6 characters long' });
            }

            let user = await db.get().collection(collections.USER_COLLECTION).findOne({ email: userData.email });
            if (user) {
                resolve({ status: false, message: 'Email already exists' });
            } else {
                userData.password = await bcrypt.hash(userData.password, 10);
                db.get().collection(collections.USER_COLLECTION).insertOne(userData)
                    .then((data) => {
                        resolve(data.insertedId);
                    });
            }
        })
    },

    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            if (!userData.email || !userData.password) {
                return resolve({ status: false, message: 'All fields are required' });
            }

            let response = {};
            let user = await db.get().collection(collections.USER_COLLECTION).findOne({ email: userData.email });
            if (user) {
                bcrypt.compare(userData.password, user.password)
                    .then((status) => {
                        if (status) {
                            console.log('login success');
                            resolve({ status: true, user });
                        } else {
                            console.log('login failed');
                            resolve({ status: false, message: 'Invalid email or password' });
                        }
                    })
            } else {
                console.log('login failed');
                resolve({ status: false, message: 'Invalid email or password' });
            }
        });
    },

    addToCart: (productId, userId) => {
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collections.CART_COLLECTION).findOne({ user: new ObjectId(userId) });
            if (userCart) {
                db.get().collection(collections.CART_COLLECTION)
                    .updateOne({ user: new ObjectId(userId) },
                        {
                            $push: { products: new ObjectId(productId) }
                        }
                    ).then((response) => {
                        resolve();
                    });
            } else {
                let cartObj = {
                    user: new ObjectId(userId),
                    products: [new ObjectId(productId)]
                };
                db.get().collection(collections.CART_COLLECTION).insertOne(cartObj)
                    .then((response) => {
                        resolve();
                    });
            }
        });
    },

    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collections.CART_COLLECTION).aggregate([
                {
                    $match: {
                        user: new ObjectId(userId)
                    }
                },
                {
                    $lookup: {
                        from: collections.PRODUCT_COLLECTION,
                        let: {
                            productList: '$products'
                        },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $in: ['$_id', '$$productList']
                                    }
                                }
                            }
                        ],
                        as: 'cartItems'
                    }
                }
            ]).toArray();
            resolve(cartItems[0]?.cartItems || []);
        });
    },

    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0;
            let cart = await db.get().collection(collections.CART_COLLECTION).findOne({ user: new ObjectId(userId) });
            if (cart) {
                count = cart.products.length;
            }
            console.log(count);
            resolve(count);
        })
    }
};