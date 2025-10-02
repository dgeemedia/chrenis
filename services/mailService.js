// File: services/mailService.js
const nodemailer = require('nodemailer');
const config = require('../config');

const transporter = nodemailer.createTransport({
  host: config.SMTP.host,
  port: config.SMTP.port,
  auth: { user: config.SMTP.user, pass: config.SMTP.pass }
});

exports.send = async ({ to, subject, text, html }) => {
  await transporter.sendMail({ from: 'no-reply@chrenis.example', to, subject, text, html });
};