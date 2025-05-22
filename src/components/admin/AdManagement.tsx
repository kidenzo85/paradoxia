import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Check, X, ExternalLink } from 'lucide-react';
import { 
  getFirestore,
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  Timestamp
} from 'firebase/firestore';

interface AdSpace {
  id: string;
  name: string;
  location: string;
  type: 'adsense' | 'affiliate' | 'custom';
  status: 'active' | 'inactive';
}

interface AdContent {
  id: string;
  space_id: string;
  title: string;
  content: string;
  start_date: string;
  end_date: string | null;
  priority: number;
  status: 'active' | 'inactive' | 'scheduled';
}

interface SpaceFormState {
  name: string;
  location: string;
  type: 'adsense' | 'affiliate' | 'custom';
  status: 'active' | 'inactive';
}

interface ContentFormState {
  title: string;
  content: string;
  start_date: string;
  end_date: string;
  priority: number;
  status: 'active' | 'inactive' | 'scheduled';
}

const db = getFirestore();

const AdManagement: React.FC = () => {
  const [spaces, setSpaces] = useState<AdSpace[]>([]);
  const [contents, setContents] = useState<AdContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpace, setSelectedSpace] = useState<string | null>(null);
  const [showSpaceForm, setShowSpaceForm] = useState(false);
  const [showContentForm, setShowContentForm] = useState(false);
  const [editingSpace, setEditingSpace] = useState<AdSpace | null>(null);
  const [editingContent, setEditingContent] = useState<AdContent | null>(null);

  // Form states with corrected types
  const [spaceForm, setSpaceForm] = useState<SpaceFormState>({
    name: '',
    location: '',
    type: 'adsense',
    status: 'inactive'
  });

  const [contentForm, setContentForm] = useState<ContentFormState>({
    title: '',
    content: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    priority: 0,
    status: 'inactive'
  });

  useEffect(() => {
    // Subscribe to ad spaces changes
    const spacesQuery = query(collection(db, 'ad_spaces'), orderBy('created_at', 'desc'));
    const unsubscribeSpaces = onSnapshot(spacesQuery, (snapshot) => {
      const spacesData: AdSpace[] = [];
      snapshot.forEach((doc) => {
        spacesData.push({ id: doc.id, ...doc.data() } as AdSpace);
      });
      setSpaces(spacesData);
    });

    // Subscribe to ad contents changes
    const contentsQuery = query(collection(db, 'ad_contents'), orderBy('priority', 'desc'));
    const unsubscribeContents = onSnapshot(contentsQuery, (snapshot) => {
      const contentsData: AdContent[] = [];
      snapshot.forEach((doc) => {
        contentsData.push({ id: doc.id, ...doc.data() } as AdContent);
      });
      setContents(contentsData);
      setLoading(false);
    });

    return () => {
      unsubscribeSpaces();
      unsubscribeContents();
    };
  }, []);

  const handleSpaceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingSpace) {
        const spaceRef = doc(db, 'ad_spaces', editingSpace.id);
        await updateDoc(spaceRef, {
          ...spaceForm,
          updated_at: Timestamp.now()
        });
      } else {
        await addDoc(collection(db, 'ad_spaces'), {
          ...spaceForm,
          created_at: Timestamp.now(),
          updated_at: Timestamp.now()
        });
      }
      
      setShowSpaceForm(false);
      setEditingSpace(null);
      setSpaceForm({
        name: '',
        location: '',
        type: 'adsense',
        status: 'inactive'
      });
    } catch (error) {
      console.error('Error saving ad space:', error);
    }
  };

  const handleContentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpace) return;

    try {
      const contentData = {
        ...contentForm,
        space_id: selectedSpace,
        start_date: new Date(contentForm.start_date).toISOString(),
        end_date: contentForm.end_date ? new Date(contentForm.end_date).toISOString() : null
      };

      if (editingContent) {
        const contentRef = doc(db, 'ad_contents', editingContent.id);
        await updateDoc(contentRef, {
          ...contentData,
          updated_at: Timestamp.now()
        });
      } else {
        await addDoc(collection(db, 'ad_contents'), {
          ...contentData,
          created_at: Timestamp.now(),
          updated_at: Timestamp.now()
        });
      }
      
      setShowContentForm(false);
      setEditingContent(null);
      setContentForm({
        title: '',
        content: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: '',
        priority: 0,
        status: 'inactive'
      });
    } catch (error) {
      console.error('Error saving ad content:', error);
    }
  };

  const handleDeleteSpace = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet emplacement publicitaire ?')) return;

    try {
      await deleteDoc(doc(db, 'ad_spaces', id));
      // Firebase will automatically update the UI through onSnapshot
    } catch (error) {
      console.error('Error deleting ad space:', error);
    }
  };

  const handleDeleteContent = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette publicité ?')) return;

    try {
      await deleteDoc(doc(db, 'ad_contents', id));
      // Firebase will automatically update the UI through onSnapshot
    } catch (error) {
      console.error('Error deleting ad content:', error);
    }
  };

  const getLocationLabel = (location: string) => {
    const labels: Record<string, string> = {
      'home_sidebar': 'Barre latérale (Accueil)',
      'home_between_cards': 'Entre les cartes (Accueil)',
      'detail_sidebar': 'Barre latérale (Détail)',
      'detail_bottom': 'Bas de page (Détail)',
      'profile_sidebar': 'Barre latérale (Profil)'
    };
    return labels[location] || location;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Gestion des Publicités</h2>

      {/* Ad Spaces Section */}
      <div className="bg-gray-800/50 rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-white">Emplacements publicitaires</h3>
          <button
            onClick={() => {
              setEditingSpace(null);
              setShowSpaceForm(true);
            }}
            className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg flex items-center gap-2"
          >
            <Plus size={18} />
            <span>Nouvel emplacement</span>
          </button>
        </div>

        {showSpaceForm && (
          <div className="mb-6 bg-gray-900/50 rounded-lg p-6">
            <form onSubmit={handleSpaceSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Nom de l'emplacement
                </label>
                <input
                  type="text"
                  value={spaceForm.name}
                  onChange={(e) => setSpaceForm({ ...spaceForm, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Emplacement
                </label>
                <select
                  value={spaceForm.location}
                  onChange={(e) => setSpaceForm({ ...spaceForm, location: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Sélectionnez un emplacement</option>
                  <option value="home_sidebar">Barre latérale (Accueil)</option>
                  <option value="home_between_cards">Entre les cartes (Accueil)</option>
                  <option value="detail_sidebar">Barre latérale (Détail)</option>
                  <option value="detail_bottom">Bas de page (Détail)</option>
                  <option value="profile_sidebar">Barre latérale (Profil)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Type de publicité
                </label>
                <select
                  value={spaceForm.type}
                  onChange={(e) => setSpaceForm({ ...spaceForm, type: e.target.value as AdSpace['type'] })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="adsense">Google AdSense</option>
                  <option value="affiliate">Affiliation</option>
                  <option value="custom">Personnalisé</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Statut
                </label>
                <select
                  value={spaceForm.status}
                  onChange={(e) => setSpaceForm({ ...spaceForm, status: e.target.value as AdSpace['status'] })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="active">Actif</option>
                  <option value="inactive">Inactif</option>
                </select>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSpaceForm(false);
                    setEditingSpace(null);
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg"
                >
                  {editingSpace ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {spaces.map((space) => (
            <div
              key={space.id}
              className="bg-gray-900/50 rounded-lg p-4 flex items-center justify-between"
            >
              <div>
                <h4 className="font-medium text-white">{space.name}</h4>
                <p className="text-sm text-gray-400">{getLocationLabel(space.location)}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    space.type === 'adsense' ? 'bg-blue-900/50 text-blue-300' :
                    space.type === 'affiliate' ? 'bg-green-900/50 text-green-300' :
                    'bg-orange-900/50 text-orange-300'
                  }`}>
                    {space.type === 'adsense' ? 'AdSense' :
                     space.type === 'affiliate' ? 'Affiliation' : 'Personnalisé'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    space.status === 'active' ? 'bg-green-900/50 text-green-300' : 'bg-gray-700 text-gray-300'
                  }`}>
                    {space.status === 'active' ? 'Actif' : 'Inactif'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingSpace(space);
                    setSpaceForm({
                      name: space.name,
                      location: space.location,
                      type: space.type,
                      status: space.status
                    } as SpaceFormState);
                    setShowSpaceForm(true);
                  }}
                  className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
                >
                  <Edit2 size={18} />
                </button>
                <button
                  onClick={() => handleDeleteSpace(space.id)}
                  className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-800"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Ad Contents Section */}
      <div className="bg-gray-800/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium text-white">Contenu publicitaire</h3>
          <button
            onClick={() => {
              setEditingContent(null);
              setShowContentForm(true);
            }}
            className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg flex items-center gap-2"
            disabled={spaces.length === 0}
          >
            <Plus size={18} />
            <span>Nouvelle publicité</span>
          </button>
        </div>

        {showContentForm && (
          <div className="mb-6 bg-gray-900/50 rounded-lg p-6">
            <form onSubmit={handleContentSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Emplacement
                </label>
                <select
                  value={selectedSpace || ''}
                  onChange={(e) => setSelectedSpace(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                >
                  <option value="">Sélectionnez un emplacement</option>
                  {spaces.map((space) => (
                    <option key={space.id} value={space.id}>
                      {space.name} - {getLocationLabel(space.location)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Titre de la publicité
                </label>
                <input
                  type="text"
                  value={contentForm.title}
                  onChange={(e) => setContentForm({ ...contentForm, title: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Contenu publicitaire
                </label>
                <textarea
                  value={contentForm.content}
                  onChange={(e) => setContentForm({ ...contentForm, content: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  rows={5}
                  required
                  placeholder="Code AdSense, lien d'affiliation ou HTML personnalisé"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Date de début
                  </label>
                  <input
                    type="date"
                    value={contentForm.start_date}
                    onChange={(e) => setContentForm({ ...contentForm, start_date: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Date de fin (optionnel)
                  </label>
                  <input
                    type="date"
                    value={contentForm.end_date}
                    onChange={(e) => setContentForm({ ...contentForm, end_date: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Priorité
                  </label>
                  <input
                    type="number"
                    value={contentForm.priority}
                    onChange={(e) => setContentForm({ ...contentForm, priority: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    min="0"
                    max="100"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Statut
                  </label>
                  <select
                    value={contentForm.status}
                    onChange={(e) => setContentForm({ ...contentForm, status: e.target.value as AdContent['status'] })}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                    required
                  >
                    <option value="active">Actif</option>
                    <option value="inactive">Inactif</option>
                    <option value="scheduled">Programmé</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowContentForm(false);
                    setEditingContent(null);
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-lg"
                >
                  {editingContent ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="space-y-4">
          {contents.map((content) => {
            const space = spaces.find(s => s.id === content.space_id);
            return (
              <div
                key={content.id}
                className="bg-gray-900/50 rounded-lg p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-medium text-white">{content.title}</h4>
                    <p className="text-sm text-gray-400">{space?.name} - {space ? getLocationLabel(space.location) : 'Unknown'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setEditingContent(content);
                        setSelectedSpace(content.space_id);
                        setContentForm({
                          title: content.title,
                          content: content.content,
                          start_date: content.start_date.split('T')[0],
                          end_date: content.end_date ? content.end_date.split('T')[0] : '',
                          priority: content.priority,
                          status: content.status
                        } as ContentFormState);
                        setShowContentForm(true);
                      }}
                      className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteContent(content.id)}
                      className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-gray-800"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="mt-2">
                  <div className="flex flex-wrap gap-2">
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      content.status === 'active' ? 'bg-green-900/50 text-green-300' :
                      content.status === 'scheduled' ? 'bg-blue-900/50 text-blue-300' :
                      'bg-gray-700 text-gray-300'
                    }`}>
                      {content.status === 'active' ? 'Actif' :
                       content.status === 'scheduled' ? 'Programmé' : 'Inactif'}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-purple-900/50 text-purple-300">
                      Priorité: {content.priority}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300">
                      {new Date(content.start_date).toLocaleDateString()}
                      {content.end_date && ` - ${new Date(content.end_date).toLocaleDateString()}`}
                    </span>
                  </div>
                </div>

                <div className="mt-3 p-3 bg-gray-800 rounded border border-gray-700">
                  <pre className="text-xs text-gray-300 whitespace-pre-wrap font-mono">
                    {content.content}
                  </pre>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdManagement;