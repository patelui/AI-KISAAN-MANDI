import mongoose from 'mongoose';

const cropSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
    },
    quantity: {
      type: Number,
      required: false,
    },
    location: {
      type: String,
      required: false,
      trim: true,
    },
    quality: {
      type: String,
      required: false,
      trim: true,
      default: 'Standard',
    },
    image: {
      type: String,
      required: false,
    },
    farmer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

const Crop = mongoose.model('Crop', cropSchema);

export default Crop;

