// File: services/paymentService.js
// payment stubs; implement actual SDK calls later
exports.createPaymentSession = async ({ amount, user, provider = 'paystack' }) => {
  return { provider, checkoutUrl: 'https://example.com/checkout', providerRef: `stub-${Date.now()}` };
};

exports.verifyWebhook = async (req) => {
  // verify signature, return parsed payload
  return req.body;
};