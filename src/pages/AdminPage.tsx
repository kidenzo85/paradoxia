import React, { useState } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { Settings, Database, PlusCircle, BarChart3, LayoutDashboard } from 'lucide-react';
import FactCreation from '../components/admin/FactCreation';
import FactModeration from '../components/admin/FactModeration';
import ApiSettings from '../components/admin/ApiSettings';
import AdManagement from '../components/admin/AdManagement';
import Dashboard from '../components/admin/Dashboard';
import { useAuth } from '../context/AuthContext';

const AdminPage: React.FC = () => {
  const { pathname } = useLocation();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return null;
  }
  
  if (error) {
    return (
      <div className="min-h-screen p-6">
        <div className="bg-red-900/50 text-white p-6 rounded-lg">
          <h2 className="text-2xl font-bold mb-4">Erreur d'accès</h2>
          <p className="text-red-200 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  const isActive = (path: string) => {
    return pathname === `/admin${path}`;
  };

  return (
    <div className="min-h-screen">
      <div className="grid grid-cols-1 lg:grid-cols-5 min-h-screen">
        {/* Sidebar */}
        <div className="lg:col-span-1 bg-gray-900 p-6">
          <h1 className="text-xl font-bold text-white mb-8">Administration</h1>
          
          <nav className="space-y-2">
            <Link
              to="/admin"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('') 
                  ? 'bg-purple-900/50 text-purple-300' 
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <BarChart3 size={18} />
              <span>Tableau de bord</span>
            </Link>
            
            <Link
              to="/admin/creation"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/creation') 
                  ? 'bg-purple-900/50 text-purple-300' 
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <PlusCircle size={18} />
              <span>Création de faits</span>
            </Link>
            
            <Link
              to="/admin/moderation"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/moderation') 
                  ? 'bg-purple-900/50 text-purple-300' 
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Database size={18} />
              <span>Modération de faits</span>
            </Link>
            
            <Link
              to="/admin/ads"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/ads') 
                  ? 'bg-purple-900/50 text-purple-300' 
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <LayoutDashboard size={18} />
              <span>Gestion des pubs</span>
            </Link>
            
            <Link
              to="/admin/settings"
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive('/settings') 
                  ? 'bg-purple-900/50 text-purple-300' 
                  : 'text-gray-300 hover:bg-gray-800'
              }`}
            >
              <Settings size={18} />
              <span>Configuration API</span>
            </Link>
          </nav>
        </div>
        
        {/* Main content */}
        <div className="lg:col-span-4 p-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/creation" element={<FactCreation />} />
            <Route path="/moderation" element={<FactModeration />} />
            <Route path="/ads" element={<AdManagement />} />
            <Route path="/settings" element={<ApiSettings />} />
          </Routes>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;