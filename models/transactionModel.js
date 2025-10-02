// models/transactionModel.js
const mongoose = require('mongoose');

const txSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  investmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Investment' },
  type: { type: String, enum: ['deposit','withdrawal','roi_credit','fee'], required: true },
  amount: { type: Number, required: true },
  status: { type: String, enum: ['pending','success','failed'], default: 'pending' },
  provider: { type: String },
  providerRef: { type: String },
  meta: { type: Object },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Transaction', txSchema);