import mongoose from 'mongoose';

const pendingPaymentSchema = new mongoose.Schema(
  {
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    addressId: String,
    deliveryAddress: {
      fullName: String,
      phone: String,
      address: String,
      city: String,
      state: String,
      pincode: String,
      label: String,
      isDefault: Boolean,
    },
    saveAddress: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed'],
      default: 'created',
    },
  },
  { timestamps: true }
);

const PendingPayment = mongoose.model('PendingPayment', pendingPaymentSchema);

export default PendingPayment;
