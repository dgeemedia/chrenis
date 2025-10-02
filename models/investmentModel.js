// File: models/investmentModel.js
const mongoose = require('mongoose');

const investmentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'NGN' },
  startDate: { type: Date, default: Date.now },
  maturityDate: { type: Date },
  roiPercent: { type: Number, required: true },
  expectedPayout: { type: Number },
  status: { type: String, enum: ['active','matured','withdrawn','reinvested'], default: 'active' },
  paymentRef: { type: String },
  transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Investment', investmentSchema);