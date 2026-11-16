import Cart from '../models/Cart.js';
import Order from '../models/Order.js';
import Address from '../models/Address.js';
import User from '../models/User.js';
import Crop from '../models/Crop.js';
import { getMarketInsight } from '../services/marketInsightService.js';

const readEnvValue = (value) => {
  if (typeof value !== 'string') {
    return '';
  }
  return value.trim().replace(/^['"]|['"]$/g, '');
};

const GEMINI_MODEL_FALLBACKS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash-lite',
];

export const buildBuyerAssistantContext = async (buyerId) => {
  const [user, cart, orders, addresses] = await Promise.all([
    User.findById(buyerId).select('-password'),
    Cart.findOne({ buyer: buyerId }).populate({
      path: 'items.crop',
      populate: { path: 'farmer', select: 'fullName email' },
    }),
    Order.find({ buyer: buyerId }).sort({ createdAt: -1 }).limit(10),
    Address.find({ buyer: buyerId }).sort({ isDefault: -1, updatedAt: -1 }),
  ]);

  if (!user) {
    throw new Error('Buyer profile not found');
  }

  const cartItems = (cart?.items || []).map((item, index) => ({
    name: item.crop?.name || 'Unknown crop',
    quantity: item.quantity,
    price: item.price,
    farmer: item.crop?.farmer?.fullName || item.crop?.farmer?.email || 'Unknown',
    location: item.crop?.location || 'India',
  }));

  const cartText = cartItems.length
    ? cartItems
        .map(
          (item, index) =>
            `${index + 1}. ${item.name} — ${item.quantity} qtl @ ₹${Number(item.price).toLocaleString('en-IN')}/qtl from ${item.farmer} (${item.location})`
        )
        .join('\n')
    : 'Cart is empty.';

  const ordersText = orders.length
    ? orders
        .slice(0, 5)
        .map(
          (order, index) =>
            `${index + 1}. Order ${order.status} — ₹${Number(order.totalAmount).toLocaleString('en-IN')} on ${new Date(order.createdAt).toLocaleDateString('en-IN')} (${order.items.map((i) => i.cropName).join(', ')})`
        )
        .join('\n')
    : 'No orders placed yet.';

  const addressesText = addresses.length
    ? addresses
        .map(
          (addr, index) =>
            `${index + 1}. ${addr.label}${addr.isDefault ? ' (default)' : ''}: ${addr.fullName}, ${addr.address}, ${addr.city}, ${addr.state} - ${addr.pincode}`
        )
        .join('\n')
    : 'No saved addresses yet.';

  const state = user.state?.trim() || addresses[0]?.state || 'Gujarat';
  const district = user.district?.trim() || user.city?.trim() || addresses[0]?.city || 'Vadodara';

  const cropNames = [...new Set(cartItems.map((item) => item.name).filter(Boolean))].slice(0, 3);
  let marketText = 'No crops in cart for mandi comparison.';

  if (cropNames.length) {
    const insights = await Promise.all(
      cropNames.map(async (name) => {
        const insight = await getMarketInsight({ commodity: name, state, district });
        return `${insight.commodity}: mandi modal ₹${insight.modalPrice}/qtl at ${insight.market} (${insight.trend})`;
      })
    );
    marketText = insights.join('\n');
  } else {
    const insight = await getMarketInsight({ commodity: 'Wheat', state, district });
    marketText = `Sample mandi rate: ${insight.commodity} ₹${insight.modalPrice}/qtl at ${insight.market}`;
  }

  const totalListings = await Crop.countDocuments();

  return {
    profile: {
      name: user.fullName?.trim() || user.email,
      email: user.email,
      phone: user.phoneNumber || '',
      location: [user.city, user.district, user.state].filter(Boolean).join(', ') || 'India',
    },
    stats: {
      cartItems: cartItems.length,
      cartTotal: Math.round(
        cartItems.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0)
      ),
      totalOrders: orders.length,
      pendingOrders: orders.filter((order) => order.status === 'Pending').length,
      savedAddresses: addresses.length,
      marketplaceListings: totalListings,
    },
    cartText,
    ordersText,
    addressesText,
    marketText,
  };
};

const buildSystemPrompt = (context) => `You are Kisaan AI Shopping Assistant for AI Kisan Mandi — helping Indian buyers purchase fresh crops from farmers.

Use ONLY the buyer data below. If information is missing, say so and guide them to Cart, Orders, or Address Book pages.

Buyer profile:
- Name: ${context.profile.name}
- Email: ${context.profile.email}
- Phone: ${context.profile.phone || 'Not set'}
- Location: ${context.profile.location}

Shopping stats:
- Cart items: ${context.stats.cartItems}
- Cart total: ₹${context.stats.cartTotal.toLocaleString('en-IN')}
- Total orders: ${context.stats.totalOrders}
- Pending orders: ${context.stats.pendingOrders}
- Saved addresses: ${context.stats.savedAddresses}
- Marketplace listings available: ${context.stats.marketplaceListings}

Current cart:
${context.cartText}

Recent orders:
${context.ordersText}

Saved addresses:
${context.addressesText}

Mandi reference prices:
${context.marketText}

Guidelines:
- Be concise, friendly, and practical.
- Help with finding crops, comparing prices with mandi rates, cart, checkout, orders, and saved addresses.
- Never invent orders or prices not shown above.
- Keep replies under 200 words unless asked for detail.`;

const sanitizeHistory = (history = []) =>
  history
    .filter((item) => item && ['user', 'assistant'].includes(item.role) && typeof item.content === 'string')
    .slice(-8)
    .map((item) => ({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: item.content.trim().slice(0, 2000),
    }));

const callGeminiWithModel = async (apiKey, model, systemPrompt, history, message) => {
  const contents = [
    ...history.map((item) => ({
      role: item.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: item.content }],
    })),
    { role: 'user', parts: [{ text: message }] },
  ];

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { temperature: 0.6, maxOutputTokens: 800 },
      }),
    }
  );

  const responseText = await response.text();
  if (!response.ok) {
    const error = new Error(`Gemini API error (${model}): ${response.status}`);
    error.status = response.status;
    throw error;
  }

  const data = JSON.parse(responseText);
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
};

const callGemini = async (systemPrompt, history, message) => {
  const apiKey = readEnvValue(process.env.GEMINI_API_KEY);
  if (!apiKey) return null;

  const preferredModel = readEnvValue(process.env.GEMINI_MODEL);
  const modelsToTry = [...(preferredModel ? [preferredModel] : []), ...GEMINI_MODEL_FALLBACKS].filter(
    (model, index, list) => model && list.indexOf(model) === index
  );

  for (const model of modelsToTry) {
    try {
      const reply = await callGeminiWithModel(apiKey, model, systemPrompt, history, message);
      if (reply) return { reply, model };
    } catch (error) {
      if (![404, 429, 503].includes(error.status)) throw error;
    }
  }
  return null;
};

const buildFallbackReply = (context, message) => {
  const text = message.toLowerCase();
  const name = context.profile.name;

  if (/^(hi|hello|hey|namaste)/i.test(text)) {
    return `Hello ${name}! I am your shopping assistant. You have ${context.stats.cartItems} item(s) in cart and ${context.stats.savedAddresses} saved address(es). Ask me about crops, orders, or checkout.`;
  }

  if (/cart|basket/i.test(text)) {
    return context.stats.cartItems
      ? `Your cart:\n${context.cartText}\n\nTotal: ₹${context.stats.cartTotal.toLocaleString('en-IN')}`
      : 'Your cart is empty. Browse the marketplace to add fresh crops.';
  }

  if (/order|delivery|status/i.test(text)) {
    return context.stats.totalOrders
      ? `Your orders:\n${context.ordersText}\n\nPending orders: ${context.stats.pendingOrders}`
      : 'You have not placed any orders yet. Add crops to cart and checkout.';
  }

  if (/address|shipping|deliver/i.test(text)) {
    return context.stats.savedAddresses
      ? `Saved addresses:\n${context.addressesText}`
      : 'No saved addresses yet. Go to Address Book to save shipping addresses for faster checkout.';
  }

  if (/price|mandi|cheap|rate/i.test(text)) {
    return `Mandi reference prices:\n${context.marketText}\n\nCompare listing prices in the marketplace before buying.`;
  }

  return `Hi ${name}, I can help with your cart, orders, saved addresses, and crop prices. Try:\n• "What is in my cart?"\n• "Show my orders"\n• "What are my saved addresses?"\n• "Is wheat price good today?"`;
};

export const getAssistantSuggestions = (context) => {
  const suggestions = [];
  if (context.stats.cartItems > 0) suggestions.push('What is in my cart?');
  else suggestions.push('What crops are available?');
  if (context.stats.totalOrders > 0) suggestions.push('Show my recent orders');
  if (context.stats.savedAddresses > 0) suggestions.push('What are my saved addresses?');
  else suggestions.push('How do I save a shipping address?');
  suggestions.push('Compare prices with mandi rates');
  return suggestions.slice(0, 4);
};

export const generateBuyerAssistantReply = async ({ buyerId, message, history = [] }) => {
  const trimmedMessage = message?.trim();
  if (!trimmedMessage) throw new Error('Message is required');

  const context = await buildBuyerAssistantContext(buyerId);
  const systemPrompt = buildSystemPrompt(context);
  const safeHistory = sanitizeHistory(history);

  let reply = null;
  let source = 'fallback';

  try {
    if (readEnvValue(process.env.GEMINI_API_KEY)) {
      const geminiResult = await callGemini(systemPrompt, safeHistory, trimmedMessage);
      if (geminiResult?.reply) {
        reply = geminiResult.reply;
        source = `gemini:${geminiResult.model}`;
      }
    }
  } catch (error) {
    console.error('Buyer AI assistant error:', error.message);
  }

  if (!reply) {
    reply = buildFallbackReply(context, trimmedMessage);
    source = 'fallback';
  }

  return { reply, source, suggestions: getAssistantSuggestions(context) };
};

export const getBuyerAssistantStatus = () => {
  const hasGemini = Boolean(readEnvValue(process.env.GEMINI_API_KEY));
  return {
    aiEnabled: hasGemini,
    provider: hasGemini ? 'gemini' : 'fallback',
    message: hasGemini ? 'AI shopping assistant is active' : 'Using built-in shopping answers.',
  };
};
