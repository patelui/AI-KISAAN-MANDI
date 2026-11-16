import { useEffect, useMemo, useRef, useState } from 'react';
import { FaPaperPlane, FaRobot, FaTrash, FaUser } from 'react-icons/fa';
import BuyerLayout from '../components/Buyer/BuyerLayout';
import { useBuyerAssistant } from '../hooks/useBuyerAssistant';

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Hello! I am your AI Shopping Assistant. I know about your cart, orders, saved addresses, and mandi prices. Ask me anything about buying crops on AI Kisan Mandi.',
  createdAt: new Date().toISOString(),
};

function BuyerAssistantPage() {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const { messages, suggestions, status, loading, error, sendMessage, clearChat, setSuggestions } = useBuyerAssistant();

  const buyerName = useMemo(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('user') || '{}');
      return stored.fullName?.trim() || 'Buyer';
    } catch {
      return 'Buyer';
    }
  }, []);

  const displayMessages = messages.length ? messages : [WELCOME_MESSAGE];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages, loading]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!input.trim()) return;
    const value = input;
    setInput('');
    await sendMessage(value);
  };

  const defaultSuggestions = suggestions.length
    ? suggestions
    : ['What is in my cart?', 'Show my recent orders', 'What are my saved addresses?', 'Compare prices with mandi rates'];

  return (
    <BuyerLayout>
      <div className="space-y-4">
        <section className="rounded-2xl border border-indigo-200 bg-gradient-to-r from-indigo-700 to-violet-700 p-5 text-white shadow-lg">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
              <FaRobot />
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-indigo-100">AI Support</p>
              <h1 className="text-xl font-bold">Shopping Assistant for {buyerName}</h1>
              <p className="text-sm text-indigo-50">Cart, orders, addresses & mandi price help</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between">
            <span className={`rounded-full px-3 py-1 text-xs ${status.aiEnabled ? 'bg-white/20' : 'bg-amber-400/20'}`}>
              {status.aiEnabled ? 'AI enabled' : 'Smart fallback mode'}
            </span>
            <button type="button" onClick={clearChat} className="inline-flex items-center gap-1 rounded-lg border border-white/30 px-3 py-1 text-xs hover:bg-white/10">
              <FaTrash /> Clear chat
            </button>
          </div>
        </section>

        <section className="flex min-h-[28rem] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
            {displayMessages.map((message) => {
              const isUser = message.role === 'user';
              return (
                <div key={message.id} className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isUser ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-indigo-700'}`}>
                    {isUser ? <FaUser className="text-sm" /> : <FaRobot className="text-sm" />}
                  </div>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${isUser ? 'bg-indigo-600 text-white' : 'border border-slate-100 bg-slate-50 text-slate-800'}`}>
                    {message.content}
                  </div>
                </div>
              );
            })}
            {loading && <p className="text-sm text-slate-400">Assistant is typing...</p>}
            <div ref={messagesEndRef} />
          </div>

          {error && <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">{error}</div>}

          <div className="border-t border-slate-100 bg-slate-50/80 p-4">
            <div className="mb-3 flex flex-wrap gap-2">
              {defaultSuggestions.map((suggestion) => (
                <button key={suggestion} type="button" disabled={loading} onClick={() => { setSuggestions([]); sendMessage(suggestion); }} className="rounded-full border border-indigo-200 bg-white px-3 py-1 text-xs font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-50">
                  {suggestion}
                </button>
              ))}
            </div>
            <form onSubmit={handleSubmit} className="flex gap-2">
              <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about cart, orders, addresses..." disabled={loading} className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/80" />
              <button type="submit" disabled={loading || !input.trim()} className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-50">
                <FaPaperPlane /> Send
              </button>
            </form>
          </div>
        </section>
      </div>
    </BuyerLayout>
  );
}

export default BuyerAssistantPage;
