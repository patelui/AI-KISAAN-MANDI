import { Router } from 'express';
import {
  getBuyerCart,
  addToCart,
  updateCartItem,
  deleteCartItem,
  placeOrder,
  getBuyerOrders,
  getBuyerDashboard,
} from '../controllers/buyerController.js';
import {
  getBuyerAddresses,
  createBuyerAddress,
  updateBuyerAddress,
  deleteBuyerAddress,
  setDefaultBuyerAddress,
} from '../controllers/buyerAddressController.js';
import {
  getBuyerAssistantInfo,
  postBuyerAssistantChat,
} from '../controllers/buyerAssistantController.js';
import {
  getPaymentConfig,
  createRazorpayOrder,
  verifyRazorpayPayment,
} from '../controllers/paymentController.js';
import { requireAuth, requireBuyer } from '../middleware/authMiddleware.js';

const router = Router();

router.use(requireAuth, requireBuyer);

router.get('/dashboard', getBuyerDashboard);
router.get('/cart', getBuyerCart);
router.post('/cart', addToCart);
router.put('/cart/:id', updateCartItem);
router.delete('/cart/:id', deleteCartItem);
router.post('/orders', placeOrder);
router.get('/orders', getBuyerOrders);

router.get('/payments/config', getPaymentConfig);
router.post('/payments/razorpay/create', createRazorpayOrder);
router.post('/payments/razorpay/verify', verifyRazorpayPayment);

router.get('/addresses', getBuyerAddresses);
router.post('/addresses', createBuyerAddress);
router.put('/addresses/:id', updateBuyerAddress);
router.delete('/addresses/:id', deleteBuyerAddress);
router.patch('/addresses/:id/default', setDefaultBuyerAddress);

router.get('/assistant/status', getBuyerAssistantInfo);
router.post('/assistant/chat', postBuyerAssistantChat);

export default router;
