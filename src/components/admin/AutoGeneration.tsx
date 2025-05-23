import React, { useState, useEffect } from 'react';
import { Twitch as Switch, AlertCircle, CheckCircle } from 'lucide-react';
import { 
  getFirestore,
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  deleteDoc
} from 'firebase/firestore';

interface AutoGenConfig {
  id: string;
  category: string;
  minInterval: number;
  maxInterval: number;
  enabled: boolean;
  autoApprove: boolean;
  languages: string[];
}

const categories = [
  { id: 'bio', name: 'Biologie Interdite', emoji: '🧬' },
  { id: 'phys', name: 'Physique Fantôme', emoji: '⚛️' },
  { id: 'mem', name: 'Mémoire de la Matière', emoji: '💫' },
  { id: 'arch', name: 'Archéologie Interdite', emoji: '🏺' },
  { id: 'tech', name: 'Technologies Perdues', emoji: '⚙️' },
  { id: 'eco', name: 'Écologie Paradoxale', emoji: '🌳' },
  { id: 'med', name: 'Médecine Extrême', emoji: '🧪' },
  { id: 'soc', name: 'Sociétés Cryptiques', emoji: '👥' },
  { id: 'dream', name: 'Rêves Prédateurs', emoji: '🌙' },
  { id: 'geo', name: 'Géographie Maudite', emoji: '🗺️' },
  { id: 'ghost', name: 'Métiers Fantômes', emoji: '👻' },
  { id: 'food', name: 'Nourriture Alien', emoji: '🍽️' },
  { id: 'pleasure', name: 'Science Interdite du Plaisir', emoji: '🎭' },
  { id: 'mystery', name: 'Mystères & Taboos Sociaux', emoji: '🔍' }
];

const languages = [
  { code: 'fr', name: 'Français' },
  { code: 'en', name: 'English' },
  { code: 'zh', name: '中文' },
  { code: 'ar', name: 'العربية' },
  { code: 'es', name: 'Español' }
];

const db = getFirestore();

const AutoGeneration: React.FC = () => {
  const [configs, setConfigs] = useState<AutoGenConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingConfig, setEditingConfig] = useState<AutoGenConfig | null>(null);

  useEffect(() => {
    const configsRef = collection(db, 'auto_generation_config');
    const q = query(configsRef);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const configsData: AutoGenConfig[] = [];
      snapshot.forEach((doc) => {
        configsData.push({ id: doc.id, ...doc.data() } as AutoGenConfig);
      });
      setConfigs(configsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching configs:', error);
      setError('Erreur lors du chargement des configurations');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSaveConfig = async (config: Partial<AutoGenConfig>) => {
    try {
      if (editingConfig) {
        const configRef = doc(db, 'auto_generation_config', editingConfig.id);
        await updateDoc(configRef, config);
      } else {
        await addDoc(collection(db, 'auto_generation_config'), config);
      }
      setEditingConfig(null);
    } catch (error) {
      console.error('Error saving config:', error);
      setError('Erreur lors de la sauvegarde de la configuration');
    }
  };

  const handleDeleteConfig = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'auto_generation_config', id));
    } catch (error) {
      console.error('Error deleting config:', error);
      setError('Erreur lors de la suppression de la configuration');
    }
  };

  const handleToggleEnabled = async (id: string, enabled: boolean) => {
    try {
      const configRef = doc(db, 'auto_generation_config', id);
      await updateDoc(configRef, { enabled });
    } catch (error) {
      console.error('Error toggling config:', error);
      setError('Erreur lors de la modification de la configuration');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-900/50 text-white p-6 rounded-lg">
        <h2 className="text-2xl font-bold mb-4">Erreur</h2>
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

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Génération Automatique</h2>

      {/* Configuration Form */}
      {editingConfig && (
        <div className="bg-gray-900/50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-medium text-white mb-4">
            {editingConfig.id ? 'Modifier la configuration' : 'Nouvelle configuration'}
          </h3>

          <form onSubmit={(e) => {
            e.preventDefault();
            handleSaveConfig(editingConfig);
          }} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                Catégorie
              </label>
              <select
                value={editingConfig.category}
                onChange={(e) => setEditingConfig({
                  ...editingConfig,
                  category: e.target.value
                })}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                required
              >
                <option value="">Sélectionnez une catégorie</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.emoji} {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Intervalle minimum (heures)
                </label>
                <input
                  type="number"
                  min="1"
                  max="24"
                  value={editingConfig.minInterval}
                  onChange={(e) => setEditingConfig({
                    ...editingConfig,
                    minInterval: parseInt(e.target.value)
                  })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Intervalle maximum (heures)
                </label>
                <input
                  type="number"
                  min="1"
                  max="72"
                  value={editingConfig.maxInterval}
                  onChange={(e) => setEditingConfig({
                    ...editingConfig,
                    maxInterval: parseInt(e.target.value)
                  })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Langues de traduction
              </label>
              <div className="space-y-2">
                {languages.map((lang) => (
                  <label key={lang.code} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={editingConfig.languages.includes(lang.code)}
                      onChange={(e) => {
                        const newLangs = e.target.checked
                          ? [...editingConfig.languages, lang.code]
                          : editingConfig.languages.filter(l => l !== lang.code);
                        setEditingConfig({
                          ...editingConfig,
                          languages: newLangs
                        });
                      }}
                      className="mr-2"
                    />
                    <span className="text-gray-300">{lang.name}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editingConfig.enabled}
                  onChange={(e) => setEditingConfig({
                    ...editingConfig,
                    enabled: e.target.checked
                  })}
                  className="mr-2"
                />
                <span className="text-gray-300">Activer la génération</span>
              </label>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editingConfig.autoApprove}
                  onChange={(e) => setEditingConfig({
                    ...editingConfig,
                    autoApprove: e.target.checked
                  })}
                  className="mr-2"
                />
                <span className="text-gray-300">Approbation automatique</span>
              </label>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setEditingConfig(null)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg"
              >
                Enregistrer
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Configurations List */}
      <div className="space-y-4">
        {configs.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">Aucune configuration de génération automatique</p>
            <button
              onClick={() => setEditingConfig({
                id: '',
                category: '',
                minInterval: 1,
                maxInterval: 24,
                enabled: false,
                autoApprove: false,
                languages: ['fr', 'en']
              })}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg"
            >
              Ajouter une configuration
            </button>
          </div>
        ) : (
          <>
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setEditingConfig({
                  id: '',
                  category: '',
                  minInterval: 1,
                  maxInterval: 24,
                  enabled: false,
                  autoApprove: false,
                  languages: ['fr', 'en']
                })}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg"
              >
                Nouvelle configuration
              </button>
            </div>

            {configs.map((config) => {
              const category = categories.find(c => c.id === config.category);
              return (
                <div
                  key={config.id}
                  className="bg-gray-900/50 rounded-lg p-6 border border-gray-700"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-medium text-white flex items-center gap-2">
                        <span>{category?.emoji}</span>
                        <span>{category?.name}</span>
                      </h3>
                      <div className="flex items-center mt-2">
                        <span className={`text-sm px-2 py-1 rounded-full ${
                          config.enabled
                            ? 'bg-green-900/50 text-green-400'
                            : 'bg-gray-800 text-gray-400'
                        }`}>
                          {config.enabled ? 'Actif' : 'Inactif'}
                        </span>
                        {config.autoApprove && (
                          <span className="text-sm px-2 py-1 rounded-full bg-purple-900/50 text-purple-400 ml-2">
                            Approbation auto
                          </span>
                        )}
                      </div>
                    </div>
                    <Switch
                      checked={config.enabled}
                      onChange={() => handleToggleEnabled(config.id, !config.enabled)}
                      className={`${
                        config.enabled ? 'bg-purple-600' : 'bg-gray-700'
                      } relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2`}
                    >
                      <span
                        className={`${
                          config.enabled ? 'translate-x-6' : 'translate-x-1'
                        } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                      />
                    </Switch>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-400">Intervalle</p>
                      <p className="text-white">
                        {config.minInterval}h - {config.maxInterval}h
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Langues</p>
                      <div className="flex flex-wrap gap-1">
                        {config.languages.map((lang) => (
                          <span
                            key={lang}
                            className="text-xs px-2 py-1 rounded-full bg-gray-800 text-gray-300"
                          >
                            {languages.find(l => l.code === lang)?.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingConfig(config)}
                      className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                    >
                      Modifier
                    </button>
                    <button
                      onClick={() => handleDeleteConfig(config.id)}
                      className="px-3 py-1 text-sm bg-red-700 hover:bg-red-600 text-white rounded-lg"
                    >
                      Supprimer
                    </button>
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>
    </div>
  );
};

export default AutoGeneration;