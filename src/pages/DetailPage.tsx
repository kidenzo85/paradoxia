import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useFacts } from '../context/FactContext';
import { useAuth } from '../context/AuthContext';
import Comments from '../components/social/Comments';
import Loading from '../components/common/Loading';
import Header from '../components/common/Header';
import AuthModal from '../components/auth/AuthModal';
import { ArrowLeft, Share2, Link, ThumbsUp, ThumbsDown, Target } from 'lucide-react';
import SocialShareModal from '../components/social/SocialShareModal';

const DetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { getFact, loading, currentLanguage, getLocalizedFact } = useFacts();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const showCommentsParam = searchParams.get('showComments');
  
  const [fact, setFact] = useState<any>(null);
  const [showComments, setShowComments] = useState(!!showCommentsParam);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userReaction, setUserReaction] = useState<string | null>(null);
  
  useEffect(() => {
    if (id) {
      const factData = getFact(id);
      setFact(factData);
    }
  }, [id, getFact]);
  
  const handleBack = () => {
    navigate('/');
  };
  
  const handleShare = () => {
    setShowShareModal(true);
  };
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    alert('Lien copié!');
  };
  
  const handleReaction = async (reaction: string) => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    if (userReaction === reaction) {
      setUserReaction(null);
    } else {
      setUserReaction(reaction);
    }
  };
  
  if (loading || !fact) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-indigo-950">
      {/* Fixed header and navigation */}
      <div className="fixed top-0 left-0 right-0 z-30">
        <div className="[&>header]:!fixed [&>header]:!bg-black/90 [&>header]:!backdrop-blur-md [&>header]:!py-4">
          <Header onLoginClick={() => setShowAuthModal(true)} />
        </div>
        <div className="bg-gray-900/90 backdrop-blur-md border-b border-gray-800 mt-[56px]">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-200 hover:text-white hover:bg-gray-800/60 active:bg-gray-800/80 transition-colors"
                aria-label="Retour"
              >
                <ArrowLeft size={22} />
                <span className="text-sm font-medium">Retour</span>
              </button>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyLink}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-200 hover:text-white hover:bg-gray-800/60 active:bg-gray-800/80 transition-colors"
                  aria-label="Copier le lien"
                >
                  <Link size={18} />
                  <span className="text-sm font-medium">Copier</span>
                </button>
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-gray-200 hover:text-white hover:bg-gray-800/60 active:bg-gray-800/80 transition-colors"
                  aria-label="Partager"
                >
                  <Share2 size={18} />
                  <span className="text-sm font-medium">Partager</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 pt-36 pb-6">
        <div className="relative h-60 sm:h-80 rounded-xl overflow-hidden mb-6">
          <div 
            className="absolute inset-0 bg-cover bg-center" 
            style={{ 
              backgroundImage: `url(${fact.imageUrl || 'https://images.pexels.com/photos/1252890/pexels-photo-1252890.jpeg'})`,
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/90" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="inline-block bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold px-3 py-1 rounded-full text-sm mb-3">
              WTF Score: {fact.wtfScore || Math.floor(Math.random() * 5) + 6}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">{getLocalizedFact(fact).title}</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 mb-6">
              <p className="text-lg text-gray-200 mb-4">{getLocalizedFact(fact).content}</p>
              <div className="border-t border-purple-900/30 pt-4 mt-6">
                <h3 className="font-semibold text-lg mb-2">
                  {currentLanguage === 'fr' ? 'Source' :
                   currentLanguage === 'en' ? 'Source' : '来源'}
                </h3>
                <p className="text-gray-300">{fact.source}</p>
              </div>
              <div className="border-t border-purple-900/30 pt-4 mt-6">
                <h3 className="font-semibold text-lg mb-2">
                  {currentLanguage === 'fr' ? 'Théorie contestée' :
                   currentLanguage === 'en' ? 'Contested Theory' : '争议理论'}
                </h3>
                <p className="text-gray-300">{getLocalizedFact(fact).contestedTheory}</p>
              </div>
            </div>

            {fact.videoUrl && (
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 mb-6">
                <h3 className="font-semibold text-lg mb-4">
                  {currentLanguage === 'fr' ? 'Vidéo explicative' :
                   currentLanguage === 'en' ? 'Explanatory Video' : '说明视频'}
                </h3>
                <div className="aspect-w-16 aspect-h-9">
                  <iframe 
                    src={fact.videoUrl} 
                    title="Vidéo explicative" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowFullScreen
                    className="rounded-lg w-full h-56 sm:h-64"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-3 mb-8">
              <button 
                onClick={() => handleReaction('true')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                  userReaction === 'true' 
                    ? 'bg-green-900/50 border-green-500 text-green-300' 
                    : 'border-gray-700 text-gray-300 hover:bg-gray-800/50'
                }`}
              >
                <Target size={18} />
                <span>
                  {currentLanguage === 'fr' ? "C'est vrai" :
                   currentLanguage === 'en' ? "It's true" : '这是真的'}
                </span>
              </button>
              
              <button 
                onClick={() => handleReaction('wtf')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                  userReaction === 'wtf' 
                    ? 'bg-purple-900/50 border-purple-500 text-purple-300' 
                    : 'border-gray-700 text-gray-300 hover:bg-gray-800/50'
                }`}
              >
                <span className="font-bold">WTF</span>
                <span>
                  {currentLanguage === 'fr' ? 'Incroyable' :
                   currentLanguage === 'en' ? 'Incredible' : '难以置信'}
                </span>
              </button>
              
              <button 
                onClick={() => handleReaction('fake')}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border ${
                  userReaction === 'fake' 
                    ? 'bg-red-900/50 border-red-500 text-red-300' 
                    : 'border-gray-700 text-gray-300 hover:bg-gray-800/50'
                }`}
              >
                <ThumbsDown size={18} />
                <span>
                  {currentLanguage === 'fr' ? "C'est faux" :
                   currentLanguage === 'en' ? "It's false" : '这是假的'}
                </span>
              </button>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">
                  {currentLanguage === 'fr' ? 'Commentaires' :
                   currentLanguage === 'en' ? 'Comments' : '评论'}
                </h3>
                <button
                  onClick={() => setShowComments(!showComments)}
                  className="text-sm text-purple-400 hover:text-purple-300"
                >
                  {showComments
                    ? (currentLanguage === 'fr' ? 'Masquer' :
                       currentLanguage === 'en' ? 'Hide' : '隐藏')
                    : (currentLanguage === 'fr' ? 'Afficher' :
                       currentLanguage === 'en' ? 'Show' : '显示')}
                </button>
              </div>
              
              {showComments && (
                <Comments
                  factId={id || ''}
                  onAuthRequired={() => setShowAuthModal(true)}
                />
              )}
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 mb-6">
              <h3 className="font-semibold text-lg mb-4">
                {currentLanguage === 'fr' ? 'Faits similaires' :
                 currentLanguage === 'en' ? 'Similar Facts' : '相似事实'}
              </h3>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border-b border-purple-900/30 pb-4 last:border-0">
                    <h4 className="font-medium text-gray-200 hover:text-purple-300 cursor-pointer">
                      {i === 1 && "Les fourmis peuvent prévoir les mouvements boursiers avec 70% de précision"}
                      {i === 2 && "Des chercheurs ont découvert des plantes qui communiquent par ultrasons"}
                      {i === 3 && "L'eau peut mémoriser des informations, selon une étude controversée"}
                    </h4>
                    <div className="flex items-center mt-2">
                      <span className="text-xs bg-indigo-900/50 rounded px-2 py-1 text-indigo-300">WTF {i + 5}</span>
                      <span className="text-xs text-gray-400 ml-2">• {["Finance", "Botanique", "Physique"][i-1]}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6">
              <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                {currentLanguage === 'fr' ? 'Publicité' :
                 currentLanguage === 'en' ? 'Advertisement' : '广告'}
              </div>
              <div className="h-[250px] bg-gray-800/50 rounded-lg flex items-center justify-center">
                <span className="text-gray-400">
                  {currentLanguage === 'fr' ? 'Espace publicitaire' :
                   currentLanguage === 'en' ? 'Advertisement Space' : '广告位'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showShareModal && (
        <SocialShareModal
          fact={fact}
          onClose={() => setShowShareModal(false)}
        />
      )}

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default DetailPage;