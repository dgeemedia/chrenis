// File: scripts/ensureInvestmentValidator.js
require('dotenv').config();
const { MongoClient } = require('mongodb');

(async () => {
  const uri = process.env.MONGODB_URI;
  const dbName = (process.env.MONGO_DB_NAME) || (() => {
    // if your connection string has a DB (e.g. mongodb+srv://.../chrenis?...),
    // it's safe to leave dbName undefined and use the DB in the URI. But to be explicit:
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
    console.log(`Connected to ${db.databaseName}`);

    const cmd = {
      collMod: "investments",
      validator: {
        $jsonSchema: {
          bsonType: "object",
          required: ["userId","projectId","amount","currency","maturityDate","status","createdAt"],
          properties: {
            userId: { bsonType: ["objectId","string"], description: "owner user id" },
            projectId: { bsonType: ["objectId","string"], description: "project id" },
            amount: { bsonType: "number", description: "invested amount" },
            currency: { bsonType: "string", description: "currency code" },
            startDate: { bsonType: "date", description: "start date" },
            maturityDate: { bsonType: "date", description: "maturity date" },
            roiPercent: { bsonType: "number", description: "ROI percent" },
            expectedPayout: { bsonType: "number", description: "expected payout" },
            status: { bsonType: "string", description: "investment status" },
            paymentRef: { bsonType: "string", description: "payment reference" },
            transactions: { bsonType: "array", description: "transaction ids array", items: { bsonType: ["objectId","string"] }},
            createdAt: { bsonType: "date" },
            updatedAt: { bsonType: "date" }
          }
        }
      },
      validationLevel: "moderate"
    };

    // If the collection doesn't exist, create it first with the validator,
    // otherwise collMod will modify the existing collection.
    const collections = await db.listCollections({ name: 'investments' }).toArray();
    if (collections.length === 0) {
      console.log('Collection investments does not exist — creating with validator.');
      await db.createCollection('investments', { validator: cmd.validator, validationLevel: 'moderate' });
      console.log('Created investments with validator.');
    } else {
      console.log('Applying collMod to investments...');
      // collMod is allowed in Atlas; catches errors if collMod not supported
      try {
        await db.command(cmd);
        console.log('Validator applied (collMod).');
      } catch (err) {
        // collMod may fail if user lacks privileges; show helpful message
        console.error('collMod failed:', err.message || err);
        // As fallback, try to update collection options by recreating if sandboxed (CAUTION)
      }
    }

    console.log('Done.');
    await client.close();
  } catch (err) {
    console.error('Error applying validator:', err);
    process.exit(1);
  }
})();
