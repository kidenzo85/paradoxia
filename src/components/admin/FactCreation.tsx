import React, { useState, ReactElement } from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import type { GeneratedFact } from '../../services/factGeneration';
import { generateFact, findRelatedMedia } from '../../services/factGeneration';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { auth } from '../../lib/firebase';
import { Language, Translation, translateFact } from '../../services/translation';

const db = getFirestore();

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

interface Media {
  imageUrl: string | null;
  videoUrl: string | null;
}

interface FactDocument extends Omit<GeneratedFact, 'translations' | 'imageUrl'>, Media {
  status: 'pending';
  createdAt: Date;
  createdBy: string | undefined;
  translations?: Partial<Record<Language, Translation>>;
}

interface ResultState {
  success: boolean;
  message: string;
}

const FactCreation = (): JSX.Element => {
  const [numFacts, setNumFacts] = useState(5);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [customPrompt, setCustomPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ResultState | null>(null);
  const [selectedLanguages, setSelectedLanguages] = useState<Language[]>(['fr', 'en', 'zh', 'ar', 'es']);
  const [autoTranslate, setAutoTranslate] = useState(true);

  const languages: { code: Language; name: string }[] = [
    { code: 'fr', name: 'Français' },
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文' },
    { code: 'ar', name: 'العربية' },
    { code: 'es', name: 'Español' }
  ];
  
  const handleCategoryToggle = (categoryId: string): void => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(c => c !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };
  
  const handleGenerate = async (): Promise<void> => {
    setIsLoading(true);
    setResult(null);
    
    try {
      // Validate input
      if (numFacts < 1 || numFacts > 50) {
        throw new Error('Le nombre de faits doit être entre 1 et 50');
      }

      if (selectedCategories.length === 0 && !customPrompt) {
        throw new Error('Veuillez sélectionner au moins une catégorie ou fournir un prompt personnalisé');
      }

      // Validate categories against the current list
      const invalidCategories = selectedCategories.filter(
        catId => !categories.some(c => c.id === catId)
      );
      
      if (invalidCategories.length > 0) {
        throw new Error(`Catégories invalides détectées: ${invalidCategories.join(', ')}. Veuillez rafraîchir la page.`);
      }

      const generatedFacts: FactDocument[] = [];
      const factsRef = collection(db, 'facts');
      
      for (let i = 0; i < numFacts; i++) {
        // Generate fact
        const prompt = customPrompt || `Generate a scientific fact in the following categories: ${selectedCategories.map(id =>
          categories.find(c => c.id === id)?.name || id
        ).join(', ')}`;
        const fact = await generateFact(prompt);
        
        if (!fact) {
          throw new Error('Failed to generate fact');
        }
        
        // Find related media
        let media: Media = { imageUrl: null, videoUrl: null };
        try {
          const fetchedMedia = await findRelatedMedia(fact);
          media = {
            imageUrl: fetchedMedia.imageUrl || null,
            videoUrl: fetchedMedia.videoUrl || null
          };
        } catch (error) {
          console.warn('Failed to find related media:', error);
          // Continue with text-only fact
        }
        
        // Generate translations if enabled
        let translations: Partial<Record<Language, Translation>> = {};
        if (autoTranslate && selectedLanguages.length > 0) {
          const translationResults = await Promise.all(
            selectedLanguages.map(async (lang) => {
              const translation = await translateFact({
                title: fact.title,
                content: fact.content,
                contestedTheory: fact.contestedTheory
              }, lang);
              return [lang, translation];
            })
          );
          
          translations = Object.fromEntries(
            translationResults.filter(([_, translation]) => translation !== null)
          );
        }

        // Save to Firestore
        const docData: FactDocument = {
          ...fact,
          translations,
          imageUrl: media.imageUrl || null,
          videoUrl: media.videoUrl,
          status: 'pending' as const,
          createdAt: new Date(),
          createdBy: auth.currentUser?.uid
        };
        
        await addDoc(factsRef, docData);
        generatedFacts.push(docData);
      }
      
      const hasMediaMissing = generatedFacts.some(fact => !fact.imageUrl && !fact.videoUrl);
      const mediaStatus = hasMediaMissing ? ' (certains faits sont sans média)' : '';
        
      setResult({
        success: true,
        message: `${numFacts} faits ont été générés avec succès${mediaStatus} et placés dans la file d'attente de modération.`
      });
    } catch (error: any) {
      console.error('Error generating facts:', error);
      let errorMessage = "Une erreur s'est produite lors de la génération des faits.";
      
      if (error.message.includes('API key not configured')) {
        errorMessage = "Erreur de configuration: Clé API manquante. Veuillez contacter l'administrateur.";
      } else if (error.message.includes('Invalid fact data format') || error.message.includes('Failed to parse API response as JSON') || error.message.includes('Unexpected token')) {
        errorMessage = "Erreur de format: La réponse de l'IA n'est pas dans le format JSON attendu. Veuillez réessayer.";
      } else if (error.message === 'Failed to generate fact') {
        errorMessage = "Échec de la génération du fait. Veuillez réessayer avec un prompt différent.";
      } else if (error.message.includes('Le nombre de faits') || error.message.includes('catégorie')) {
        errorMessage = error.message;
      }
      
      setResult({
        success: false,
        message: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Création de Faits Insolites</h2>
      
      {result && (
        <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
          result.success 
            ? 'bg-green-900/30 border border-green-500/50' 
            : 'bg-red-900/30 border border-red-500/50'
        }`}>
          {result.success ? (
            <CheckCircle className="text-green-400 mt-0.5\" size={18} />
          ) : (
            <AlertCircle className="text-red-400 mt-0.5" size={18} />
          )}
          <p className={result.success ? 'text-green-300' : 'text-red-300'}>
            {result.message}
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-6">
          {/* Number of facts */}
          <div className="bg-gray-800/40 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-4">Nombre de faits</h3>
            <p className="text-gray-400 mb-4">Combien de faits souhaitez-vous générer?</p>
            
            <div className="flex items-center">
              <input
                type="range"
                min={1}
                max={50}
                value={numFacts}
                onChange={(e) => setNumFacts(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
              />
              <span className="ml-4 text-lg text-white font-medium w-10 text-center">
                {numFacts}
              </span>
            </div>
          </div>
          
          {/* Language Settings */}
          <div className="bg-gray-800/40 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-white mb-4">Langues</h3>
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="autoTranslate"
                checked={autoTranslate}
                onChange={(e) => setAutoTranslate(e.target.checked)}
                className="mr-3"
              />
              <label htmlFor="autoTranslate" className="text-gray-300">
                Traduction automatique
              </label>
            </div>
            {autoTranslate && (
              <div className="space-y-2">
                {languages.map((lang) => (
                  <div key={lang.code} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`lang-${lang.code}`}
                      checked={selectedLanguages.includes(lang.code)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedLanguages([...selectedLanguages, lang.code]);
                        } else {
                          setSelectedLanguages(selectedLanguages.filter(l => l !== lang.code));
                        }
                      }}
                      className="mr-3"
                    />
                    <label htmlFor={`lang-${lang.code}`} className="text-gray-300">
                      {lang.name}
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Categories */}
          <div className="bg-gray-800/40 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-4">Catégories</h3>
            <p className="text-gray-400 mb-4">Filtrer par domaines scientifiques (optionnel)</p>
            
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => handleCategoryToggle(category.id)}
                  className={`px-3 py-1 rounded-full text-sm flex items-center gap-2 ${
                    selectedCategories.includes(category.id)
                      ? 'bg-purple-700 text-white'
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  <span>{category.emoji}</span>
                  <span>{category.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {/* Right column */}
        <div className="space-y-6">
          {/* Custom Prompt */}
          <div className="bg-gray-800/40 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-4">Prompt personnalisé</h3>
            <p className="text-gray-400 mb-4">Personnalisez les instructions données à l'IA (optionnel)</p>
            
            <textarea
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              placeholder="Génère un fait scientifique réel mais contre-intuitif répondant à : 1. Basé sur minimum 1 étude peer-reviewed..."
              className="w-full px-4 py-3 text-gray-200 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={8}
            ></textarea>
          </div>
          
          {/* Example of good prompt */}
          <div className="bg-gray-800/40 rounded-lg p-6">
            <h3 className="text-lg font-medium text-white mb-4">Exemple de prompt efficace</h3>
            <div className="bg-gray-900 p-4 rounded border border-gray-700">
              <pre className="text-gray-300 whitespace-pre-wrap text-sm font-mono">
{`Génère un fait au format JSON strict suivant:
{
  "title": "Titre concis",
  "content": "Description détaillée du phénomène",
  "source": "Institution + Année",
  "category": "Domaine scientifique",
  "wtfScore": "Note de 1-10",
  "contestedTheory": "Théorie scientifique contestée"
}

Le fait doit être:
1. Réel et vérifié par peer-review
2. Contre-intuitif ou inexplicable
3. Basé sur une étude rejetée par >40% de la communauté`}
              </pre>
            </div>
          </div>
        </div>
      </div>
      
      {/* Generate button */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="px-6 py-3 bg-purple-700 hover:bg-purple-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white\" xmlns="http://www.w3.org/2000/svg\" fill="none\" viewBox="0 0 24 24">
                <circle className="opacity-25\" cx="12\" cy="12\" r="10\" stroke="currentColor\" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Génération en cours...
            </>
          ) : (
            <>Générer {numFacts} fait{numFacts > 1 ? 's' : ''}</>
          )}
        </button>
      </div>
    </div>
  );
};

export default FactCreation;