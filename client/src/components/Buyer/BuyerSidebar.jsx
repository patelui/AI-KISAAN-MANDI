import { useNavigate, useLocation } from 'react-router-dom';
import {
  FaHome,
  FaShoppingCart,
  FaBox,
  FaMapMarkerAlt,
  FaRobot,
  FaUser,
} from 'react-icons/fa';

function BuyerSidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: FaHome, label: 'Marketplace', path: '/buyer-dashboard' },
    { icon: FaShoppingCart, label: 'Cart', path: '/buyer-cart' },
    { icon: FaBox, label: 'Orders', path: '/buyer-orders' },
    { icon: FaMapMarkerAlt, label: 'Address Book', path: '/buyer-addresses' },
    { icon: FaRobot, label: 'AI Assistant', path: '/buyer-assistant' },
    { icon: FaUser, label: 'Profile', path: '/profile' },
  ];

  return (
    <aside className="min-h-screen w-64 bg-emerald-900 p-4 text-white">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-[0.25em] text-emerald-100">Buyer Panel</p>
        <h2 className="mt-1 text-xl font-bold">AI Kisan Mandi</h2>
      </div>
      <nav>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              type="button"
              onClick={() => navigate(item.path)}
              className={`mb-2 flex w-full items-center gap-3 rounded-lg p-3 text-left text-sm font-medium transition ${
                isActive ? 'bg-emerald-700 text-white' : 'text-emerald-50 hover:bg-emerald-800'
              }`}
            >
              <item.icon />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

export default BuyerSidebar;
