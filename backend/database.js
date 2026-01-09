// MongoDB connection handler (singleton pattern for Lambda connection reuse)
const { MongoClient } = require('mongodb');
const config = require('./config');

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
    if (cachedDb) {
        return cachedDb;
    }

    const client = new MongoClient(config.MONGODB_URI);

    await client.connect();
    cachedClient = client;
    cachedDb = client.db(config.DATABASE_NAME);

    // Create indexes for better performance
    await cachedDb.collection('users').createIndex({ username: 1 }, { unique: true });
    await cachedDb.collection('users').createIndex({ email: 1 }, { unique: true });
    await cachedDb.collection('entries').createIndex({ user_id: 1 });
    await cachedDb.collection('entries').createIndex({ title: 'text', content: 'text' });
    await cachedDb.collection('tags').createIndex({ user_id: 1 });

    console.log('Connected to MongoDB');
    return cachedDb;
}

async function getCollection(name) {
    const db = await connectToDatabase();
    return db.collection(name);
}

module.exports = { connectToDatabase, getCollection };
