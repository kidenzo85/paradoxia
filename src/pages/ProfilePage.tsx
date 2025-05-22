import React from 'react';
import { useAuth } from '../context/AuthContext';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-indigo-950">
      <div className="max-w-4xl mx-auto px-4 py-20">
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-8">
          <h1 className="text-3xl font-bold text-white mb-8">Mon Profil</h1>
          
          <div className="space-y-6">
            {/* User Info */}
            <div className="border-b border-gray-800 pb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Informations personnelles</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Nom d'utilisateur</label>
                  <p className="text-white">{user?.displayName}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1">Email</label>
                  <p className="text-white">{user?.email}</p>
                </div>
              </div>
            </div>
            
            {/* Stats */}
            <div className="border-b border-gray-800 pb-6">
              <h2 className="text-xl font-semibold text-white mb-4">Statistiques</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400">Faits vérifiés</div>
                  <div className="text-2xl font-bold text-white">127</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400">Commentaires</div>
                  <div className="text-2xl font-bold text-white">34</div>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-400">Score moyen</div>
                  <div className="text-2xl font-bold text-white">7.2</div>
                </div>
              </div>
            </div>
            
            {/* Preferences */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4">Préférences</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">Notifications par email</div>
                    <div className="text-sm text-gray-400">Recevoir des notifications pour les nouveaux faits</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-white">Mode sombre</div>
                    <div className="text-sm text-gray-400">Toujours utiliser le thème sombre</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" checked disabled className="sr-only peer" />
                    <div className="w-11 h-6 bg-purple-600 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;