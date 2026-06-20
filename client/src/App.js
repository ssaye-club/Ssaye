import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
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
import './App.css';

const MARKETPLACE_PATHS = ['/marketplace', '/product'];

function BotRouter() {
  const { pathname } = useLocation();
  const isMarketplace = MARKETPLACE_PATHS.some(p => pathname.startsWith(p));
  return isMarketplace ? <SsayeBot /> : <Chatbot />;
}

function App() {
  return (
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
              </Routes>
            </main>
            <BotRouter />
            <Footer />
          </div>
        </Router>
      </ToastProvider>
    </AuthProvider>
  );
}

export default App;
