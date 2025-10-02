// File: models/notificationModel.js
const mongoose = require('mongoose');

const notSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type: { type: String },
  title: { type: String },
  body: { type: String },
  read: { type: Boolean, default: false },
  sentAt: { type: Date }
});

module.exports = mongoose.model('Notification', notSchema);