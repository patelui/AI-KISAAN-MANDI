import { Router } from 'express';
import {
  createCrop,
  getCrops,
  getMyCrops,
  updateCrop,
  deleteCrop,
} from '../controllers/cropController.js';
import { requireAuth, requireFarmer } from '../middleware/authMiddleware.js';
import { cropImageUpload } from '../middleware/uploadMiddleware.js';

const router = Router();

router.get('/', getCrops);
router.get('/my', requireAuth, requireFarmer, getMyCrops);
router.post('/', requireAuth, requireFarmer, cropImageUpload('image'), createCrop);
router.put('/:id', requireAuth, requireFarmer, cropImageUpload('image'), updateCrop);
router.delete('/:id', requireAuth, requireFarmer, deleteCrop);

export default router;

