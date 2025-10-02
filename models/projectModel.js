// models/projectModel.js
const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  slug: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  description: { type: String },
  minInvestment: { type: Number, default: 10000 },
  roi4moPercent: { type: Number, default: 10 },
  roi12moPercent: { type: Number, default: 30 },
  durationMonths: { type: Number, default: 4 },
  status: { type: String, enum: ['active','paused','archived'], default: 'active' },
  images: [String],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Project', projectSchema);