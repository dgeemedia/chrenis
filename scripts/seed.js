// scripts/seed.js
// Usage: node scripts/seed.js
require('dotenv').config();
const bcrypt = require('bcrypt');
const db = require('../db/connect'); // <- your db helper
const { ObjectId } = require('mongodb');

async function upsertUser({ email, name, role = 'user', password, walletBalance = 0 }) {
  const passwordHash = password ? await bcrypt.hash(password, 10) : undefined;
  const doc = {
    email: email.toLowerCase(),
    name,
    role,
    walletBalance,
    updatedAt: new Date()
  };
  if (passwordHash) doc.passwordHash = passwordHash;

  const coll = db.getDb().collection('users');
  await coll.updateOne(
    { email: doc.email },
    { $set: doc, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );
  return coll.findOne({ email: doc.email }, { projection: { passwordHash: 0 } });
}

async function upsertProject(p) {
  const coll = db.getDb().collection('projects');
  const slug = p.slug;
  const payload = { ...p, updatedAt: new Date() };
  await coll.updateOne(
    { slug },
    { $set: payload, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );
  return coll.findOne({ slug });
}

async function createInvestmentForUser(userId, projectId, amount, term = '4mo') {
  const collInv = db.getDb().collection('investments');
  const collTx = db.getDb().collection('transactions');

  // compute roi etc from project
  const project = await db.getDb().collection('projects').findOne({ _id: new ObjectId(projectId) });
  if (!project) throw new Error('Project not found for investment');

  const roiPercent = term === '12mo' ? project.roi12moPercent : project.roi4moPercent;
  const expectedPayout = amount + (amount * roiPercent / 100);
  const maturityDate = new Date();
  maturityDate.setMonth(maturityDate.getMonth() + (term === '12mo' ? 12 : 4));

  const invDoc = {
    userId: new ObjectId(userId),
    projectId: new ObjectId(projectId),
    amount,
    roiPercent,
    expectedPayout,
    maturityDate,
    currency: project.currency || 'NGN',
    status: 'active',
    createdAt: new Date()
  };

  const invRes = await collInv.insertOne(invDoc);
  const inv = await collInv.findOne({ _id: invRes.insertedId });

  const txDoc = {
    userId: new ObjectId(userId),
    investmentId: inv._id,
    type: 'deposit',
    amount,
    status: 'pending',
    createdAt: new Date()
  };
  const txRes = await collTx.insertOne(txDoc);

  await collInv.updateOne({ _id: inv._id }, { $push: { transactions: txRes.insertedId } });

  return { investment: inv, transaction: txDoc };
}

async function seed() {
  try {
    console.log('Initializing DB...');
    await db.initDb(); // must call first
    console.log('DB initialized:', db.getDb().databaseName);

    // 1) USERS (upsert) - passwords are hashed
    console.log('Upserting users...');
    const admin = await upsertUser({
      email: 'admin@chrenis.com',
      name: 'Admin Ernest',
      role: 'admin',
      password: 'AdminPass123!',
      walletBalance: 100000
    });
    const alice = await upsertUser({
      email: 'george@chrenis.com',
      name: 'George Olumah',
      role: 'user',
      password: 'Password123!',
      walletBalance: 5000
    });

    console.log('Users ready:', admin.email, alice.email);

    // 2) PROJECTS (upsert)
    console.log('Upserting projects...');
    const mango = await upsertProject({
      slug: 'mango-orchard-2025',
      title: 'Mango Orchard - 4mo',
      description: 'High-yield mango orchard investment: 4 months term.',
      minInvestment: 10000,
      roi4moPercent: 12,
      roi12moPercent: 35,
      durationMonths: 4,
      status: 'active',
      images: ['/images/projects/aba1.jpg']
    });

    const solar = await upsertProject({
      slug: 'solar-rooftop-2025',
      title: 'Solar Rooftop - 12mo',
      description: 'Commercial rooftop solar, 12 months term.',
      minInvestment: 25000,
      roi4moPercent: 9,
      roi12moPercent: 30,
      durationMonths: 12,
      status: 'active',
      images: ['/images/projects/aba1.jpg']
    });

    console.log('Projects ready:', mango.slug, solar.slug);

    // 3) INVESTMENTS + TRANSACTIONS (only create if not already present)
    // We'll create an investment for Alice if she has none
    const invColl = db.getDb().collection('investments');
    const existingInv = await invColl.findOne({ userId: alice._id });
    if (!existingInv) {
      console.log('Creating sample investment for Alice...');
      const res = await createInvestmentForUser(alice._id, mango._id, 15000, '4mo');
      console.log('Created investment:', res.investment._id.toString());
    } else {
      console.log('Alice already has an investment, skipping creating new one.');
    }

    console.log('Seeding complete.');
    // optionally close client
    const client = db.getClient && db.getClient();
    if (client) await client.close();
    process.exit(0);
  } catch (err) {
    console.error('Seeding error', err);
    try {
      const client = db.getClient && db.getClient();
      if (client) await client.close();
    } catch (_) {}
    process.exit(1);
  }
}

seed();
