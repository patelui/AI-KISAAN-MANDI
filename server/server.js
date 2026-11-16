import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getEnv } from './src/config/env.js';
import authRoutes from './src/routes/authRoutes.js';
import cropRoutes from './src/routes/cropRoutes.js';
import buyerRoutes from './src/routes/buyerRoutes.js';
import farmerRoutes from './src/routes/farmerRoutes.js';
import marketInsightRoutes from './src/routes/marketInsightRoutes.js';
import { getMarketInsightController, getMarketTrendController } from './src/controllers/marketInsightController.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { MONGO_URI, PORT } = getEnv();

const app = express();

const allowedOrigins = new Set([
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
]);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.has(origin) || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'AI-Kisaan Mandi API running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/crops', cropRoutes);
app.use('/api/buyer', buyerRoutes);
app.use('/api/farmer', farmerRoutes);
app.get('/api/market-insights/trend', getMarketTrendController);
app.get('/api/market-insights', getMarketInsightController);
app.get('/api/market-insights/', getMarketInsightController);
app.use('/api/market-insights', marketInsightRoutes);

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log('Auth: using JWT_SECRET from server/.env');
    });
  })
  .catch((err) => {
    console.error('Could not connect to MongoDB:', err.message);
    process.exit(1);
  });
