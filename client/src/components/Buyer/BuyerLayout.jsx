import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import BuyerSidebar from './BuyerSidebar';
import BuyerHeader from './BuyerHeader';
import { useBuyerDashboard } from '../../hooks/useBuyerDashboard';

function BuyerLayout({ children }) {
  const navigate = useNavigate();
  const { stats } = useBuyerDashboard();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/');
      return;
    }

    try {
      const parsed = JSON.parse(user);
      if (parsed.role !== 'buyer') {
        navigate('/');
      }
    } catch {
      navigate('/');
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <BuyerSidebar />
      <div className="flex flex-1 flex-col">
        <BuyerHeader cartCount={stats.cartItems} />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

export default BuyerLayout;
