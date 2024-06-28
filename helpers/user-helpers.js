const db = require('../config/connection');
const bcrypt = require('bcrypt');
const { ObjectId } = require('mongodb');
const collections = require('../config/collections');
const moment = require('moment');

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
                        resolve({ status: true, user: data.insertedId });
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
                            resolve({ status: false, message: 'Try Again!! Invalid password.' });
                        }
                    })
            } else {
                console.log('login failed');
                resolve({ status: false, message: 'Invalid email' });
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
                    .then(() => {
                        resolve();
                    });
            }
        });
    },

    getCartProduct: (userId) => {
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
            console.log(cartItems);
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

            resolve(cart.length > 0 ? cart[0].totalQuantity : 0);
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
                .then(async () => {
                    resolve({ removeProduct: true });
                });
        });
    },

    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collections.CART_COLLECTION).findOne({ user: new ObjectId(userId) });
            let totalPrice = await db.get().collection(collections.CART_COLLECTION).aggregate([
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
                },
                {
                    $project: {
                        item: 1,
                        quantity: 1,
                        product: {
                            _id: 1,
                            price: { $toDouble: '$product.price' }
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalPrice: { $sum: { $multiply: ['$quantity', '$product.price'] } }
                    }
                }
            ]).toArray();
            resolve(
                totalPrice.length > 0 ? totalPrice[0].totalPrice : 0
            )

        });
    },

    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartProducts = await db.get().collection(collections.CART_COLLECTION).aggregate([
                {
                    $match: { user: new ObjectId(userId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $lookup: {
                        from: collections.PRODUCT_COLLECTION,
                        localField: 'products.item',
                        foreignField: '_id',
                        as: 'product'
                    }
                },
                {
                    $replaceRoot: {
                        newRoot: {
                            $mergeObjects: [{ $arrayElemAt: ['$product', 0] }, '$products']
                        }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        name: 1,
                        description: 1,
                        category: 1,
                        price: 1,
                        quantity: 1,
                        image: 1
                    }
                }
            ]).toArray();
            resolve(cartProducts);
        });
    },

    placeOrder: (order, products, totalPrice) => {
        return new Promise((resolve, reject) => {
            let status = order['payment-method'] === 'COD' ? 'placed' : 'pending';
            let orderObj = {
                userId: new ObjectId(order.userId),
                name: order.name,
                email: order.email,
                deliveryDetails: {
                    address: order.address,
                    city: order.city,
                    state: order.state,
                    country: order.country,
                    pincode: order.pincode,
                    mobile: order.mobile,
                },
                paymentMethod: order['payment-method'],
                totalPrice: totalPrice,
                products: products,
                orderDate: moment().format('DD-MM-YYYY'),
                orderTime: moment().format('hh:mm:ss A'),
                status: status
            };
            db.get().collection(collections.ORDER_COLLECTION).insertOne(orderObj).then(() => {
                db.get().collection(collections.CART_COLLECTION).deleteOne({ user: new ObjectId(order.userId) });
                resolve();
            });
        });
    },

    getUserOrderDetails: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collections.ORDER_COLLECTION).find({ userId: new ObjectId(userId) }).toArray();
            resolve(orders);
        });
    },

    updateProfile: (userId, userData) => {
        return new Promise(async (resolve, reject) => {
            let updateObject = {
                $set: {
                    name: userData.name,
                    email: userData.email
                }
            };

            if (userData.password) {
                let hashedPassword = await bcrypt.hash(userData.password, 10);
                updateObject.$set.password = hashedPassword;
            }

            let response = await db.get().collection(collections.USER_COLLECTION)
                .updateOne({ _id: new ObjectId(userId) },
                    updateObject
                );

            if (response.modifiedCount > 0) {
                resolve({ status: true, message: 'Profile updated successfully' });
            } else {
                resolve({ status: false, message: 'Failed to update profile' });
            }
        });
    }
};



