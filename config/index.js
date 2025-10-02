require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 3000,
  MONGODB_URI: process.env.MONGODB_URI,
  AUTH0_DOMAIN: process.env.AUTH0_DOMAIN,
  AUTH0_AUDIENCE: process.env.AUTH0_AUDIENCE,
  PAYSTACK_SECRET: process.env.PAYSTACK_SECRET,
  FLUTTERWAVE_SECRET: process.env.FLUTTERWAVE_SECRET,
  SMTP: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};
