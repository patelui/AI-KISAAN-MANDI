import { useNavigate } from 'react-router-dom';
import { FaArrowRight, FaComments, FaRobot } from 'react-icons/fa';

const AssistantPromo = () => {
  const navigate = useNavigate();

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 p-6 text-white shadow-lg">
      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" />
      <div className="absolute -bottom-8 right-8 h-20 w-20 rounded-full bg-white/5" />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/20 backdrop-blur">
            <FaRobot className="text-xl" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-100">
              AI Support
            </p>
            <h3 className="mt-1 text-lg font-bold">Kisaan AI Assistant</h3>
            <p className="mt-1 max-w-xl text-sm text-indigo-50">
              Ask about your listings, mandi prices, pending orders, and get personalized selling
              suggestions — powered by your farm data.
            </p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-indigo-100">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1">
                <FaComments />
                Your crops
              </span>
              <span className="rounded-full bg-white/15 px-2.5 py-1">Mandi rates</span>
              <span className="rounded-full bg-white/15 px-2.5 py-1">Sell advice</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={() => navigate('/farmer-assistant')}
          className="inline-flex shrink-0 items-center justify-center gap-2 self-start rounded-xl bg-white px-5 py-3 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-50 sm:self-center"
        >
          Open Assistant
          <FaArrowRight className="text-xs" />
        </button>
      </div>
    </div>
  );
};

export default AssistantPromo;
