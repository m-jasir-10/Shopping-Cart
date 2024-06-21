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
    }
};