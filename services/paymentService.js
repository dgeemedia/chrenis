// File: services/paymentService.js
// payment stubs; implement actual SDK calls later
exports.createPaymentSession = async ({ amount, user, provider = 'paystack' }) => {
  try {
    return { provider, checkoutUrl: 'https://example.com/checkout', providerRef: `stub-${Date.now()}` };
  } catch (err) {
    console.error('Payment session error:', err);
    throw err;
  }
};

exports.verifyWebhook = async (req) => {
  try {
    // verify signature, return parsed payload
    return req.body;
  } catch (err) {
    console.error('Webhook verification error:', err);
    throw err;
  }
};