import crypto from 'crypto';
import Razorpay from 'razorpay';
import User from '../models/User.js';
import Cart from '../models/Cart.js';
import PendingPayment from '../models/PendingPayment.js';
import { calculateCartTotal, fulfillOrderFromCart } from '../services/orderService.js';

const readEnv = (key) => process.env[key]?.trim().replace(/^['"]|['"]$/g, '') || '';

export const isRazorpayConfigured = () =>
  Boolean(readEnv('RAZORPAY_KEY_ID') && readEnv('RAZORPAY_KEY_SECRET'));

const getRazorpayClient = () => {
  const keyId = readEnv('RAZORPAY_KEY_ID');
  const keySecret = readEnv('RAZORPAY_KEY_SECRET');

  if (!keyId || !keySecret) {
    throw new Error('Razorpay is not configured on the server.');
  }

  return new Razorpay({ key_id: keyId, key_secret: keySecret });
};

export const getPaymentConfig = async (req, res) => {
  return res.json({
    razorpayEnabled: isRazorpayConfigured(),
    keyId: isRazorpayConfigured() ? readEnv('RAZORPAY_KEY_ID') : '',
    codEnabled: true,
    methods: isRazorpayConfigured()
      ? ['razorpay', 'cod']
      : ['cod'],
    message: isRazorpayConfigured()
      ? 'Pay online via UPI, cards, or wallets through Razorpay.'
      : 'Online payments unavailable. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server/.env to enable UPI/card payments.',
  });
};

export const createRazorpayOrder = async (req, res) => {
  try {
    if (!isRazorpayConfigured()) {
      return res.status(503).json({ message: 'Razorpay is not configured. Use Cash on Delivery.' });
    }

    const { addressId, deliveryAddress, saveAddress } = req.body;
    const buyerId = req.user.id;

    const cart = await Cart.findOne({ buyer: buyerId }).populate('items.crop');
    if (!cart || !cart.items.length) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const totalAmount = calculateCartTotal(cart);
    if (totalAmount <= 0) {
      return res.status(400).json({ message: 'Invalid cart total' });
    }

    const amountPaise = Math.round(totalAmount * 100);
    if (amountPaise < 100) {
      return res.status(400).json({ message: 'Minimum online payment amount is ₹1' });
    }

    const razorpay = getRazorpayClient();
    const receipt = `km_${buyerId.toString().slice(-6)}_${Date.now()}`;

    const razorpayOrder = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt,
      notes: {
        buyerId: String(buyerId),
        app: 'AI-Kisaan-Mandi',
      },
    });

    await PendingPayment.findOneAndUpdate(
      { razorpayOrderId: razorpayOrder.id },
      {
        buyer: buyerId,
        razorpayOrderId: razorpayOrder.id,
        amount: totalAmount,
        currency: 'INR',
        addressId: addressId || '',
        deliveryAddress: deliveryAddress || null,
        saveAddress: Boolean(saveAddress),
        status: 'created',
      },
      { upsert: true, new: true }
    );

    const user = await User.findById(buyerId).select('fullName email phoneNumber');

    return res.json({
      keyId: readEnv('RAZORPAY_KEY_ID'),
      razorpayOrderId: razorpayOrder.id,
      amount: amountPaise,
      currency: 'INR',
      name: 'AI Kisan Mandi',
      description: 'Fresh crop purchase',
      prefill: {
        name: user?.fullName || '',
        email: user?.email || '',
        contact: user?.phoneNumber || '',
      },
    });
  } catch (error) {
    console.error('Create Razorpay order error:', error.message);
    return res.status(500).json({ message: error.message || 'Unable to start online payment.' });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification data is incomplete.' });
    }

    const keySecret = readEnv('RAZORPAY_KEY_SECRET');
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ message: 'Payment verification failed. Invalid signature.' });
    }

    const pending = await PendingPayment.findOne({
      razorpayOrderId: razorpay_order_id,
      buyer: req.user.id,
      status: 'created',
    });

    if (!pending) {
      return res.status(404).json({ message: 'Payment session not found or already processed.' });
    }

    const order = await fulfillOrderFromCart({
      buyerId: req.user.id,
      addressId: pending.addressId || undefined,
      deliveryAddress: pending.deliveryAddress || undefined,
      saveAddress: pending.saveAddress,
      paymentMethod: 'Razorpay (UPI/Card)',
      paymentStatus: 'paid',
      razorpayOrderId: razorpay_order_id,
      razorpayPaymentId: razorpay_payment_id,
    });

    pending.status = 'paid';
    await pending.save();

    return res.status(201).json(order);
  } catch (error) {
    console.error('Verify Razorpay payment error:', error.message);
    return res.status(500).json({ message: error.message || 'Payment verified but order could not be created.' });
  }
};
