// controllers/transactionsController.js
const { ObjectId } = require('mongodb');
const db = require('../db/connect');

const toObjectIdIfValid = (val) => {
  if (!val) return val;
  return ObjectId.isValid(val) ? new ObjectId(val) : val;
};

const toIdString = (val) => {
  if (val === undefined || val === null) return String(val);
  return (val && typeof val.toString === 'function') ? val.toString() : String(val);
};

exports.list = async (req, res, next) => {
  try {
    const filter = (req.user && req.user.role === 'admin') ? {} : { userId: toObjectIdIfValid(req.user && req.user._id) };
    const txs = await db.getDb().collection('transactions').find(filter).toArray();
    res.json(txs);
  } catch (err) {
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
    const tx = await db.getDb().collection('transactions').findOne({ _id: new ObjectId(id) });
    if (!tx) return res.status(404).json({ message: 'Not found' });

    // ownership check (unless admin)
    if (!req.user || req.user.role !== 'admin') {
      const requesterId = toIdString(req.user && req.user._id);
      const ownerId = tx.userId ? toIdString(tx.userId) : null;
      if (!ownerId || ownerId !== requesterId) {
        return res.status(403).json({ message: 'Forbidden' });
      }
    }

    res.json(tx);
  } catch (err) {
    next(err);
  }
};

exports.create = async (req, res, next) => {
  try {
    if (!req.user || !req.user._id) return res.status(401).json({ message: 'Unauthorized' });

    const { investmentId, type, amount, provider, providerRef, meta } = req.body;
    if (!investmentId || !ObjectId.isValid(investmentId)) return res.status(400).json({ message: 'Invalid investmentId' });

    const inv = await db.getDb().collection('investments').findOne({ _id: new ObjectId(investmentId) });
    if (!inv) return res.status(404).json({ message: 'Investment not found' });

    // only owner or admin can create transactions against the investment
    const requesterId = String(req.user._id);
    const ownerId = inv.userId ? (inv.userId.toString ? inv.userId.toString() : String(inv.userId)) : null;
    if (req.user.role !== 'admin' && ownerId !== requesterId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const txDoc = {
      userId: toObjectIdIfValid(req.user._id),
      investmentId: new ObjectId(investmentId),
      type: type || 'deposit',
      amount: Number(amount || 0),
      status: 'pending',
      provider: provider || null,
      providerRef: providerRef || null,
      meta: meta || null,
      createdAt: new Date()
    };

    const result = await db.getDb().collection('transactions').insertOne(txDoc);
    const tx = await db.getDb().collection('transactions').findOne({ _id: result.insertedId });

    // push transaction id onto investment.transactions array (if you track them)
    await db.getDb().collection('investments').updateOne(
      { _id: new ObjectId(investmentId) },
      { $push: { transactions: tx._id } }
    );

    res.status(201).json(tx);
  } catch (err) {
    next(err);
  }
};

exports.update = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });

    const tx = await db.getDb().collection('transactions').findOne({ _id: new ObjectId(id) });
    if (!tx) return res.status(404).json({ message: 'Not found' });

    if (!req.user || !req.user._id) return res.status(401).json({ message: 'Unauthorized' });

    const requesterId = String(req.user._id);
    const ownerId = tx.userId ? (tx.userId.toString ? tx.userId.toString() : String(tx.userId)) : null;
    if (req.user.role !== 'admin' && ownerId !== requesterId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const update = { ...req.body, updatedAt: new Date() };
    const result = await db.getDb().collection('transactions').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: 'after' }
    );
    res.json(result.value);
  } catch (err) {
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });

    const tx = await db.getDb().collection('transactions').findOne({ _id: new ObjectId(id) });
    if (!tx) return res.status(404).json({ message: 'Not found' });

    if (!req.user || !req.user._id) return res.status(401).json({ message: 'Unauthorized' });

    const requesterId = String(req.user._id);
    const ownerId = tx.userId ? (tx.userId.toString ? tx.userId.toString() : String(tx.userId)) : null;
    if (req.user.role !== 'admin' && ownerId !== requesterId) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await db.getDb().collection('transactions').deleteOne({ _id: new ObjectId(id) });

    // also remove reference from investment.transactions if present
    if (tx.investmentId) {
      await db.getDb().collection('investments').updateOne(
        { _id: new ObjectId(tx.investmentId) },
        { $pull: { transactions: tx._id } }
      );
    }

    res.status(204).end();
  } catch (err) {
    next(err);
  }
};
