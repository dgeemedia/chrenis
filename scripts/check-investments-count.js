// File: scripts/check-investments-count.js
require('dotenv').config();
const { MongoClient } = require('mongodb');

(async () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) { console.error('MONGODB_URI missing'); process.exit(1); }
  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
  await client.connect();
  const dbName = (process.env.MONGO_DB_NAME) || (() => {
    try { return uri.match(/\/([^/?]+)(\?|$)/)[1]; } catch (e) { return 'chrenis'; }
  })();
  const db = client.db(dbName);
  const cnt = await db.collection('investments').countDocuments();
  console.log(`investments count: ${cnt}`);
  const one = await db.collection('investments').findOne({});
  console.log('example doc keys:', one ? Object.keys(one) : 'no docs');
  await client.close();
})();
