// controllers/projectsController.js
const { ObjectId } = require('mongodb');
const db = require('../db/connect');

exports.list = async (req, res, next) => {
  try {
    const projects = await db.getDb().collection('projects').find({ status: 'active' }).toArray();
    res.json(projects);
  } catch (err) { next(err); }
};

exports.get = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
    const project = await db.getDb().collection('projects').findOne({ _id: new ObjectId(id) });
    if (!project) return res.status(404).json({ message: 'Not found' });
    res.json(project);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const payload = { ...req.body, createdAt: new Date() };
    payload.status = payload.status || 'active';
    if (typeof payload.minInvestment === 'undefined') payload.minInvestment = 10000;
    if (typeof payload.roi4moPercent === 'undefined') payload.roi4moPercent = 12;
    if (typeof payload.roi12moPercent === 'undefined') payload.roi12moPercent = 35;
    if (typeof payload.durationMonths === 'undefined') payload.durationMonths = 4;

    const result = await db.getDb().collection('projects').insertOne(payload);
    const p = await db.getDb().collection('projects').findOne({ _id: result.insertedId });
    res.status(201).json(p);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
    const update = { ...req.body, updatedAt: new Date() };
    const result = await db.getDb().collection('projects').findOneAndUpdate(
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
    await db.getDb().collection('projects').deleteOne({ _id: new ObjectId(id) });
    res.status(204).end();
  } catch (err) { next(err); }
};
