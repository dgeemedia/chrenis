// models/userModel.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String },
  name: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  auth0Id: { type: String },
  walletBalance: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);