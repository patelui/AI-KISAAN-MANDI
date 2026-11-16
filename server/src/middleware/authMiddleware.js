import jwt from 'jsonwebtoken';
import { getEnv } from '../config/env.js';

const normalizeAuthHeader = (authHeader) => {
  if (!authHeader || typeof authHeader !== 'string') {
    return '';
  }

  const trimmed = authHeader.trim();
  if (!trimmed.toLowerCase().startsWith('bearer ')) {
    return '';
  }

  return trimmed.slice(7).trim();
};

export const requireAuth = (req, res, next) => {
  const token = normalizeAuthHeader(req.headers.authorization);

  if (!token) {
    return res.status(401).json({ message: 'Authorization token missing' });
  }

  try {
    const { JWT_SECRET } = getEnv();
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = {
      ...decoded,
      id: decoded.id || decoded._id,
    };
    return next();
  } catch (error) {
    const message =
      error.name === 'TokenExpiredError'
        ? 'Session expired. Please log in again.'
        : 'Invalid or expired token';

    return res.status(401).json({ message });
  }
};

export const requireFarmer = (req, res, next) => {
  if (!req.user || req.user.role !== 'farmer') {
    return res.status(403).json({ message: 'Farmer access required' });
  }
  return next();
};

export const requireBuyer = (req, res, next) => {
  if (!req.user || req.user.role !== 'buyer') {
    return res.status(403).json({ message: 'Buyer access required' });
  }
  return next();
};
