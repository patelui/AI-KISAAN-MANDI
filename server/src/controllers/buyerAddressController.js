import Address from '../models/Address.js';

const formatAddress = (address) => ({
  id: address._id,
  label: address.label || 'Home',
  fullName: address.fullName,
  phone: address.phone,
  address: address.address,
  city: address.city,
  state: address.state,
  pincode: address.pincode,
  isDefault: Boolean(address.isDefault),
  createdAt: address.createdAt,
  updatedAt: address.updatedAt,
});

const unsetOtherDefaults = async (buyerId, keepId = null) => {
  const filter = { buyer: buyerId, isDefault: true };
  if (keepId) {
    filter._id = { $ne: keepId };
  }
  await Address.updateMany(filter, { isDefault: false });
};

export const getBuyerAddresses = async (req, res) => {
  try {
    const addresses = await Address.find({ buyer: req.user.id }).sort({
      isDefault: -1,
      updatedAt: -1,
    });

    return res.json(addresses.map(formatAddress));
  } catch (error) {
    console.error('Get addresses error:', error.message);
    return res.status(500).json({ message: 'Unable to load addresses.' });
  }
};

export const createBuyerAddress = async (req, res) => {
  try {
    const { label, fullName, phone, address, city, state, pincode, isDefault } = req.body;

    if (!fullName || !phone || !address || !city || !state || !pincode) {
      return res.status(400).json({ message: 'All address fields are required.' });
    }

    const existingCount = await Address.countDocuments({ buyer: req.user.id });
    const shouldBeDefault = isDefault || existingCount === 0;

    if (shouldBeDefault) {
      await unsetOtherDefaults(req.user.id);
    }

    const saved = await Address.create({
      buyer: req.user.id,
      label: label?.trim() || 'Home',
      fullName: fullName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      isDefault: shouldBeDefault,
    });

    return res.status(201).json(formatAddress(saved));
  } catch (error) {
    console.error('Create address error:', error.message);
    return res.status(500).json({ message: 'Unable to save address.' });
  }
};

export const updateBuyerAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const { label, fullName, phone, address, city, state, pincode, isDefault } = req.body;

    const saved = await Address.findOne({ _id: id, buyer: req.user.id });
    if (!saved) {
      return res.status(404).json({ message: 'Address not found.' });
    }

    if (label !== undefined) saved.label = label.trim() || 'Home';
    if (fullName !== undefined) saved.fullName = fullName.trim();
    if (phone !== undefined) saved.phone = phone.trim();
    if (address !== undefined) saved.address = address.trim();
    if (city !== undefined) saved.city = city.trim();
    if (state !== undefined) saved.state = state.trim();
    if (pincode !== undefined) saved.pincode = pincode.trim();

    if (isDefault) {
      await unsetOtherDefaults(req.user.id, saved._id);
      saved.isDefault = true;
    } else if (isDefault === false) {
      saved.isDefault = false;
    }

    await saved.save();
    return res.json(formatAddress(saved));
  } catch (error) {
    console.error('Update address error:', error.message);
    return res.status(500).json({ message: 'Unable to update address.' });
  }
};

export const deleteBuyerAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const saved = await Address.findOneAndDelete({ _id: id, buyer: req.user.id });

    if (!saved) {
      return res.status(404).json({ message: 'Address not found.' });
    }

    if (saved.isDefault) {
      const next = await Address.findOne({ buyer: req.user.id }).sort({ updatedAt: -1 });
      if (next) {
        next.isDefault = true;
        await next.save();
      }
    }

    return res.json({ message: 'Address deleted.' });
  } catch (error) {
    console.error('Delete address error:', error.message);
    return res.status(500).json({ message: 'Unable to delete address.' });
  }
};

export const setDefaultBuyerAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const saved = await Address.findOne({ _id: id, buyer: req.user.id });

    if (!saved) {
      return res.status(404).json({ message: 'Address not found.' });
    }

    await unsetOtherDefaults(req.user.id, saved._id);
    saved.isDefault = true;
    await saved.save();

    return res.json(formatAddress(saved));
  } catch (error) {
    console.error('Set default address error:', error.message);
    return res.status(500).json({ message: 'Unable to set default address.' });
  }
};

export const resolveBuyerDeliveryAddress = async (buyerId, { addressId, deliveryAddress, saveAddress }) => {
  if (addressId) {
    const saved = await Address.findOne({ _id: addressId, buyer: buyerId });
    if (!saved) {
      throw new Error('Selected address not found.');
    }

    return {
      fullName: saved.fullName,
      phone: saved.phone,
      address: saved.address,
      city: saved.city,
      state: saved.state,
      pincode: saved.pincode,
    };
  }

  if (!deliveryAddress) {
    throw new Error('Delivery address is required.');
  }

  const { fullName, phone, address, city, state, pincode, label, isDefault } = deliveryAddress;
  if (!fullName || !phone || !address || !city || !state || !pincode) {
    throw new Error('All delivery address fields are required.');
  }

  if (saveAddress) {
    const existingCount = await Address.countDocuments({ buyer: buyerId });
    const shouldBeDefault = Boolean(isDefault) || existingCount === 0;
    if (shouldBeDefault) {
      await unsetOtherDefaults(buyerId);
    }

    await Address.create({
      buyer: buyerId,
      label: label?.trim() || 'Home',
      fullName: fullName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      isDefault: shouldBeDefault,
    });
  }

  return {
    fullName: fullName.trim(),
    phone: phone.trim(),
    address: address.trim(),
    city: city.trim(),
    state: state.trim(),
    pincode: pincode.trim(),
  };
};
