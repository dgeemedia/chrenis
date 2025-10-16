// File: controllers/investmentsController.js
const { ObjectId } = require('mongodb');
const db = require('../db/connect');

// helper (keeps local behavior)
const toObjectIdIfValid = (val) => {
  if (val === undefined || val === null) return val;
  if (val instanceof ObjectId) return val;
  if (typeof val === 'string' && ObjectId.isValid(val)) return new ObjectId(val);
  return val;
};

const toIdString = (val) => {
  if (val === undefined || val === null) return String(val);
  return (val && typeof val.toString === 'function') ? val.toString() : String(val);
};

exports.list = async (req, res, next) => {
  try {
    let filter = {};
    if (!(req.user && req.user.role === 'admin')) {
      if (!req.user || !req.user._id) {
        return res.json([]);
      }
      filter = { userId: toObjectIdIfValid(req.user._id) };
    }

    const items = await db.getDb().collection('investments').find(filter).toArray();

    // populate projectId (simple manual populate)
    const projectIds = [...new Set(items.filter(i => i.projectId).map(i => i.projectId.toString()))];
    const projects = projectIds.length
      ? await db.getDb().collection('projects').find({ _id: { $in: projectIds.map(id => new ObjectId(id)) } }).toArray()
      : [];
    const projMap = Object.fromEntries(projects.map(p => [p._id.toString(), p]));
    items.forEach(it => { if (it.projectId) it.project = projMap[it.projectId.toString()]; });

    res.json(items);
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
    const inv = await db.getDb().collection('investments').findOne({ _id: new ObjectId(id) });
    if (!inv) return res.status(404).json({ message: 'Not found' });
    if (inv.projectId) {
      inv.project = await db.getDb().collection('projects').findOne({ _id: new ObjectId(inv.projectId) });
    }
    res.json(inv);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { projectId, amount, term, paymentRef, currency } = req.body;

    // Basic validation (controller-level)
    if (!projectId || !ObjectId.isValid(projectId)) return res.status(400).json({ message: 'Invalid projectId' });
    const amountNum = Number(amount || 0);
    if (!amountNum || isNaN(amountNum) || amountNum <= 0) return res.status(400).json({ message: 'Invalid amount' });
    if (!['4mo', '12mo'].includes(term)) return res.status(400).json({ message: 'Invalid term (allowed: 4mo, 12mo)' });

    // fetch project
    const project = await db.getDb().collection('projects').findOne({ _id: new ObjectId(projectId) });
    if (!project) return res.status(404).json({ message: 'Project not found' });

    // project-level minInvestment enforcement
    if (typeof project.minInvestment === 'number' && amountNum < project.minInvestment) {
      return res.status(400).json({ message: 'Amount below minimum' });
    }

    // compute roi and dates
    const roiPercent = term === '12mo' ? (project.roi12moPercent || 35) : (project.roi4moPercent || 12);
    const expectedPayout = amountNum + (amountNum * roiPercent / 100);
    const startDate = new Date();
    const maturityDate = new Date(startDate);
    maturityDate.setMonth(maturityDate.getMonth() + (term === '12mo' ? 12 : 4));
    const now = new Date();

    const invDoc = {
      userId: toObjectIdIfValid(req.user && req.user._id),
      projectId: new ObjectId(projectId),
      amount: amountNum,
      currency: currency || project.currency || 'NGN',
      startDate,
      maturityDate,
      roiPercent,
      expectedPayout,
      status: 'active',
      paymentRef: paymentRef || null,
      transactions: [],
      createdAt: now,
      updatedAt: now
    };

    const invRes = await db.getDb().collection('investments').insertOne(invDoc);
    // fetch the inserted investment (controller's previous behavior)
    const insertedInv = await db.getDb().collection('investments').findOne({ _id: invRes.insertedId });

    const txDoc = {
      userId: toObjectIdIfValid(req.user && req.user._id),
      investmentId: insertedInv._id,
      type: 'deposit',
      amount: amountNum,
      status: 'pending',
      provider: req.body.provider || null,
      providerRef: req.body.providerRef || null,
      meta: req.body.meta || null,
      createdAt: now
    };

    const txRes = await db.getDb().collection('transactions').insertOne(txDoc);

    // push transaction id onto investment.transactions array (if you track them)
    await db.getDb().collection('investments').updateOne(
      { _id: insertedInv._id },
      { $push: { transactions: txRes.insertedId } }
    );

    res.status(201).json({ investment: insertedInv, transaction: txDoc });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });

    const inv = await db.getDb().collection('investments').findOne({ _id: new ObjectId(id) });
    if (!inv) return res.status(404).json({ message: 'Not found' });

    if (!req.user || !req.user._id) return res.status(401).json({ message: 'Unauthorized' });

    const requesterId = toIdString(req.user._id);
    const ownerId = inv.userId ? toIdString(inv.userId) : null;
    if ((req.user.role !== 'admin') && (!ownerId || ownerId !== requesterId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const update = { ...req.body, updatedAt: new Date() };
    const result = await db.getDb().collection('investments').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: 'after' }
    );
    res.json(result.value);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });

    const inv = await db.getDb().collection('investments').findOne({ _id: new ObjectId(id) });
    if (!inv) return res.status(404).json({ message: 'Not found' });

    if (!req.user || !req.user._id) return res.status(401).json({ message: 'Unauthorized' });

    const requesterId = toIdString(req.user._id);
    const ownerId = inv.userId ? toIdString(inv.userId) : null;
    if ((req.user.role !== 'admin') && (!ownerId || ownerId !== requesterId)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await db.getDb().collection('investments').deleteOne({ _id: new ObjectId(id) });
    res.status(204).end();
  } catch (err) { next(err); }
};
