import Crop from '../models/Crop.js';
import Order from '../models/Order.js';

const formatRelativeTime = (date) => {
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.floor(diffMs / 60000);

  if (minutes < 1) {
    return 'Just now';
  }

  if (minutes < 60) {
    return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  }

  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

const isActiveListing = (crop) => {
  if (crop.quantity === null || crop.quantity === undefined) {
    return true;
  }

  return Number(crop.quantity) > 0;
};

export const getFarmerDashboard = async (req, res) => {
  try {
    const farmerId = req.user.id;
    const crops = await Crop.find({ farmer: farmerId }).sort({ createdAt: -1 });
    const cropIds = crops.map((crop) => crop._id);

    const orders = cropIds.length
      ? await Order.find({ 'items.crop': { $in: cropIds } })
          .sort({ createdAt: -1 })
          .limit(50)
          .populate('buyer', 'fullName email')
      : [];

    const cropIdSet = new Set(cropIds.map((id) => id.toString()));

    let totalRevenue = 0;
    let pendingOrders = 0;
    const notifications = [];

    orders.forEach((order) => {
      const farmerItems = order.items.filter((item) =>
        cropIdSet.has(item.crop?.toString())
      );

      if (!farmerItems.length) {
        return;
      }

      const orderRevenue = farmerItems.reduce(
        (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
        0
      );

      totalRevenue += orderRevenue;

      if (order.status === 'Pending') {
        pendingOrders += 1;
      }

      farmerItems.forEach((item, index) => {
        notifications.push({
          id: `${order._id}-${index}`,
          message: `Order for ${item.cropName}: ${item.quantity} qtl at ₹${Number(item.price).toLocaleString('en-IN')}/qtl`,
          time: formatRelativeTime(order.createdAt),
          createdAt: order.createdAt,
          read: order.status !== 'Pending',
          type: 'order',
        });
      });
    });

    crops.forEach((crop) => {
      if (crop.quantity !== null && crop.quantity !== undefined && crop.quantity > 0 && crop.quantity <= 10) {
        notifications.push({
          id: `stock-${crop._id}`,
          message: `Low stock alert: only ${crop.quantity} qtl left for ${crop.name}`,
          time: formatRelativeTime(crop.updatedAt || crop.createdAt),
          createdAt: crop.updatedAt || crop.createdAt,
          read: false,
          type: 'stock',
        });
      }
    });

    notifications.sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

    return res.json({
      stats: {
        totalProducts: crops.length,
        activeListings: crops.filter(isActiveListing).length,
        totalRevenue: Math.round(totalRevenue),
        pendingOrders,
      },
      notifications: notifications.slice(0, 10),
    });
  } catch (error) {
    console.error('Farmer dashboard error:', error.message);
    return res.status(500).json({ message: 'Unable to load farmer dashboard data.' });
  }
};

const FARMER_ORDER_STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

const buildFarmerOrderView = (order, cropIdSet) => {
  const farmerItems = order.items
    .filter((item) => cropIdSet.has(item.crop?.toString()))
    .map((item) => ({
      cropId: item.crop,
      cropName: item.cropName,
      quantity: item.quantity,
      price: item.price,
      lineTotal: Number(item.price || 0) * Number(item.quantity || 0),
    }));

  if (!farmerItems.length) {
    return null;
  }

  const farmerTotal = farmerItems.reduce((sum, item) => sum + item.lineTotal, 0);

  return {
    id: order._id,
    status: order.status,
    paymentMethod: order.paymentMethod,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    timeAgo: formatRelativeTime(order.createdAt),
    buyer: {
      fullName: order.buyer?.fullName || '',
      email: order.buyer?.email || '',
      phone: order.buyer?.phoneNumber || '',
    },
    deliveryAddress: order.deliveryAddress,
    farmerItems,
    farmerTotal: Math.round(farmerTotal),
    orderTotal: order.totalAmount,
  };
};

export const getFarmerOrders = async (req, res) => {
  try {
    const farmerId = req.user.id;
    const { status } = req.query;
    const crops = await Crop.find({ farmer: farmerId }).select('_id');
    const cropIds = crops.map((crop) => crop._id);

    if (!cropIds.length) {
      return res.json({ orders: [], stats: { total: 0, pending: 0, revenue: 0 } });
    }

    const filter = { 'items.crop': { $in: cropIds } };
    if (status && status !== 'all') {
      filter.status = status;
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .populate('buyer', 'fullName email phoneNumber');

    const cropIdSet = new Set(cropIds.map((id) => id.toString()));
    const formattedOrders = orders
      .map((order) => buildFarmerOrderView(order, cropIdSet))
      .filter(Boolean);

    const stats = {
      total: formattedOrders.length,
      pending: formattedOrders.filter((order) => order.status === 'Pending').length,
      revenue: formattedOrders.reduce((sum, order) => sum + order.farmerTotal, 0),
    };

    return res.json({ orders: formattedOrders, stats });
  } catch (error) {
    console.error('Farmer orders error:', error.message);
    return res.status(500).json({ message: 'Unable to load orders.' });
  }
};

export const updateFarmerOrderStatus = async (req, res) => {
  try {
    const farmerId = req.user.id;
    const { id } = req.params;
    const { status } = req.body;

    if (!FARMER_ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const crops = await Crop.find({ farmer: farmerId }).select('_id');
    const cropIdSet = new Set(crops.map((crop) => crop._id.toString()));

    const order = await Order.findById(id).populate('buyer', 'fullName email phoneNumber');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const hasFarmerItems = order.items.some((item) => cropIdSet.has(item.crop?.toString()));
    if (!hasFarmerItems) {
      return res.status(403).json({ message: 'You can only update orders for your crops' });
    }

    order.status = status;
    await order.save();

    const formatted = buildFarmerOrderView(order, cropIdSet);
    return res.json(formatted);
  } catch (error) {
    console.error('Update farmer order error:', error.message);
    return res.status(500).json({ message: 'Unable to update order status.' });
  }
};
