import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import AuthPage from './pages/AuthPage.jsx';
import FarmerDashboard from './pages/FarmerDashboard.jsx';
import FarmerCropsPage from './pages/FarmerCropsPage.jsx';
import FarmerCalendarPage from './pages/FarmerCalendarPage.jsx';
import FarmerAnalyticsPage from './pages/FarmerAnalyticsPage.jsx';
import FarmerAssistantPage from './pages/FarmerAssistantPage.jsx';
import FarmerOrdersPage from './pages/FarmerOrdersPage.jsx';
import FarmerListingPreviewPage from './pages/FarmerListingPreviewPage.jsx';
import BuyerDashboard from './pages/BuyerDashboard.jsx';
import BuyerCartPage from './pages/BuyerCartPage.jsx';
import BuyerCheckoutPage from './pages/BuyerCheckoutPage.jsx';
import BuyerOrderSuccessPage from './pages/BuyerOrderSuccessPage.jsx';
import BuyerOrdersPage from './pages/BuyerOrdersPage.jsx';
import BuyerAddressBookPage from './pages/BuyerAddressBookPage.jsx';
import BuyerAssistantPage from './pages/BuyerAssistantPage.jsx';
import ProfilePage from './pages/ProfilePage.jsx';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Routes>
          <Route path="/" element={<AuthPage />} />
          <Route path="/farmer-dashboard" element={<FarmerDashboard />} />
          <Route path="/farmer-crops" element={<FarmerCropsPage />} />
          <Route path="/farmer-calendar" element={<FarmerCalendarPage />} />
          <Route path="/farmer-analytics" element={<FarmerAnalyticsPage />} />
          <Route path="/farmer-assistant" element={<FarmerAssistantPage />} />
          <Route path="/farmer-orders" element={<FarmerOrdersPage />} />
          <Route path="/farmer-listing-preview" element={<FarmerListingPreviewPage />} />
          <Route path="/buyer-dashboard" element={<BuyerDashboard />} />
          <Route path="/buyer-cart" element={<BuyerCartPage />} />
          <Route path="/buyer-checkout" element={<BuyerCheckoutPage />} />
          <Route path="/buyer-order-success" element={<BuyerOrderSuccessPage />} />
          <Route path="/buyer-orders" element={<BuyerOrdersPage />} />
          <Route path="/buyer-addresses" element={<BuyerAddressBookPage />} />
          <Route path="/buyer-assistant" element={<BuyerAssistantPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
