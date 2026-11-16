import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaPaperPlane,
  FaRobot,
  FaTrash,
  FaUser,
} from 'react-icons/fa';
import Header from '../components/Header/Header';
import Sidebar from '../components/Sidebar/Sidebar';
import { useFarmerAssistant } from '../hooks/useFarmerAssistant';

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Namaste! I am your Kisaan AI Assistant. I know about your profile, crop listings, orders, and mandi prices. Ask me anything about selling, pricing, or your farm business.',
  createdAt: new Date().toISOString(),
};

function FarmerAssistantPage() {
  const navigate = useNavigate();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const {
    messages,
    suggestions,
    status,
    loading,
    error,
    sendMessage,
    clearChat,
    setSuggestions,
  } = useFarmerAssistant();

  const farmerName = useMemo(() => {
    try {
      const stored = localStorage.getItem('user');
      if (!stored) {
        return 'Farmer';
      }
      const parsed = JSON.parse(stored);
      return parsed.fullName?.trim() || parsed.farmOrBusinessName?.trim() || 'Farmer';
    } catch {
      return 'Farmer';
    }
  }, []);

  const displayMessages = messages.length ? messages : [WELCOME_MESSAGE];

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/');
      return;
    }

    try {
      const parsed = JSON.parse(user);
      if (parsed.role !== 'farmer') {
        navigate('/');
      }
    } catch {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [displayMessages, loading]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!input.trim()) {
      return;
    }

    const value = input;
    setInput('');
    await sendMessage(value);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const defaultSuggestions = suggestions.length
    ? suggestions
    : [
        'What are my crop listings?',
        'What are the mandi prices today?',
        'Should I sell my crops now?',
        'How are my orders?',
      ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex flex-1 flex-col">
        <Header onLogout={handleLogout} />
        <main className="flex flex-1 flex-col p-4 sm:p-6">
          <section className="mb-4 rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-800 to-teal-700 p-5 text-white shadow-lg sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20">
                  <FaRobot className="text-2xl" />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-100">
                    AI Support
                  </p>
                  <h1 className="text-xl font-bold sm:text-2xl">Kisaan AI Assistant</h1>
                  <p className="mt-1 text-sm text-emerald-50">
                    Personalized help for {farmerName} — listings, mandi rates & selling tips
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    status.aiEnabled ? 'bg-emerald-500/30 text-emerald-50' : 'bg-amber-500/30 text-amber-50'
                  }`}
                >
                  {status.aiEnabled ? 'AI enabled' : 'Smart fallback mode'}
                </span>
                <button
                  type="button"
                  onClick={clearChat}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-medium transition hover:bg-white/20"
                >
                  <FaTrash />
                  Clear chat
                </button>
              </div>
            </div>
            {!status.aiEnabled && (
              <p className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-xs text-emerald-50">
                {status.message}
              </p>
            )}
          </section>

          <section className="flex min-h-[28rem] flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
              {displayMessages.map((message) => {
                const isUser = message.role === 'user';
                return (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
                  >
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                        isUser ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-emerald-700'
                      }`}
                    >
                      {isUser ? <FaUser className="text-sm" /> : <FaRobot className="text-sm" />}
                    </div>
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap sm:max-w-[75%] ${
                        isUser
                          ? 'bg-emerald-600 text-white'
                          : 'border border-slate-100 bg-slate-50 text-slate-800'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                );
              })}

              {loading && (
                <div className="flex gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-emerald-700">
                    <FaRobot className="text-sm" />
                  </div>
                  <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500" />
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {error && (
              <div className="border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-red-600">
                {error}
              </div>
            )}

            <div className="border-t border-slate-100 bg-slate-50/80 p-4">
              <div className="mb-3 flex flex-wrap gap-2">
                {defaultSuggestions.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    disabled={loading}
                    onClick={() => {
                      setSuggestions([]);
                      sendMessage(suggestion);
                    }}
                    className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-xs font-medium text-emerald-700 transition hover:bg-emerald-50 disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  placeholder="Ask about your listings, mandi prices, orders..."
                  disabled={loading}
                  className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-emerald-500 focus:ring-2 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <FaPaperPlane />
                  Send
                </button>
              </form>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

export default FarmerAssistantPage;
