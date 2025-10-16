// File: scripts/migrate-add-defaults-investments.js
require('dotenv').config();
const { MongoClient } = require('mongodb');

(async () => {
  const uri = process.env.MONGODB_URI;
  const dbName = (process.env.MONGO_DB_NAME) || (() => {
    try {
      const m = uri.match(/\/([^/?]+)(\?|$)/);
      return m ? m[1] : 'chrenis';
    } catch (e) { return 'chrenis'; }
  })();

  if (!uri) {
    console.error('MONGODB_URI missing in .env');
    process.exit(1);
  }

  const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

  try {
    await client.connect();
    const db = client.db(dbName);
    const coll = db.collection('investments');
    console.log('Connected to DB:', db.databaseName);

    const now = new Date();

    const res1 = await coll.updateMany(
      { currency: { $exists: false } },
      { $set: { currency: 'NGN' } }
    );
    console.log(`currency default set on ${res1.modifiedCount} docs (where missing)`);

    const res2 = await coll.updateMany(
      { createdAt: { $exists: false } },
      { $set: { createdAt: now } }
    );
    console.log(`createdAt set on ${res2.modifiedCount} docs (where missing)`);

    const res3 = await coll.updateMany(
      { transactions: { $exists: false } },
      { $set: { transactions: [] } }
    );
    console.log(`transactions array set on ${res3.modifiedCount} docs (where missing)`);

    const res4 = await coll.updateMany(
      { status: { $exists: false } },
      { $set: { status: 'active' } }
    );
    console.log(`status default set on ${res4.modifiedCount} docs (where missing)`);

    console.log('Migration complete.');
    await client.close();
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
})();
