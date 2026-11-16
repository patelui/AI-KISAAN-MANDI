import { Router } from 'express';
import { getMarketInsightController, getMarketTrendController } from '../controllers/marketInsightController.js';

const router = Router();

router.get('/trend', getMarketTrendController);
router.get('', getMarketInsightController);
router.get('/', getMarketInsightController);

export default router;
