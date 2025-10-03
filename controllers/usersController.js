// controllers/usersController.js
const { ObjectId } = require('mongodb');
const db = require('../db/connect');
const bcrypt = require('bcrypt');

exports.list = async (req, res, next) => {
  try {
    // optional: only admin can list all users — currently controlled by route middleware
    const users = await db.getDb()
      .collection('users')
      .find({})
      .project({ passwordHash: 0 }) // hide password hashes
      .toArray();

    res.json(users);
  } catch (err) {
    next(err);
  }
};

exports.get = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
    const user = await db.getDb().collection('users').findOne(
      { _id: new ObjectId(id) },
      { projection: { passwordHash: 0 } }
    );
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const payload = { ...req.body, createdAt: new Date() };
    if (payload.password) {
      payload.passwordHash = await bcrypt.hash(payload.password, 10);
      delete payload.password;
    }
    const result = await db.getDb().collection('users').insertOne(payload);
    const user = await db.getDb().collection('users').findOne(
      { _id: result.insertedId },
      { projection: { passwordHash: 0 } }
    );
    res.status(201).json(user);
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
    const update = { ...req.body, updatedAt: new Date() };
    if (update.password) {
      update.passwordHash = await bcrypt.hash(update.password, 10);
      delete update.password;
    }
    const result = await db.getDb().collection('users').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: update },
      { returnDocument: 'after', projection: { passwordHash: 0 } }
    );
    res.json(result.value);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    const id = req.params.id;
    if (!ObjectId.isValid(id)) return res.status(400).json({ message: 'Invalid id' });
    await db.getDb().collection('users').deleteOne({ _id: new ObjectId(id) });
    res.status(204).end();
  } catch (err) { next(err); }
};
