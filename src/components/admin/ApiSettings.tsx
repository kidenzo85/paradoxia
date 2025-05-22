import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc
} from 'firebase/firestore';

type ApiStatus = 'connected' | 'disconnected' | 'unset';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  status: ApiStatus;
}

interface ApiKeyData {
  key: string;
  status: ApiStatus;
}

const db = getFirestore();

const ApiSettings: React.FC = () => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: 'deepseek',
      name: 'DeepSeek API',
      key: '',
      status: 'unset',
      description: 'Utilisé pour la génération de faits et la traduction automatique'
    },
    {
      id: 'gemini',
      name: 'Google Gemini API',
      key: '',
      status: 'unset',
      description: 'Utilisé comme alternative pour la génération de faits'
    },
    {
      id: 'youtube',
      name: 'YouTube Data API',
      key: '',
      status: 'unset',
      description: 'Recherche de vidéos explicatives'
    },
    {
      id: 'google-images',
      name: 'Google Custom Search API',
      key: '',
      status: 'unset',
      description: 'Recherche d\'images illustratives'
    }
  ]);
  
  const [showKeys, setShowKeys] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [testingKey, setTestingKey] = useState<string | null>(null);
  
  useEffect(() => {
    loadApiKeys();
  }, []);
  
  const loadApiKeys = async () => {
    try {
      const apiKeysRef = collection(db, 'api_keys');
      const snapshot = await getDocs(apiKeysRef);
      const data = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...(doc.data() as ApiKeyData)
      }));
      
      setApiKeys(prev => prev.map(api => {
        const savedKey = data.find(k => k.id === api.id);
        return savedKey ? {
          ...api,
          key: savedKey.key,
          status: savedKey.status
        } : api;
      }));
    } catch (error) {
      console.error('Error loading API keys:', error);
      setError('Erreur lors du chargement des clés API');
    } finally {
      setLoading(false);
    }
  };
  
  const handleToggleVisibility = (id: string) => {
    setShowKeys(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };
  
  const handleKeyChange = async (id: string, value: string) => {
    const updatedKeys = apiKeys.map(api => 
      api.id === id ? { ...api, key: value, status: 'unset' as ApiStatus } : api
    );
    setApiKeys(updatedKeys);
    
    try {
      await setDoc(doc(db, 'api_keys', id), { 
        key: value,
        status: 'unset' as ApiStatus
      });
    } catch (error) {
      console.error('Error saving API key:', error);
      setError('Erreur lors de la sauvegarde de la clé API');
    }
  };
  
  const handleTestConnection = async (id: string) => {
    const api = apiKeys.find(a => a.id === id);
    if (!api || !api.key) return;
    
    setTestingKey(id);
    
    try {
      let status: ApiStatus = 'disconnected';
      
      switch (id) {
        case 'deepseek':
          const deepseekResponse = await fetch('https://api.deepseek.com/v1/models', {
            headers: { 'Authorization': `Bearer ${api.key}` }
          });
          status = deepseekResponse.ok ? 'connected' : 'disconnected';
          break;
          
        case 'gemini':
          const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${api.key}`);
          status = geminiResponse.ok ? 'connected' : 'disconnected';
          break;
          
        case 'youtube':
          const youtubeResponse = await fetch(
            `https://www.googleapis.com/youtube/v3/search?part=snippet&q=test&maxResults=1&key=${api.key}`
          );
          status = youtubeResponse.ok ? 'connected' : 'disconnected';
          break;
          
        case 'google-images':
          const googleResponse = await fetch(
            `https://customsearch.googleapis.com/customsearch/v1?key=${api.key}&cx=87cf2a8c2bee5489f&q=test&searchType=image&num=1`
          );
          status = googleResponse.ok ? 'connected' : 'disconnected';
          break;
      }
      
      // Update API status in state
      const updatedKeys = apiKeys.map(api => 
        api.id === id ? { ...api, status } : api
      );
      setApiKeys(updatedKeys);
      
      // Save status to database
      await setDoc(doc(db, 'api_keys', id), {
        key: api.key,
        status
      });
        
    } catch (error) {
      console.error('Error testing API connection:', error);
      
      // Update to disconnected status on error
      const updatedKeys = apiKeys.map(api => 
        api.id === id ? { ...api, status: 'disconnected' as ApiStatus } : api
      );
      setApiKeys(updatedKeys);
      
      await setDoc(doc(db, 'api_keys', id), {
        key: api.key,
        status: 'disconnected' as ApiStatus
      });
    } finally {
      setTestingKey(null);
    }
  };
  
  const getStatusIcon = (status: ApiStatus) => {
    switch (status) {
      case 'connected':
        return <CheckCircle size={16} className="text-green-400" />;
      case 'disconnected':
        return <AlertCircle size={16} className="text-red-400" />;
      default:
        return <span className="w-4 h-4 block"></span>;
    }
  };
  
  const getStatusText = (status: ApiStatus) => {
    switch (status) {
      case 'connected':
        return 'Connecté';
      case 'disconnected':
        return 'Non connecté';
      default:
        return 'Non configuré';
    }
  };
  
  const getStatusColor = (status: ApiStatus) => {
    switch (status) {
      case 'connected':
        return 'text-green-400';
      case 'disconnected':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const getApiInstructions = (id: string) => {
    switch (id) {
      case 'deepseek':
        return 'Obtenez votre clé API sur le portail développeur DeepSeek';
      case 'gemini':
        return 'Créez une clé API dans Google Cloud Console avec Gemini API activée';
      case 'youtube':
        return 'Créez une clé API dans Google Cloud Console avec YouTube Data API v3 activée';
      case 'google-images':
        return 'Créez une clé API et un moteur de recherche personnalisé dans Google Cloud Console';
      default:
        return '';
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
        <h2 className="text-2xl font-bold mb-4">Erreur d'accès</h2>
        <p className="text-red-200 mb-4">
          Impossible d'accéder à la configuration des API. Veuillez vérifier que vous avez les permissions nécessaires et réessayer.
        </p>
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
      <h2 className="text-2xl font-bold text-white mb-6">Configuration des API</h2>
      
      <div className="bg-gray-800/50 rounded-lg p-6 mb-8">
        <div className="space-y-4">
          <p className="text-gray-300">
            Configurez les clés API nécessaires pour la génération automatique des faits et l'importation des médias.
            Les clés sont chiffrées avant d'être stockées et ne sont jamais exposées publiquement.
          </p>

          <div className="border-t border-gray-700 pt-4">
            <h3 className="text-lg font-medium text-white mb-2">Configuration des langues</h3>
            <p className="text-gray-300 mb-4">
              L'API DeepSeek est utilisée pour la traduction automatique des faits. Les langues supportées sont :
            </p>
            <ul className="list-disc list-inside text-gray-300 space-y-1">
              <li>Français (FR) - Langue principale</li>
              <li>Anglais (EN) - Traduction automatique</li>
              <li>Chinois (ZH) - Traduction automatique</li>
            </ul>
          </div>
        </div>
      </div>
      
      <div className="space-y-6">
        {apiKeys.map((api) => (
          <div key={api.id} className="bg-gray-800/40 rounded-lg p-6 border border-gray-700">
            {api.id === 'deepseek' && (
              <div className="absolute top-2 right-2">
                <span className="bg-purple-900/50 text-xs px-2 py-1 rounded text-purple-300">
                  Traduction activée
                </span>
              </div>
            )}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">{api.name}</h3>
              <div className="flex items-center">
                {getStatusIcon(api.status)}
                <span className={`ml-2 text-sm ${getStatusColor(api.status)}`}>
                  {getStatusText(api.status)}
                </span>
              </div>
            </div>
            
            <p className="text-sm text-gray-400 mb-2">
              {api.description}
            </p>
            <p className="text-sm text-gray-400 mb-4">
              {getApiInstructions(api.id)}
            </p>
            
            <div className="mb-4">
              <div className="flex">
                <input
                  type={showKeys[api.id] ? 'text' : 'password'} 
                  value={api.key}
                  onChange={(e) => handleKeyChange(api.id, e.target.value)}
                  placeholder="Entrez votre clé API"
                  className="flex-1 px-4 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <button
                  onClick={() => handleToggleVisibility(api.id)}
                  className="px-3 bg-gray-600 hover:bg-gray-500 text-gray-300 rounded-r-lg border-y border-r border-gray-600"
                  aria-label={showKeys[api.id] ? "Masquer la clé" : "Afficher la clé"}
                >
                  {showKeys[api.id] ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                onClick={() => handleTestConnection(api.id)}
                disabled={!api.key || testingKey === api.id}
                className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {testingKey === api.id ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    <span>Test en cours...</span>
                  </>
                ) : (
                  'Tester la connexion'
                )}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ApiSettings;