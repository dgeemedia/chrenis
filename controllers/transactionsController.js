// controllers/transactionsController.js
const db = require('../db/connect');

exports.list = async (req, res, next) => {
  try {
    const filter = (req.user && req.user.role === 'admin') ? {} : { userId: req.user && req.user._id };
    const txs = await db.getDb().collection('transactions').find(filter).toArray();
    res.json(txs);
  } catch (err) { next(err); }
};
