import {
  generateBuyerAssistantReply,
  getBuyerAssistantStatus,
} from '../services/buyerAssistantService.js';

export const postBuyerAssistantChat = async (req, res) => {
  try {
    const { message, history } = req.body || {};
    if (!message?.trim()) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const result = await generateBuyerAssistantReply({
      buyerId: req.user.id,
      message,
      history,
    });

    return res.json(result);
  } catch (error) {
    console.error('Buyer assistant chat error:', error.message);
    return res.status(500).json({ message: 'Unable to process your question right now.' });
  }
};

export const getBuyerAssistantInfo = async (req, res) => {
  return res.json(getBuyerAssistantStatus());
};
