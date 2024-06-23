const db = require('../config/connection');
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
        let productObj = {
            item: new ObjectId(productId),
            quantity: 1
        };

        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collections.CART_COLLECTION).findOne({ user: new ObjectId(userId) });
            if (userCart) {
                let productExist = userCart.products.findIndex(product => product.item == productId);

                if (productExist != -1) {
                    db.get().collection(collections.CART_COLLECTION)
                        .updateOne({ user: new ObjectId(userId), 'products.item': new ObjectId(productId) },
                            {
                                $inc: { 'products.$.quantity': 1 }
                            }
                        ).then(() => {
                            resolve();
                        });
                } else {
                    db.get().collection(collections.CART_COLLECTION)
                        .updateOne({ user: new ObjectId(userId) },
                            {
                                $push: { products: productObj }
                            }
                        ).then(() => {
                            resolve();
                        });
                }
            } else {
                let cartObj = {
                    user: new ObjectId(userId),
                    products: [productObj]
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
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collections.PRODUCT_COLLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: {
                            $arrayElemAt: ['$product', 0]
                        }
                    }
                }
            ]).toArray();
            resolve(cartItems);
        });
    },

    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0;
            let cart = await db.get().collection(collections.CART_COLLECTION).aggregate([
                {
                    $match: { user: new ObjectId(userId) }
                },
                {
                    $project: {
                        totalQuantity: { $sum: '$products.quantity' }
                    }
                }
            ]).toArray();

            if (cart.length > 0) {
                count = cart[0].totalQuantity;
            }
            console.log(count);
            resolve(count);
        });
    },

    changeProductQuantity: (details) => {
        count = parseInt(details.count);
        quantity = parseInt(details.quantity);

        return new Promise((resolve, reject) => {
            if (count == -1 && quantity == 1) {
                db.get().collection(collections.CART_COLLECTION)
                    .updateOne({ _id: new ObjectId(details.cart) },
                        {
                            $pull: { products: { item: new ObjectId(details.product) } }
                        }
                    )
                    .then((response) => {
                        resolve({ removeProduct: true })
                    });
            } else {
                db.get().collection(collections.CART_COLLECTION)
                    .updateOne({ _id: new ObjectId(details.cart), 'products.item': new ObjectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': count }
                        }
                    ).then((response) => {
                        resolve({ status: true });
                    });
            }
        });
    },

    removeProductFromCart: (details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.CART_COLLECTION)
                .updateOne({ _id: new ObjectId(details.cart) },
                    {
                        $pull: { products: { item: new ObjectId(details.product) } }
                    }
                )
                .then(async (response) => {
                    resolve({ removeProduct: true });
                });
        });
    }
};


