import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Menu, X, User, LogOut, Brain, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';

interface HeaderProps {
  onLoginClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onLoginClick }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };
  
  const handleLogout = async () => {
    await logout();
    toggleMenu();
  };

  if (location.pathname.startsWith('/admin')) {
    return <header className="hidden" />;
  }

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-20 transition-all duration-300 ${
        isScrolled ? 'bg-black/80 backdrop-blur-md py-3' : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="flex items-center gap-2">
            <Brain className="w-8 h-8 text-purple-500" />
            <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
              Paradoxia
            </span>
          </Link>
        </div>

        <div className="hidden md:flex items-center space-x-8">
          <Link to="/" className="text-gray-300 hover:text-white transition-colors">
            {t('nav.discover')}
          </Link>
          <Link to="/categories" className="text-gray-300 hover:text-white transition-colors">
            {t('nav.categories')}
          </Link>
          <Link to="/about" className="text-gray-300 hover:text-white transition-colors">
            {t('nav.about')}
          </Link>

          <div className="flex items-center gap-2 text-gray-300">
            <Globe size={16} />
            <LanguageSwitcher />
          </div>
          
          {user ? (
            <div className="relative group">
              <button className="flex items-center gap-2 text-gray-300 hover:text-white">
                <span>{user.displayName}</span>
                <div className="w-8 h-8 bg-purple-900/50 rounded-full flex items-center justify-center">
                  <User size={18} />
                </div>
              </button>
              
              <div className="absolute right-0 mt-2 w-48 bg-gray-900/95 backdrop-blur-sm border border-purple-900/30 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200">
                <div className="py-2">
                  <Link to="/profile" className="block px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white">
                    {t('nav.profile')}
                  </Link>
                  
                  {user.isAdmin && (
                    <Link to="/admin" className="block px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white">
                      {t('nav.admin')}
                    </Link>
                  )}
                  
                  <button 
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-gray-300 hover:bg-gray-800 hover:text-white"
                  >
                    {t('auth.logout')}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg transition-colors"
            >
              {t('auth.signIn')}
            </button>
          )}
        </div>
        
        <button 
          className="md:hidden text-gray-300 hover:text-white"
          onClick={toggleMenu}
          aria-label={t('nav.menu')}
        >
          <Menu size={24} />
        </button>
      </div>
      
      {menuOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col">
          <div className="flex justify-between items-center p-4">
            <div className="flex items-center gap-2">
              <Brain className="w-8 h-8 text-purple-500" />
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-500 text-transparent bg-clip-text">
                Paradoxia
              </span>
            </div>
            <button 
              onClick={toggleMenu}
              className="text-gray-300 hover:text-white"
              aria-label={t('common.close')}
            >
              <X size={24} />
            </button>
          </div>
          
          <div className="flex flex-col items-center justify-center flex-1 space-y-8 p-4">
            <Link 
              to="/" 
              className="text-2xl text-white hover:text-purple-300 transition-colors"
              onClick={toggleMenu}
            >
              {t('nav.discover')}
            </Link>
            <Link
              to="/categories"
              className="text-2xl text-white hover:text-purple-300 transition-colors"
              onClick={toggleMenu}
            >
              {t('nav.categories')}
            </Link>
            <Link
              to="/about"
              className="text-2xl text-white hover:text-purple-300 transition-colors"
              onClick={toggleMenu}
            >
              {t('nav.about')}
            </Link>
            
            <div className="flex flex-col items-center gap-2">
              <div className="text-gray-400 flex items-center gap-2">
                <Globe size={16} />
                <span>{t('nav.language')}</span>
              </div>
              <LanguageSwitcher />
            </div>
            
            {user ? (
              <>
                <Link 
                  to="/profile" 
                  className="text-2xl text-white hover:text-purple-300 transition-colors flex items-center gap-2"
                  onClick={toggleMenu}
                >
                  <User size={20} />
                  <span>{t('nav.profile')}</span>
                </Link>
                
                {user.isAdmin && (
                  <Link 
                    to="/admin" 
                    className="text-2xl text-white hover:text-purple-300 transition-colors"
                    onClick={toggleMenu}
                  >
                    {t('nav.admin')}
                  </Link>
                )}
                
                <button 
                  onClick={handleLogout}
                  className="text-2xl text-white hover:text-purple-300 transition-colors flex items-center gap-2"
                >
                  <LogOut size={20} />
                  <span>{t('auth.logout')}</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  toggleMenu();
                  onLoginClick?.();
                }}
                className="text-2xl text-white hover:text-purple-300 transition-colors"
              >
                {t('auth.signIn')}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;