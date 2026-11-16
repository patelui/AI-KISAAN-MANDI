import { Router } from 'express';
import {
  getFarmerDashboard,
  getFarmerOrders,
  updateFarmerOrderStatus,
} from '../controllers/farmerController.js';
import {
  getFarmerAssistantInfo,
  postFarmerAssistantChat,
} from '../controllers/farmerAssistantController.js';
import { requireAuth, requireFarmer } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/dashboard', requireAuth, requireFarmer, getFarmerDashboard);
router.get('/orders', requireAuth, requireFarmer, getFarmerOrders);
router.patch('/orders/:id/status', requireAuth, requireFarmer, updateFarmerOrderStatus);
router.get('/assistant/status', requireAuth, requireFarmer, getFarmerAssistantInfo);
router.post('/assistant/chat', requireAuth, requireFarmer, postFarmerAssistantChat);

export default router;
