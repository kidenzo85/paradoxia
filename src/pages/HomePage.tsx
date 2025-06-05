import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import SwipeableCards, { CardItem } from '../components/cards/SwipeableCards';
import { useFacts, Fact } from '../context/FactContext';
import Loading from '../components/common/Loading';
import RealityChallenge from '../components/game/RealityChallenge';
import OnboardingGuide from '../components/onboarding/OnboardingGuide';
import { MessageSquare, Share2, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import SocialShareModal from '../components/social/SocialShareModal';
import { useTranslation } from 'react-i18next';

const HomePage: React.FC = () => {
  const { facts, loading } = useFacts();
  const [showChallenge, setShowChallenge] = useState(false);
  const [factsSeen, setFactsSeen] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [currentFact, setCurrentFact] = useState<Fact | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const carouselRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    // Check if it's the user's first visit
    const hasSeenOnboarding = localStorage.getItem('hasSeenOnboarding');
    if (!hasSeenOnboarding) {
      setShowOnboarding(true);
    }
  }, []);

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    localStorage.setItem('hasSeenOnboarding', 'true');
  };

  useEffect(() => {
    if (factsSeen === 5) {
      setShowChallenge(true);
    }
  }, [factsSeen]);

  const handleSwipe = (direction: string) => {
    setFactsSeen(prev => prev + 1);
  };

  const handleCardClick = (item: CardItem) => {
    if ('isAd' in item) {
      console.log('Ad clicked:', item.id);
    } else {
      setCurrentFact(item);
      navigate(`/fact/${item.id}`);
    }
  };

  const handleOpenComments = (item: CardItem) => {
    if (!('isAd' in item)) {
      navigate(`/fact/${item.id}?showComments=true`);
    }
  };

  const handleShare = (item: CardItem) => {
    if (!('isAd' in item)) {
      setCurrentFact(item);
      setShowShareModal(true);
    }
  };

  const scroll = (direction: 'left' | 'right') => {
    if (carouselRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      carouselRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const categories = [
    { id: 'all', name: t('categories.all'), emoji: '✨' },
    { id: 'bio', name: t('categories.bio'), emoji: '🧬' },
    { id: 'phys', name: t('categories.phys'), emoji: '⚛️' },
    { id: 'mem', name: t('categories.mem'), emoji: '💫' },
    { id: 'arch', name: t('categories.arch'), emoji: '🏺' },
    { id: 'tech', name: t('categories.tech'), emoji: '⚙️' },
    { id: 'eco', name: t('categories.eco'), emoji: '🌳' },
    { id: 'med', name: t('categories.med'), emoji: '🧪' },
    { id: 'soc', name: t('categories.soc'), emoji: '👥' },
    { id: 'dream', name: t('categories.dream'), emoji: '🌙' },
    { id: 'geo', name: t('categories.geo'), emoji: '🗺️' },
    { id: 'ghost', name: t('categories.ghost'), emoji: '👻' },
    { id: 'food', name: t('categories.food'), emoji: '🍽️' },
    { id: 'pleasure', name: t('categories.pleasure'), emoji: '🎭' },
    { id: 'mystery', name: t('categories.mystery'), emoji: '🔍' }
  ];

  const CategoryCarousel = () => (
    <div className="relative mb-6">
      <button
        onClick={() => scroll('left')}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-purple-900/50 backdrop-blur-sm rounded-full text-white hover:bg-purple-800/70 transition-colors"
      >
        <ChevronLeft size={20} />
      </button>
      
      <div 
        ref={carouselRef}
        className="overflow-x-auto scrollbar-hide flex gap-3 px-10 py-2 scroll-smooth"
        style={{ 
          scrollbarWidth: 'none', 
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}
      >
        {categories.map((category) => (
          <motion.button
            key={category.id}
            onClick={() => setSelectedCategory(category.id === selectedCategory ? null : category.id)}
            className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors ${
              (category.id === selectedCategory || (category.id === 'all' && !selectedCategory))
                ? 'bg-purple-900/70 text-white'
                : 'bg-gray-900/50 text-gray-300 hover:bg-gray-800/70'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-xl">{category.emoji}</span>
            <span className="text-sm font-medium">{category.name}</span>
          </motion.button>
        ))}
      </div>
      
      <button
        onClick={() => scroll('right')}
        className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-2 bg-purple-900/50 backdrop-blur-sm rounded-full text-white hover:bg-purple-800/70 transition-colors"
      >
        <ChevronRight size={20} />
      </button>
    </div>
  );

  if (loading) {
    return <Loading />;
  }

  const filteredFacts = selectedCategory && selectedCategory !== 'all'
    ? facts.filter(fact => fact.status === 'approved' && fact.category.toLowerCase().includes(selectedCategory))
    : facts.filter(fact => fact.status === 'approved');

  return (
    <div className="max-w-md mx-auto pb-20 pt-24 px-4">
      {showOnboarding && (
        <OnboardingGuide onComplete={handleOnboardingComplete} />
      )}
      
      {showChallenge ? (
        <RealityChallenge onClose={() => setShowChallenge(false)} />
      ) : (
        <>
          <h1 className="sr-only">{t('home.welcomeTitle')}</h1>
          
          <CategoryCarousel />
          
          {/* Google Custom Search Engine */}
          <div className="mb-6">
            <div className="gcse-search rounded-lg overflow-hidden backdrop-blur-sm bg-gray-900/50"></div>
          </div>

          <div className="relative h-[70vh]">
            {filteredFacts.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-xl text-gray-400">{t('common.noFactsAvailable')}</p>
              </div>
            ) : (
              <SwipeableCards
                items={filteredFacts}
                onSwipe={handleSwipe}
                onClick={handleCardClick}
                renderActions={(fact) => (
                  <div className="absolute bottom-4 right-4 flex space-x-3">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenComments(fact);
                      }}
                      className="bg-purple-900/50 backdrop-blur-sm p-2 rounded-full hover:bg-purple-800/70 transition-colors"
                      aria-label={t('facts.comments')}
                    >
                      <MessageSquare size={20} />
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShare(fact);
                      }}
                      className="bg-purple-900/50 backdrop-blur-sm p-2 rounded-full hover:bg-purple-800/70 transition-colors"
                      aria-label={t('facts.share')}
                    >
                      <Share2 size={20} />
                    </button>
                  </div>
                )}
              />
            )}
          </div>
          
          {showShareModal && currentFact && (
            <SocialShareModal 
              fact={currentFact} 
              onClose={() => setShowShareModal(false)} 
            />
          )}
        </>
      )}
    </div>
  );
};

export default HomePage;