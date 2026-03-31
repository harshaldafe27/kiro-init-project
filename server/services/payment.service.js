const crypto = require('crypto');
const Razorpay = require('razorpay');
const {
    RAZORPAY_KEY_ID,
    RAZORPAY_KEY_SECRET
} = require('../config/env');

// Singleton Razorpay instance
let _razorpay;
const getRazorpay = () => {
    if (!_razorpay) {
        _razorpay = new Razorpay({
            key_id: RAZORPAY_KEY_ID,
            key_secret: RAZORPAY_KEY_SECRET,
        });
    }
    return _razorpay;
};

/**
 * Create a Razorpay order.
 * @param {{ amount: number, currency?: string, receipt: string, notes?: object }} options
 * amount must be in paise (INR smallest unit), e.g. ₹100 = 10000
 */
const createOrder = async ({
    amount,
    currency = 'INR',
    receipt,
    notes = {}
}) => {
    const razorpay = getRazorpay();
    const order = await razorpay.orders.create({
        amount,
        currency,
        receipt,
        notes
    });
    return order;
};

/**
 * Verify Razorpay payment signature using HMAC-SHA256.
 * Razorpay signs: orderId + "|" + paymentId with the key_secret.
 */
const verifySignature = ({
    orderId,
    paymentId,
    signature
}) => {
    const body = `${orderId}|${paymentId}`;
    const expected = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');
    return expected === signature;
};

/**
 * Fetch a Razorpay order by ID.
 */
const fetchOrder = async (orderId) => {
    const razorpay = getRazorpay();
    return razorpay.orders.fetch(orderId);
};

/**
 * Fetch a Razorpay payment by ID.
 */
const fetchPayment = async (paymentId) => {
    const razorpay = getRazorpay();
    return razorpay.payments.fetch(paymentId);
};

module.exports = {
    createOrder,
    verifySignature,
    fetchOrder,
    fetchPayment
};