import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ScrollToTop from './components/ScrollToTop';
import Chatbot from './components/ChatBot';
import SsayeBot from './components/SsayeBot';
import Home from './pages/Home';
import Assets from './pages/Assets';
import SmartCity from './pages/SmartCity';
import Farms from './pages/Farms';
import FarmEvents from './pages/FarmEvents';
import Blog from './pages/Blog';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Portfolio from './pages/Portfolio';
import Investments from './pages/Investments';
import Admin from './pages/Admin';
import SuperAdmin from './pages/SuperAdmin';
import Premium from './pages/Premium';
import Settings from './pages/Settings';
import Marketplace from './pages/Marketplace';
import ProductDetail from './pages/ProductDetail';
import MarketplaceManager from './pages/MarketplaceManager';
import VendorLogin    from './pages/VendorLogin';
import VendorRegister from './pages/VendorRegister';
import VendorDashboard from './pages/VendorDashboard';
import MyOrders from './pages/MyOrders';
import './App.css';

const MARKETPLACE_PATHS = ['/marketplace', '/product'];
const NO_BOT_PATHS      = ['/admin', '/superadmin', '/marketplace-manager', '/vendor'];

function BotRouter() {
  const { pathname } = useLocation();
  if (NO_BOT_PATHS.some(p => pathname.startsWith(p))) return null;
  const isMarketplace = MARKETPLACE_PATHS.some(p => pathname.startsWith(p));
  return isMarketplace ? <SsayeBot /> : <Chatbot />;
}

function App() {
  return (
    <HelmetProvider>
    <AuthProvider>
      <ToastProvider>
        <Router>
          <ScrollToTop />
          <div className="App">
            <Navbar />
            <main className="main-content">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/assets" element={<Assets />} />
                <Route path="/smart-city" element={<SmartCity />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/product/:id" element={<ProductDetail />} />
                <Route path="/farms" element={<Farms />} />
                <Route path="/farms/events" element={<FarmEvents />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/investments" element={<Investments />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/superadmin" element={<SuperAdmin />} />
                <Route path="/premium" element={<Premium />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/marketplace-manager" element={<MarketplaceManager />} />
                <Route path="/vendor/login"     element={<VendorLogin />} />
                <Route path="/vendor/register"  element={<VendorRegister />} />
                <Route path="/vendor/dashboard" element={<VendorDashboard />} />
                <Route path="/my-orders"        element={<MyOrders />} />
              </Routes>
            </main>
            <BotRouter />
            <Footer />
          </div>
        </Router>
      </ToastProvider>
    </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
