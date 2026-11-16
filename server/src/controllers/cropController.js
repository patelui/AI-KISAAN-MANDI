import Crop from '../models/Crop.js';
import { getMarketInsight } from '../services/marketInsightService.js';

const getUserId = (req) => req.user?.id || req.user?._id;

const buildAssetUrl = (req, assetPath = '') => {
  if (!assetPath) {
    return '';
  }

  if (/^https?:\/\//i.test(assetPath)) {
    return assetPath;
  }

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}${assetPath.startsWith('/') ? assetPath : `/${assetPath}`}`;
};

const formatCropResponse = (req, crop) => {
  const cropObject = crop?.toObject ? crop.toObject() : crop;

  return {
    ...cropObject,
    image: buildAssetUrl(req, cropObject.image),
  };
};

const parseLocationParts = (location = '') => {
  const parts = String(location)
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length >= 3) {
    return {
      district: parts[parts.length - 2],
      state: parts[parts.length - 1],
    };
  }

  if (parts.length === 2) {
    return {
      district: parts[0],
      state: parts[1],
    };
  }

  return {
    district: parts[0] || 'Vadodara',
    state: parts[0] || 'Gujarat',
  };
};

const attachMandiComparison = async (crop) => {
  const { state, district } = parseLocationParts(crop.location);
  const insight = await getMarketInsight({
    commodity: crop.name,
    state,
    district,
  });

  const listingPrice = Number(crop.price || 0);
  const mandiPrice = Number(insight.modalPrice || 0);
  const difference = listingPrice - mandiPrice;
  const differencePercent = mandiPrice > 0 ? Math.round((difference / mandiPrice) * 100) : 0;

  let verdict = 'aligned';
  if (differencePercent > 8) {
    verdict = 'above';
  } else if (differencePercent < -8) {
    verdict = 'below';
  }

  return {
    mandi: {
      commodity: insight.commodity,
      market: insight.market,
      modalPrice: mandiPrice,
      minPrice: insight.minPrice,
      maxPrice: insight.maxPrice,
      trend: insight.trend,
      unit: insight.unit || 'qtl',
      state: insight.state,
      district: insight.district,
      difference,
      differencePercent,
      verdict,
    },
  };
};

export const createCrop = async (req, res) => {
  try {
    const { name, price, quantity, location, quality } = req.body;

    if (!name || price === undefined || price === '') {
      return res.status(400).json({ message: 'Name and price are required' });
    }

    const image = req.file ? `/uploads/crops/${req.file.filename}` : undefined;

    const crop = await Crop.create({
      name: String(name).trim(),
      price: Number(price),
      quantity: quantity === '' || quantity === undefined ? null : Number(quantity),
      location: location || '',
      quality: quality || 'Standard',
      image,
      farmer: getUserId(req),
    });

    return res.status(201).json(formatCropResponse(req, crop));
  } catch (error) {
    console.error('Create crop error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getCrops = async (req, res) => {
  try {
    const { name, location, quality, minPrice, maxPrice, mandi } = req.query;
    const filter = {};

    if (name) {
      filter.name = { $regex: new RegExp(name, 'i') };
    }

    if (location) {
      filter.location = { $regex: new RegExp(location, 'i') };
    }

    if (quality) {
      filter.quality = { $regex: new RegExp(`^${quality}$`, 'i') };
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) {
        filter.price.$gte = Number(minPrice);
      }
      if (maxPrice) {
        filter.price.$lte = Number(maxPrice);
      }
    }

    const crops = await Crop.find(filter)
      .sort({ createdAt: -1 })
      .populate('farmer', 'fullName email');

    const includeMandi = mandi === 'true' || mandi === '1';
    const formattedCrops = await Promise.all(
      crops.map(async (crop) => {
        const base = formatCropResponse(req, crop);
        if (!includeMandi) {
          return base;
        }

        try {
          const mandiData = await attachMandiComparison(base);
          return { ...base, ...mandiData };
        } catch {
          return base;
        }
      })
    );

    return res.json(formattedCrops);
  } catch (error) {
    console.error('Get crops error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getMyCrops = async (req, res) => {
  try {
    const { mandi } = req.query;
    const crops = await Crop.find({ farmer: getUserId(req) }).sort({ createdAt: -1 });
    const includeMandi = mandi === 'true' || mandi === '1';

    const formattedCrops = await Promise.all(
      crops.map(async (crop) => {
        const base = formatCropResponse(req, crop);
        if (!includeMandi) {
          return base;
        }

        try {
          const mandiData = await attachMandiComparison(base);
          return { ...base, ...mandiData };
        } catch {
          return base;
        }
      })
    );

    return res.json(formattedCrops);
  } catch (error) {
    console.error('Get my crops error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const updateCrop = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, quantity, location, quality } = req.body;

    const crop = await Crop.findOne({ _id: id, farmer: getUserId(req) });
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    if (name !== undefined) crop.name = String(name).trim();
    if (price !== undefined && price !== '') crop.price = Number(price);
    if (quantity !== undefined) {
      crop.quantity = quantity === '' ? null : Number(quantity);
    }
    if (location !== undefined) crop.location = location;
    if (quality !== undefined) crop.quality = quality;
    if (req.file) {
      crop.image = `/uploads/crops/${req.file.filename}`;
    }

    await crop.save();
    return res.json(formatCropResponse(req, crop));
  } catch (error) {
    console.error('Update crop error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const deleteCrop = async (req, res) => {
  try {
    const { id } = req.params;
    const crop = await Crop.findOneAndDelete({ _id: id, farmer: getUserId(req) });

    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    return res.json({ message: 'Crop deleted' });
  } catch (error) {
    console.error('Delete crop error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};
