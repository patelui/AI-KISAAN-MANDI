import User from '../models/User.js';
import Crop from '../models/Crop.js';
import Order from '../models/Order.js';
import { getMarketInsight, getMarketPriceTrend } from './marketInsightService.js';

const DEFAULT_STATE = 'Gujarat';
const DEFAULT_DISTRICT = 'Vadodara';

const GEMINI_MODEL_FALLBACKS = [
  'gemini-2.5-flash',
  'gemini-flash-latest',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
];

const readEnvValue = (value) => {
  if (typeof value !== 'string') {
    return '';
  }

  return value.trim().replace(/^['"]|['"]$/g, '');
};

const formatListings = (crops) => {
  if (!crops.length) {
    return 'No active crop listings.';
  }

  return crops
    .map((crop, index) => {
      const quantity =
        crop.quantity === null || crop.quantity === undefined
          ? 'quantity not set'
          : `${crop.quantity} qtl`;
      return `${index + 1}. ${crop.name} — ₹${Number(crop.price || 0).toLocaleString('en-IN')}/qtl, ${quantity}, quality: ${crop.quality || 'Standard'}, location: ${crop.location || 'India'}`;
    })
    .join('\n');
};

const buildMarketContext = async (crops, state, district) => {
  const uniqueNames = [...new Set(crops.map((crop) => crop.name).filter(Boolean))].slice(0, 5);

  if (!uniqueNames.length) {
    const insight = await getMarketInsight({
      commodity: 'Wheat',
      state,
      district,
    });

    return `No crop listings yet. Sample mandi rate nearby: ${insight.commodity} at ${insight.market} — modal ₹${insight.modalPrice}/qtl (${insight.trend}).`;
  }

  const insights = await Promise.all(
    uniqueNames.map(async (name) => {
      const insight = await getMarketInsight({ commodity: name, state, district });
      let trendLine = `${insight.commodity}: modal ₹${insight.modalPrice}/qtl at ${insight.market}, trend ${insight.trend}`;

      try {
        const trend = await getMarketPriceTrend({
          commodity: name,
          state,
          district,
          period: '30d',
        });
        trendLine += `, 30d recommendation: ${trend.recommendation?.label || 'monitor'} (${trend.recommendation?.reason || 'based on recent movement'})`;
      } catch {
        // ignore trend failures for individual crops
      }

      return trendLine;
    })
  );

  return insights.join('\n');
};

export const buildFarmerAssistantContext = async (farmerId) => {
  const [user, crops] = await Promise.all([
    User.findById(farmerId).select('-password'),
    Crop.find({ farmer: farmerId }).sort({ createdAt: -1 }),
  ]);

  if (!user) {
    throw new Error('Farmer profile not found');
  }

  const cropIds = crops.map((crop) => crop._id);
  const orders = cropIds.length
    ? await Order.find({ 'items.crop': { $in: cropIds } }).sort({ createdAt: -1 }).limit(20)
    : [];

  const cropIdSet = new Set(cropIds.map((id) => id.toString()));
  let totalRevenue = 0;
  let pendingOrders = 0;

  orders.forEach((order) => {
    const farmerItems = order.items.filter((item) => cropIdSet.has(item.crop?.toString()));
    if (!farmerItems.length) {
      return;
    }

    totalRevenue += farmerItems.reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0),
      0
    );

    if (order.status === 'Pending') {
      pendingOrders += 1;
    }
  });

  const state = user.state?.trim() || DEFAULT_STATE;
  const district = user.district?.trim() || user.city?.trim() || DEFAULT_DISTRICT;
  const marketContext = await buildMarketContext(crops, state, district);

  const lowStock = crops.filter(
    (crop) => crop.quantity !== null && crop.quantity !== undefined && crop.quantity > 0 && crop.quantity <= 10
  );

  return {
    profile: {
      name: user.fullName?.trim() || user.farmOrBusinessName?.trim() || user.email,
      farmOrBusinessName: user.farmOrBusinessName || '',
      email: user.email,
      phone: user.phoneNumber || '',
      location: [user.city, user.district, user.state, user.pincode].filter(Boolean).join(', ') || 'India',
      state,
      district,
    },
    stats: {
      totalListings: crops.length,
      activeListings: crops.filter((crop) => {
        if (crop.quantity === null || crop.quantity === undefined) {
          return true;
        }
        return Number(crop.quantity) > 0;
      }).length,
      totalRevenue: Math.round(totalRevenue),
      pendingOrders,
      recentOrders: orders.length,
    },
    listingsText: formatListings(crops),
    marketText: marketContext,
    alertsText: lowStock.length
      ? lowStock.map((crop) => `${crop.name}: only ${crop.quantity} qtl left`).join('; ')
      : 'No low-stock alerts.',
  };
};

const buildSystemPrompt = (context) => `You are Kisaan AI Assistant for AI Kisaan Mandi — a helpful farming and mandi advisor for Indian farmers.

You ONLY answer using the farmer data below. If something is not in the data, say you do not have that information and suggest checking My Crops or Analytics pages.

Farmer profile:
- Name: ${context.profile.name}
- Farm/Business: ${context.profile.farmOrBusinessName || 'Not set'}
- Location: ${context.profile.location}
- State/District for mandi: ${context.profile.state}, ${context.profile.district}

Dashboard stats:
- Total listings: ${context.stats.totalListings}
- Active listings: ${context.stats.activeListings}
- Revenue from orders: ₹${context.stats.totalRevenue.toLocaleString('en-IN')}
- Pending orders: ${context.stats.pendingOrders}

Crop listings:
${context.listingsText}

Mandi market insights (for farmer's crops/region):
${context.marketText}

Alerts:
${context.alertsText}

Guidelines:
- Be concise, practical, and friendly. Use simple English; you may mix common Hindi farming terms when helpful.
- Give actionable advice on pricing, when to sell, stock levels, and listing improvements.
- Compare farmer's listed price with mandi modal price when relevant.
- Never invent orders, crops, or prices not shown above.
- Keep replies under 200 words unless the farmer asks for detail.`;

const sanitizeHistory = (history = []) =>
  history
    .filter((item) => item && ['user', 'assistant'].includes(item.role) && typeof item.content === 'string')
    .slice(-8)
    .map((item) => ({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: item.content.trim().slice(0, 2000),
    }));

const callGroq = async (systemPrompt, history, message) => {
  const apiKey = readEnvValue(process.env.GROQ_API_KEY);
  if (!apiKey) {
    return null;
  }

  const model = readEnvValue(process.env.GROQ_MODEL) || 'llama-3.3-70b-versatile';
  const messages = [
    { role: 'system', content: systemPrompt },
    ...history.map((item) => ({
      role: item.role === 'assistant' ? 'assistant' : 'user',
      content: item.content,
    })),
    { role: 'user', content: message },
  ];

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: 0.6,
      max_tokens: 800,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} ${errorText.slice(0, 200)}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || null;
};

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
        generationConfig: {
          temperature: 0.6,
          maxOutputTokens: 800,
        },
      }),
    }
  );

  const responseText = await response.text();

  if (!response.ok) {
    const error = new Error(`Gemini API error (${model}): ${response.status} ${responseText.slice(0, 200)}`);
    error.status = response.status;
    throw error;
  }

  const data = JSON.parse(responseText);
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || null;
};

const callGemini = async (systemPrompt, history, message) => {
  const apiKey = readEnvValue(process.env.GEMINI_API_KEY);
  if (!apiKey) {
    return null;
  }

  const preferredModel = readEnvValue(process.env.GEMINI_MODEL);
  const modelsToTry = [
    ...(preferredModel ? [preferredModel] : []),
    ...GEMINI_MODEL_FALLBACKS,
  ].filter((model, index, list) => model && list.indexOf(model) === index);

  let lastError = null;

  for (const model of modelsToTry) {
    try {
      const reply = await callGeminiWithModel(apiKey, model, systemPrompt, history, message);
      if (reply) {
        return { reply, model };
      }
    } catch (error) {
      lastError = error;
      const retryable = error.status === 404 || error.status === 429 || error.status === 503;
      if (!retryable) {
        throw error;
      }
    }
  }

  if (lastError) {
    throw lastError;
  }

  return null;
};

const buildFallbackReply = (context, message) => {
  const text = message.toLowerCase();
  const name = context.profile.name;

  if (/^(hi|hello|hey|namaste|नमस्ते)/i.test(text)) {
    return `Namaste ${name}! I am your Kisaan AI Assistant. You have ${context.stats.activeListings} active listing(s) and ₹${context.stats.totalRevenue.toLocaleString('en-IN')} revenue. Ask me about your crops, mandi prices, or selling advice.`;
  }

  if (/listing|crop|stock|inventory|मेरी फसल|फसल/i.test(text)) {
    if (context.stats.totalListings === 0) {
      return `${name}, you have no crop listings yet. Go to My Crops to add your first listing. I can then compare your price with nearby mandi rates.`;
    }
    return `Here are your listings:\n${context.listingsText}\n\nAlerts: ${context.alertsText}`;
  }

  if (/revenue|order|earning|pending|बिक्री/i.test(text)) {
    return `Your dashboard summary:\n- Active listings: ${context.stats.activeListings}\n- Total revenue: ₹${context.stats.totalRevenue.toLocaleString('en-IN')}\n- Pending orders: ${context.stats.pendingOrders}\n\nCheck Notifications on your dashboard for recent order updates.`;
  }

  if (/price|mandi|market|rate|बाजार|भाव/i.test(text)) {
    return `Mandi insights for your region (${context.profile.state}, ${context.profile.district}):\n${context.marketText}\n\nTip: Open Analytics for detailed price trend charts.`;
  }

  if (/sell|when|suggestion|advice|कब बेच|सलाह/i.test(text)) {
    return `Selling suggestions based on your data:\n${context.marketText}\n\nCompare your listing price with the mandi modal price. If mandi rates are rising, you may hold briefly; if your price is much higher than mandi, consider adjusting for faster sales.`;
  }

  if (/profile|location|contact|मेरा/i.test(text)) {
    return `Your profile:\n- Name: ${context.profile.name}\n- Farm: ${context.profile.farmOrBusinessName || 'Not set'}\n- Location: ${context.profile.location}\n- Phone: ${context.profile.phone || 'Not set'}`;
  }

  return `Hi ${name}, I can help with your listings, mandi prices, orders, and selling tips. Try asking:\n• "What are my crop listings?"\n• "What is the mandi price for my crops?"\n• "Should I sell now?"\n• "How are my orders?"\n\nFor smarter answers, add a free GROQ_API_KEY or GEMINI_API_KEY in server/.env.`;
};

export const getAssistantSuggestions = (context) => {
  const suggestions = ['What are my crop listings?', 'What are the mandi prices today?'];

  if (context.stats.pendingOrders > 0) {
    suggestions.push('Do I have pending orders?');
  }

  if (context.stats.totalListings > 0) {
    suggestions.push('Should I sell my crops now?');
  } else {
    suggestions.push('How do I add a new crop listing?');
  }

  return suggestions.slice(0, 4);
};

export const generateFarmerAssistantReply = async ({ farmerId, message, history = [] }) => {
  const trimmedMessage = message?.trim();
  if (!trimmedMessage) {
    throw new Error('Message is required');
  }

  const context = await buildFarmerAssistantContext(farmerId);
  const systemPrompt = buildSystemPrompt(context);
  const safeHistory = sanitizeHistory(history);

  let reply = null;
  let source = 'fallback';

  const provider = (readEnvValue(process.env.AI_PROVIDER) || 'auto').toLowerCase();
  const tryGroq = provider === 'groq' || provider === 'auto';
  const tryGemini = provider === 'gemini' || provider === 'auto';

  try {
    if (tryGroq && readEnvValue(process.env.GROQ_API_KEY)) {
      reply = await callGroq(systemPrompt, safeHistory, trimmedMessage);
      if (reply) {
        source = 'groq';
      }
    }

    if (!reply && tryGemini && readEnvValue(process.env.GEMINI_API_KEY)) {
      const geminiResult = await callGemini(systemPrompt, safeHistory, trimmedMessage);
      if (typeof geminiResult === 'string') {
        reply = geminiResult;
        source = 'gemini';
      } else if (geminiResult?.reply) {
        reply = geminiResult.reply;
        source = `gemini:${geminiResult.model}`;
      }
    }
  } catch (error) {
    console.error('AI assistant error:', error.message);
    reply = null;
  }

  if (!reply) {
    reply = buildFallbackReply(context, trimmedMessage);
    source = 'fallback';
  }

  return {
    reply,
    source,
    suggestions: getAssistantSuggestions(context),
  };
};

export const getFarmerAssistantStatus = () => {
  const hasGroq = Boolean(readEnvValue(process.env.GROQ_API_KEY));
  const hasGemini = Boolean(readEnvValue(process.env.GEMINI_API_KEY));

  return {
    aiEnabled: hasGroq || hasGemini,
    provider: hasGroq ? 'groq' : hasGemini ? 'gemini' : 'fallback',
    model: hasGemini ? readEnvValue(process.env.GEMINI_MODEL) || GEMINI_MODEL_FALLBACKS[0] : '',
    message: hasGroq || hasGemini
      ? 'AI assistant is active'
      : 'Using built-in answers. Add GROQ_API_KEY or GEMINI_API_KEY in server/.env for smarter replies.',
  };
};
