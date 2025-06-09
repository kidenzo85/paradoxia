import React, { useState, useEffect } from 'react';
import { Twitch as Switch, AlertCircle, CheckCircle, Clock, Play, Pause } from 'lucide-react';
import { 
  getFirestore,
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';

interface AutoGenConfig {
  id: string;
  category: string;
  minInterval: number;
  maxInterval: number;
  enabled: boolean;
  autoApprove: boolean;
  languages: string[];
  lastGeneration?: Date;
  nextGeneration?: Date;
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
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const configsRef = collection(db, 'auto_generation_config');
    const q = query(configsRef);
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const configsData: AutoGenConfig[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        configsData.push({ 
          id: doc.id, 
          ...data,
          lastGeneration: data.lastGeneration?.toDate(),
          nextGeneration: data.nextGeneration?.toDate()
        } as AutoGenConfig);
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
      if (editingConfig && editingConfig.id) {
        const configRef = doc(db, 'auto_generation_config', editingConfig.id);
        await updateDoc(configRef, {
          ...config,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'auto_generation_config'), {
          ...config,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      setEditingConfig(null);
    } catch (error) {
      console.error('Error saving config:', error);
      setError('Erreur lors de la sauvegarde de la configuration');
    }
  };

  const handleDeleteConfig = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette configuration ?')) return;
    
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
      await updateDoc(configRef, { 
        enabled,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error toggling config:', error);
      setError('Erreur lors de la modification de la configuration');
    }
  };

  const handleManualGeneration = async (configId: string) => {
    setIsGenerating(true);
    try {
      // Ici, vous pourriez déclencher manuellement la génération
      // Pour l'instant, on simule juste une mise à jour
      const configRef = doc(db, 'auto_generation_config', configId);
      await updateDoc(configRef, {
        lastGeneration: serverTimestamp(),
        nextGeneration: new Date(Date.now() + 60 * 60 * 1000) // 1 heure plus tard
      });
      
      console.log('Manual generation triggered for config:', configId);
    } catch (error) {
      console.error('Error triggering manual generation:', error);
      setError('Erreur lors du déclenchement de la génération manuelle');
    } finally {
      setIsGenerating(false);
    }
  };

  const getTimeUntilNext = (nextGeneration?: Date): string => {
    if (!nextGeneration) return 'Non programmé';
    
    const now = new Date();
    const diff = nextGeneration.getTime() - now.getTime();
    
    if (diff <= 0) return 'Maintenant';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
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

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="text-green-400" size={20} />
            <span className="text-sm text-gray-400">Configurations actives</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {configs.filter(c => c.enabled).length}
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="text-blue-400" size={20} />
            <span className="text-sm text-gray-400">Prochaine génération</span>
          </div>
          <div className="text-lg font-semibold text-white">
            {configs.filter(c => c.enabled).length > 0 
              ? Math.min(...configs.filter(c => c.enabled && c.nextGeneration).map(c => 
                  c.nextGeneration!.getTime() - Date.now()
                )) > 0 
                ? getTimeUntilNext(new Date(Math.min(...configs.filter(c => c.enabled && c.nextGeneration).map(c => c.nextGeneration!.getTime()))))
                : 'Maintenant'
              : 'Aucune'
            }
          </div>
        </div>
        
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="text-yellow-400" size={20} />
            <span className="text-sm text-gray-400">Total configurations</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {configs.length}
          </div>
        </div>
      </div>

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
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
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
                languages: ['fr', 'en', 'zh', 'ar', 'es']
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
                  languages: ['fr', 'en', 'zh', 'ar', 'es']
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
                      <div className="flex items-center mt-2 gap-2">
                        <span className={`text-sm px-2 py-1 rounded-full ${
                          config.enabled
                            ? 'bg-green-900/50 text-green-400'
                            : 'bg-gray-800 text-gray-400'
                        }`}>
                          {config.enabled ? 'Actif' : 'Inactif'}
                        </span>
                        {config.autoApprove && (
                          <span className="text-sm px-2 py-1 rounded-full bg-purple-900/50 text-purple-400">
                            Approbation auto
                          </span>
                        )}
                        {config.enabled && (
                          <span className="text-sm px-2 py-1 rounded-full bg-blue-900/50 text-blue-400">
                            Prochaine: {getTimeUntilNext(config.nextGeneration)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {config.enabled && (
                        <button
                          onClick={() => handleManualGeneration(config.id)}
                          disabled={isGenerating}
                          className="p-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50"
                          title="Générer maintenant"
                        >
                          <Play size={16} />
                        </button>
                      )}
                      <button
                        onClick={() => handleToggleEnabled(config.id, !config.enabled)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          config.enabled ? 'bg-purple-600' : 'bg-gray-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            config.enabled ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
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

                  {config.lastGeneration && (
                    <div className="mb-4 text-sm text-gray-400">
                      Dernière génération: {config.lastGeneration.toLocaleString()}
                    </div>
                  )}

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