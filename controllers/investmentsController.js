// controllers/investmentsController.js
const { ObjectId } = require('mongodb');
const db = require('../db/connect');

exports.list = async (req, res, next) => {
  try {
    const filter = (req.user && req.user.role === 'admin') ? {} : { userId: req.user && req.user._id };
    const items = await db.getDb().collection('investments').find(filter).toArray();

    // populate projectId (simple manual populate)
    const projectIds = [...new Set(items.filter(i => i.projectId).map(i => i.projectId.toString()))];
    const projects = projectIds.length ? await db.getDb().collection('projects').find({ _id: { $in: projectIds.map(id => new ObjectId(id)) } }).toArray() : [];
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
    const { projectId, amount, term } = req.body;
    if (!projectId || !ObjectId.isValid(projectId)) return res.status(400).json({ message: 'Invalid projectId' });

    const project = await db.getDb().collection('projects').findOne({ _id: new ObjectId(projectId) });
    if (!project) return res.status(404).json({ message: 'Project not found' });
    if (amount < project.minInvestment) return res.status(400).json({ message: 'Amount below minimum' });

    const roiPercent = term === '12mo' ? project.roi12moPercent : project.roi4moPercent;
    const expectedPayout = amount + (amount * roiPercent / 100);
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + (term === '12mo' ? 12 : 4));

    const invDoc = {
      userId: req.user && req.user._id,
      projectId: new ObjectId(projectId),
      amount,
      roiPercent,
      expectedPayout,
      maturityDate,
      currency: project.currency || 'NGN',
      status: 'active',
      createdAt: new Date()
    };

    const invRes = await db.getDb().collection('investments').insertOne(invDoc);
    const inv = await db.getDb().collection('investments').findOne({ _id: invRes.insertedId });

    const txDoc = {
      userId: inv.userId,
      investmentId: inv._id,
      type: 'deposit',
      amount,
      status: 'pending',
      createdAt: new Date()
    };
    const txRes = await db.getDb().collection('transactions').insertOne(txDoc);

    await db.getDb().collection('investments').updateOne({ _id: inv._id }, { $push: { transactions: txRes.insertedId } });

    res.status(201).json({ investment: inv, transaction: txDoc });
  } catch (err) { next(err); }
};
