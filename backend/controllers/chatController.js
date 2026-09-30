// backend/controllers/chatController.js
const ChatLog = require('../models/ChatLog');

// Wire your real AI provider here (Anthropic API, OpenAI, etc.) using an API key from env.
// Until AI_API_KEY is set, the assistant replies with a canned fallback so the widget still works.
async function getAiReply(message, history) {
  if (!process.env.AI_API_KEY) {
    return "Thanks for your message! Our AI assistant isn't fully configured yet — a team member will follow up on WhatsApp shortly.";
  }
  // TODO: call your AI provider's chat/completions endpoint here with `message` and `history`,
  // then return the model's text reply.
  return "AI assistant response placeholder.";
}

exports.chat = async (req, res) => {
  const { message, sessionId } = req.body;
  if (!message || !sessionId) return res.status(400).json({ error: 'message and sessionId are required' });

  const userId = req.user ? req.user._id : null;
  await ChatLog.create({ userId, sessionId, role: 'user', message });

  const history = await ChatLog.find({ sessionId }).sort({ createdAt: 1 }).limit(20);
  const reply = await getAiReply(message, history);

  await ChatLog.create({ userId, sessionId, role: 'assistant', message: reply });
  res.json({ reply });
};
