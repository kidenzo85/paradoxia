import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginPage: React.FC = () => {
  const { setShowAuthModal, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Afficher automatiquement le modal d'authentification
  React.useEffect(() => {
    setShowAuthModal(true);
    return () => setShowAuthModal(false);
  }, [setShowAuthModal]);

  // Rediriger vers la page d'origine après la connexion
  React.useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-indigo-950 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <h2 className="text-3xl font-bold text-white mb-4">
          Bienvenue sur Paradoxia
        </h2>
        <p className="text-gray-400">
          Connectez-vous pour accéder à votre compte et découvrir plus de faits insolites
        </p>
      </div>
    </div>
  );
};

export default LoginPage;