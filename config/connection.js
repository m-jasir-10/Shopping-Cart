const { MongoClient } = require('mongodb');
const state = {
    db: null,
};

module.exports = {
    connect: async (done) => {
        try {
            const url = process.env.MONGO_URL;
            const dbName = 'shopping-cart';
            const client = new MongoClient(url);

            await client.connect();
            state.db = client.db(dbName);
            done(null);
        } catch (err) {
            done(err);
        };
    },

    get: () => {
        return state.db;
    }
};
