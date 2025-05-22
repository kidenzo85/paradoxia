import React, { useState, useEffect } from 'react';
import { BarChart, LineChart, DoughnutChart } from '../charts/Charts';

const Dashboard: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Simulate data loading
      setTimeout(() => {
        setIsLoading(false);
      }, 1000);
    } catch (err) {
      setError('Erreur lors du chargement du tableau de bord');
      setIsLoading(false);
    }
  }, []);

  if (error) {
    return (
      <div className="bg-red-900/50 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Erreur de chargement</h2>
        <p className="text-red-200 mb-4">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="bg-red-700 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
        >
          Réessayer
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Tableau de bord</h2>
      
      {/* Quick stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
        <div className="bg-gradient-to-r from-purple-900/50 to-indigo-900/50 rounded-lg p-6 shadow">
          <h3 className="text-sm font-medium text-gray-300 mb-1">Faits actifs</h3>
          <p className="text-3xl font-bold text-white">154</p>
          <div className="flex items-center mt-2 text-green-400 text-sm">
            <span>+12.5%</span>
            <span className="text-gray-400 ml-2">vs dernier mois</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-blue-900/50 to-cyan-900/50 rounded-lg p-6 shadow">
          <h3 className="text-sm font-medium text-gray-300 mb-1">Visiteurs quotidiens</h3>
          <p className="text-3xl font-bold text-white">2,547</p>
          <div className="flex items-center mt-2 text-green-400 text-sm">
            <span>+32.7%</span>
            <span className="text-gray-400 ml-2">vs dernier mois</span>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-pink-900/50 to-rose-900/50 rounded-lg p-6 shadow">
          <h3 className="text-sm font-medium text-gray-300 mb-1">Score WTF moyen</h3>
          <p className="text-3xl font-bold text-white">7.4</p>
          <div className="flex items-center mt-2 text-red-400 text-sm">
            <span>-0.3</span>
            <span className="text-gray-400 ml-2">vs dernier mois</span>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-900/50 to-emerald-900/50 rounded-lg p-6 shadow">
          <h3 className="text-sm font-medium text-gray-300 mb-1">Revenus publicitaires</h3>
          <p className="text-3xl font-bold text-white">426€</p>
          <div className="flex items-center mt-2 text-green-400 text-sm">
            <span>+18.2%</span>
            <span className="text-gray-400 ml-2">vs dernier mois</span>
          </div>
          <div className="bg-gradient-to-r from-fuchsia-900/50 to-violet-900/50 rounded-lg p-6 shadow">
            <h3 className="text-sm font-medium text-gray-300 mb-1">Couverture traductions</h3>
            <p className="text-3xl font-bold text-white">87%</p>
            <div className="flex flex-col mt-2 text-sm">
              <span className="text-blue-400">FR: 100%</span>
              <span className="text-green-400">EN: 92%</span>
              <span className="text-yellow-400">ZH: 70%</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-gray-800/40 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">Génération mensuelle</h3>
          <div className="h-64">
            <BarChart />
          </div>
        </div>
        
        <div className="bg-gray-800/40 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">Visites quotidiennes</h3>
          <div className="h-64">
            <LineChart />
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-gray-800/40 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">
            Répartition par catégorie
          </h3>
          <div className="h-64">
            <DoughnutChart />
          </div>
        </div>
        
        <div className="bg-gray-800/40 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">
            État des traductions
          </h3>
          <div className="space-y-4">
            {[
              { lang: 'Anglais (EN)', total: 154, translated: 142 },
              { lang: 'Chinois (ZH)', total: 154, translated: 108 },
            ].map((stat, index) => (
              <div key={index} className="border-b border-gray-700 pb-4 last:border-0">
                <p className="text-gray-200 mb-2">{stat.lang}</p>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                    style={{ width: `${(stat.translated / stat.total) * 100}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-400">
                  <span>{stat.translated} traduits</span>
                  <span>{((stat.translated / stat.total) * 100).toFixed(1)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-1 bg-gray-800/40 rounded-lg p-6">
          <h3 className="text-lg font-medium text-white mb-4">
            Faits les plus controversés
          </h3>
          <div className="space-y-4">
            {[
              { title: "L'eau peut mémoriser des informations", fake: 65, real: 35 },
              { title: "Les cafards peuvent survivre sans tête", fake: 42, real: 58 },
              { title: "Les fourmis prédisent les mouvements boursiers", fake: 78, real: 22 },
            ].map((fact, index) => (
              <div key={index} className="border-b border-gray-700 pb-4 last:border-0">
                <p className="text-gray-200 mb-2">{fact.title}</p>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-red-500 to-yellow-500" 
                    style={{ width: `${fact.fake}%` }}
                  ></div>
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-400">
                  <span>Signalé comme faux: {fact.fake}%</span>
                  <span>Confirmé comme vrai: {fact.real}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;