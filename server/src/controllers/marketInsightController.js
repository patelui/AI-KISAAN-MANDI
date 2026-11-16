import { getMarketInsight, getMarketPriceTrend } from '../services/marketInsightService.js';

export const getMarketInsightController = async (req, res) => {
  try {
    const insight = await getMarketInsight(req.query);
    return res.json(insight);
  } catch (error) {
    console.error('Market insight error:', error.message);
    return res.status(500).json({ message: 'Unable to fetch latest market data.' });
  }
};

export const getMarketTrendController = async (req, res) => {
  try {
    const trend = await getMarketPriceTrend(req.query);
    return res.json(trend);
  } catch (error) {
    console.error('Market trend error:', error.message);
    return res.status(500).json({ message: 'Unable to fetch market price trend.' });
  }
};
