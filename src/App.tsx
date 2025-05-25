import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { FactProvider } from './context/FactContext';
import HomePage from './pages/HomePage';
import DetailPage from './pages/DetailPage';
import AdminPage from './pages/AdminPage';
import ProfilePage from './pages/ProfilePage';
import CategoriesPage from './pages/CategoriesPage';
import AboutPage from './pages/AboutPage';
import Header from './components/common/Header';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AuthModal from './components/auth/AuthModal';

function App() {
  return (
    <Router>
      <AuthProvider>
        <FactProvider>
          <div className="min-h-screen bg-gradient-to-b from-black to-indigo-950 text-white font-sans">
            <HeaderContainer />
            <main>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/fact/:id" element={<DetailPage />} />
                <Route path="/categories" element={<CategoriesPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route 
                  path="/profile" 
                  element={
                    <ProtectedRoute>
                      <ProfilePage />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin/*" 
                  element={
                    <ProtectedRoute adminOnly>
                      <AdminPage />
                    </ProtectedRoute>
                  } 
                />
                {/* Remove the login page and redirect to home */}
                <Route path="/login" element={<Navigate to="/" replace />} />
              </Routes>
            </main>
            <AuthModalContainer />
          </div>
        </FactProvider>
      </AuthProvider>
    </Router>
  );
}

const HeaderContainer = () => {
  const { setShowAuthModal } = useAuth();
  return <Header onLoginClick={() => setShowAuthModal(true)} />;
};

const AuthModalContainer = () => {
  const { showAuthModal, setShowAuthModal } = useAuth();
  return <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />;
};

export default App;