import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence } from 'framer-motion';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import MatchLivePage from './pages/MatchLivePage';
import AdminLoginPage from './pages/AdminLoginPage';
import AdminScorerPage from './pages/AdminScorerPage';
import AdminMatchSetupPage from './pages/AdminMatchSetupPage';

function App() {
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'rgba(10, 14, 26, 0.95)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(12px)',
            fontFamily: "'Inter', sans-serif",
            fontSize: '0.9rem',
            borderRadius: '10px',
            padding: '12px 16px',
          },
        }}
      />
      <Navbar />
      <main className="page">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/match/:id" element={<MatchLivePage />} />
            <Route path="/admin/login" element={<AdminLoginPage />} />
            <Route
              path="/admin/match/:id"
              element={
                <ProtectedRoute allowedRoles={['admin', 'scorer']}>
                  <AdminScorerPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/setup"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminMatchSetupPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AnimatePresence>
      </main>
      <Footer />
    </>
  );
}

export default App;
