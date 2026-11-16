import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import Crop from '../models/Crop.js';
import { resolveBuyerDeliveryAddress } from '../controllers/buyerAddressController.js';

export const calculateCartTotal = (cart) =>
  (cart?.items || []).reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
    0
  );

export const fulfillOrderFromCart = async ({
  buyerId,
  addressId,
  deliveryAddress,
  saveAddress,
  paymentMethod,
  paymentStatus = 'cod',
  razorpayOrderId = '',
  razorpayPaymentId = '',
}) => {
  const cart = await Cart.findOne({ buyer: buyerId }).populate('items.crop');
  if (!cart || !cart.items.length) {
    throw new Error('Cart is empty');
  }

  const resolvedAddress = await resolveBuyerDeliveryAddress(buyerId, {
    addressId,
    deliveryAddress,
    saveAddress,
  });

  const itemsToOrder = [];
  let totalAmount = 0;

  for (const item of cart.items) {
    const crop = item.crop;
    if (!crop) {
      continue;
    }

    if (crop.farmer.toString() === buyerId) {
      throw new Error('You cannot purchase your own crop');
    }

    if (crop.quantity !== null && crop.quantity !== undefined && item.quantity > crop.quantity) {
      throw new Error(`Requested quantity exceeds available stock for ${crop.name}`);
    }

    crop.quantity = (crop.quantity ?? 0) - item.quantity;
    await crop.save();

    itemsToOrder.push({
      crop: crop._id,
      cropName: crop.name,
      quantity: item.quantity,
      price: crop.price,
    });
    totalAmount += crop.price * item.quantity;
  }

  if (!itemsToOrder.length) {
    throw new Error('No valid items in cart');
  }

  const order = await Order.create({
    buyer: buyerId,
    items: itemsToOrder,
    totalAmount,
    deliveryAddress: resolvedAddress,
    paymentMethod: paymentMethod || 'Cash on Delivery',
    paymentStatus,
    razorpayOrderId,
    razorpayPaymentId,
    status: 'Pending',
  });

  await Cart.deleteOne({ buyer: buyerId });

  return order;
};
