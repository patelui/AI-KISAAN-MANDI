import mongoose from 'mongoose';
import { getEnv } from './src/config/env.js';

async function verify() {
  try {
    const { MONGO_URI } = getEnv();
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB for verification');

    const crops = await mongoose.connection.db.collection('crops').find({}).toArray();

    console.log(`\nTotal Crops Listed in Database: ${crops.length}`);

    if (crops.length > 0) {
      crops.forEach((c) =>
        console.log(`- Crop: ${c.name} | Price: Rs.${c.price} | Qty: ${c.quantity || 'N/A'}`)
      );
      console.log('\nData is successfully reaching the database.');
    } else {
      console.log('\nNo crops found yet. List a crop from the Farmer Dashboard first.');
    }

    process.exit(0);
  } catch (err) {
    console.error('Error during verification:', err.message);
    process.exit(1);
  }
}

verify();
