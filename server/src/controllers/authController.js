import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getEnv } from '../config/env.js';

const JWT_EXPIRES_IN = '7d';

const createAuthToken = (user) => {
  const { JWT_SECRET } = getEnv();
  return jwt.sign(
    {
      id: String(user._id),
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

const getUserId = (req) => req.user?.id || req.user?._id;

const normalizeDigits = (value) => String(value || '').replace(/\D/g, '');

const formatUserResponse = (user) => ({
  id: user._id,
  email: user.email,
  role: user.role,
  fullName: user.fullName || '',
  phoneNumber: user.phoneNumber || '',
  address: user.address || '',
  city: user.city || '',
  district: user.district || '',
  state: user.state || '',
  pincode: user.pincode || '',
  farmOrBusinessName: user.farmOrBusinessName || '',
  profilePhoto: user.profilePhoto || '',
});

export const register = async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'Email, password and role are required' });
    }

    if (!['farmer', 'buyer'].includes(role)) {
      return res.status(400).json({ message: 'Role must be farmer or buyer' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();

    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      email: normalizedEmail,
      password: hashedPassword,
      role,
    });

    const token = createAuthToken(user);

    return res.status(201).json({
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Register error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = createAuthToken(user);

    return res.json({
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    console.error('Login error:', error.message);
    return res.status(500).json({ message: 'Server error' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(getUserId(req)).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(formatUserResponse(user));
  } catch (error) {
    console.error('Get profile error:', error.message);
    return res.status(500).json({ message: 'Error fetching profile' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const {
      fullName,
      phoneNumber,
      address,
      city,
      district,
      state,
      pincode,
      farmOrBusinessName,
    } = req.body;

    const updates = {
      fullName: String(fullName || '').trim(),
      phoneNumber: normalizeDigits(phoneNumber),
      address: String(address || '').trim(),
      city: String(city || '').trim(),
      district: String(district || '').trim(),
      state: String(state || '').trim(),
      pincode: normalizeDigits(pincode),
      farmOrBusinessName: String(farmOrBusinessName || '').trim(),
    };

    if (updates.phoneNumber && updates.phoneNumber.length !== 10) {
      return res.status(400).json({ message: 'Phone number must be 10 digits' });
    }

    if (updates.pincode && updates.pincode.length !== 6) {
      return res.status(400).json({ message: 'Pincode must be 6 digits' });
    }

    if (req.file) {
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      updates.profilePhoto = `${baseUrl}/uploads/profiles/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(getUserId(req), updates, {
      returnDocument: 'after',
      runValidators: true,
    }).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.json(formatUserResponse(updatedUser));
  } catch (error) {
    console.error('Update Profile error:', error);
    return res.status(500).json({
      message: error.message || 'Error updating profile',
    });
  }
};
