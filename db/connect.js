// db/connect.js
const { MongoClient } = require('mongodb');
require('dotenv').config();

let _client = null;
let _db = null;

async function initDb() {
  if (_db) {
    console.log('Database already initialized');
    return _db;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set in environment');

  const client = new MongoClient(uri, { useUnifiedTopology: true });
  await client.connect();
  const db = client.db(); // uses DB from URI or default
  _client = client;
  _db = db;
  console.log('Connected to MongoDB:', _db.databaseName);
  return _db;
}

function getDb() {
  if (!_db) throw new Error('Database not initialized. Call initDb first.');
  return _db;
}

function getClient() {
  if (!_client) throw new Error('MongoClient not initialized. Call initDb first.');
  return _client;
}

module.exports = { initDb, getDb, getClient };
