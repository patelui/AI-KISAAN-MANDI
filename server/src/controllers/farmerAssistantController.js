import {
  generateFarmerAssistantReply,
  getFarmerAssistantStatus,
} from '../services/farmerAssistantService.js';

export const postFarmerAssistantChat = async (req, res) => {
  try {
    const { message, history } = req.body || {};

    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const result = await generateFarmerAssistantReply({
      farmerId: req.user.id,
      message,
      history,
    });

    return res.json(result);
  } catch (error) {
    console.error('Farmer assistant chat error:', error.message);
    return res.status(500).json({ message: 'Unable to process your question right now.' });
  }
};

export const getFarmerAssistantInfo = async (req, res) => {
  try {
    const status = getFarmerAssistantStatus();
    return res.json(status);
  } catch (error) {
    return res.status(500).json({ message: 'Unable to load assistant status.' });
  }
};
