import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import Address from '../models/Address.js';
import Crop from '../models/Crop.js';
import { fulfillOrderFromCart } from '../services/orderService.js';

export const getBuyerDashboard = async (req, res) => {
  try {
    const buyerId = req.user.id;
    const [orders, cart, addresses] = await Promise.all([
      Order.find({ buyer: buyerId }).sort({ createdAt: -1 }).limit(20),
      Cart.findOne({ buyer: buyerId }).populate('items.crop'),
      Address.find({ buyer: buyerId }),
    ]);

    const cartItems = cart?.items || [];
    const cartTotal = cartItems.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0
    );
    const totalSpent = orders.reduce((sum, order) => sum + Number(order.totalAmount || 0), 0);
    const pendingOrders = orders.filter((order) => order.status === 'Pending').length;

    return res.json({
      stats: {
        cartItems: cartItems.length,
        cartTotal: Math.round(cartTotal),
        totalOrders: orders.length,
        pendingOrders,
        totalSpent: Math.round(totalSpent),
        savedAddresses: addresses.length,
      },
      recentOrders: orders.slice(0, 5).map((order) => ({
        id: order._id,
        status: order.status,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
        items: order.items,
      })),
    });
  } catch (error) {
    console.error('Buyer dashboard error:', error.message);
    return res.status(500).json({ message: 'Unable to load buyer dashboard.' });
  }
};

export const getBuyerCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ buyer: req.user.id }).populate({
      path: 'items.crop',
      populate: { path: 'farmer', select: 'fullName email' },
    });

    return res.json(cart || { buyer: req.user.id, items: [] });
  } catch (error) {
    console.error('Get cart error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { cropId, quantity = 1 } = req.body;

    if (!cropId) {
      return res.status(400).json({ message: 'Crop is required' });
    }

    const crop = await Crop.findById(cropId);
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    if (crop.farmer.toString() === req.user.id) {
      return res.status(400).json({ message: 'You cannot purchase your own crop' });
    }

    const requestedQuantity = Number(quantity);
    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    if (crop.quantity !== null && crop.quantity !== undefined && requestedQuantity > crop.quantity) {
      return res.status(400).json({ message: 'Requested quantity exceeds available stock' });
    }

    let cart = await Cart.findOne({ buyer: req.user.id });
    if (!cart) {
      cart = await Cart.create({ buyer: req.user.id, items: [] });
    }

    const existingItem = cart.items.find((item) => item.crop.toString() === cropId);
    if (existingItem) {
      const nextQuantity = existingItem.quantity + requestedQuantity;
      if (crop.quantity !== null && crop.quantity !== undefined && nextQuantity > crop.quantity) {
        return res.status(400).json({ message: 'Requested quantity exceeds available stock' });
      }
      existingItem.quantity = nextQuantity;
      existingItem.price = crop.price;
    } else {
      cart.items.push({ crop: cropId, quantity: requestedQuantity, price: crop.price });
    }

    await cart.save();
    const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.crop',
      populate: { path: 'farmer', select: 'fullName email' },
    });

    return res.status(201).json(populatedCart);
  } catch (error) {
    console.error('Add to cart error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const cart = await Cart.findOne({ buyer: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    const item = cart.items.id(id);
    if (!item) {
      return res.status(404).json({ message: 'Cart item not found' });
    }

    const crop = await Crop.findById(item.crop);
    if (!crop) {
      return res.status(404).json({ message: 'Crop not found' });
    }

    const requestedQuantity = Number(quantity);
    if (!Number.isInteger(requestedQuantity) || requestedQuantity < 1) {
      return res.status(400).json({ message: 'Quantity must be at least 1' });
    }

    if (crop.quantity !== null && crop.quantity !== undefined && requestedQuantity > crop.quantity) {
      return res.status(400).json({ message: 'Requested quantity exceeds available stock' });
    }

    item.quantity = requestedQuantity;
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.crop',
      populate: { path: 'farmer', select: 'fullName email' },
    });

    return res.json(populatedCart);
  } catch (error) {
    console.error('Update cart error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const deleteCartItem = async (req, res) => {
  try {
    const { id } = req.params;
    const cart = await Cart.findOne({ buyer: req.user.id });
    if (!cart) {
      return res.status(404).json({ message: 'Cart not found' });
    }

    cart.items = cart.items.filter((item) => item._id.toString() !== id);
    await cart.save();

    const populatedCart = await Cart.findById(cart._id).populate({
      path: 'items.crop',
      populate: { path: 'farmer', select: 'fullName email' },
    });

    return res.json(populatedCart);
  } catch (error) {
    console.error('Delete cart error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const placeOrder = async (req, res) => {
  try {
    const { deliveryAddress, addressId, saveAddress, paymentMethod = 'Cash on Delivery' } = req.body;

    const order = await fulfillOrderFromCart({
      buyerId: req.user.id,
      addressId,
      deliveryAddress,
      saveAddress,
      paymentMethod,
      paymentStatus: 'cod',
    });

    return res.status(201).json(order);
  } catch (error) {
    const status = /empty|cannot|exceeds|required/i.test(error.message) ? 400 : 500;
    console.error('Place order error:', error.message);
    return res.status(status).json({ message: error.message || 'Server error' });
  }
};

export const getBuyerOrders = async (req, res) => {
  try {
    const orders = await Order.find({ buyer: req.user.id }).sort({ createdAt: -1 });
    return res.json(orders);
  } catch (error) {
    console.error('Get orders error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};
