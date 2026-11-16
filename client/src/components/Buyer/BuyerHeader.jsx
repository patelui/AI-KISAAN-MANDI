import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaSignOutAlt, FaShoppingCart } from 'react-icons/fa';
import api, { resolveAssetUrl } from '../../utils/api';

function BuyerHeader({ cartCount = 0 }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const { data } = await api.get('/auth/profile');
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
      } catch {
        try {
          setUser(JSON.parse(localStorage.getItem('user') || 'null'));
        } catch {
          setUser(null);
        }
      }
    };
    loadUser();
  }, []);

  const displayName = user?.fullName?.trim() || user?.email || 'Buyer';
  const profileImage = resolveAssetUrl(user?.profilePhoto);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  return (
    <header className="border-b border-emerald-100 bg-white px-6 py-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-emerald-800">Buyer Dashboard</h1>
          <p className="text-sm text-slate-500">Fresh crops directly from farmers</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/buyer-cart')}
            className="relative rounded-lg border border-emerald-100 bg-emerald-50 p-2 text-emerald-700 hover:bg-emerald-100"
          >
            <FaShoppingCart />
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-emerald-600 px-1 text-[10px] font-semibold text-white">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-emerald-50"
          >
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-100 text-sm font-semibold text-emerald-700">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="hidden text-sm font-medium text-slate-700 sm:inline">{displayName}</span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1 text-sm text-red-600 hover:text-red-700"
          >
            <FaSignOutAlt />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default BuyerHeader;
