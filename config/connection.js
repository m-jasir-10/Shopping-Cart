const { MongoClient } = require('mongodb');
const state = {
    db: null,
};

module.exports = {
    connect: async (done) => {
        try {
            const url = 'mongodb://localhost:27017';
            const dbName = 'shopping';
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
