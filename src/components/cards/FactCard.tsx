import React from 'react';
import { motion } from 'framer-motion';
import { useFacts, Fact } from '../../context/FactContext';
import { useTranslation } from 'react-i18next';

interface FactCardProps {
  fact: Fact;
  onClick: () => void;
  renderActions?: () => React.ReactNode;
}

const FactCard: React.FC<FactCardProps> = ({ fact, onClick, renderActions }) => {
  const { getLocalizedFact } = useFacts();
  const { i18n, t } = useTranslation();
  const localizedContent = getLocalizedFact(fact);
  
  console.log('FactCard - Current language:', i18n.language);
  console.log('FactCard - Localized content:', localizedContent.title.substring(0, 50) + '...');
  
  // Animation for the WTF score badge
  const badgeVariants = {
    initial: { scale: 0.8, opacity: 0 },
    animate: { 
      scale: 1, 
      opacity: 1,
      transition: {
        delay: 0.2,
        duration: 0.3,
        type: 'spring',
        stiffness: 300
      }
    }
  };
  
  // Determine color based on WTF score
  const getScoreColor = (score: number) => {
    if (score >= 8) return 'bg-gradient-to-r from-purple-600 to-pink-500';
    if (score >= 6) return 'bg-gradient-to-r from-blue-600 to-purple-600';
    if (score >= 4) return 'bg-gradient-to-r from-green-500 to-blue-500';
    return 'bg-gradient-to-r from-yellow-400 to-green-500';
  };
  
  // Create a random glitch effect that occasionally triggers
  const glitchVariants = {
    initial: { filter: 'none' },
    glitch: {
      filter: [
        'none',
        'blur(1px) hue-rotate(90deg)',
        'none',
        'blur(2px) hue-rotate(-90deg)',
        'none'
      ],
      transition: {
        duration: 0.2,
        times: [0, 0.1, 0.2, 0.3, 1],
        repeatDelay: 5,
        repeat: Infinity,
        repeatType: 'mirror' as const
      }
    }
  };

  return (
    <motion.div 
      className="w-full h-full rounded-xl overflow-hidden relative shadow-xl bg-black border border-purple-900/30"
      variants={glitchVariants}
      initial="initial"
      animate="glitch"
      onClick={onClick}
    >
      {/* Background image with overlay */}
      <div className="absolute inset-0 bg-cover bg-center" style={{ 
        backgroundImage: `url(${fact.imageUrl || 'https://images.pexels.com/photos/1252890/pexels-photo-1252890.jpeg'})`,
      }}>
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-indigo-950/90 backdrop-blur-[2px]"></div>
      </div>
      
      {/* Content */}
      <div className="relative h-full flex flex-col justify-between p-6 z-10">
        {/* WTF Score Badge */}
        <motion.div 
          className={`absolute top-4 right-4 ${getScoreColor(fact.wtfScore)} text-white font-bold px-3 py-2 rounded-full flex items-center shadow-lg`}
          variants={badgeVariants}
          initial="initial"
          animate="animate"
        >
          <span className="mr-1 text-xs uppercase">WTF</span>
          <span className="text-lg">{fact.wtfScore || Math.floor(Math.random() * 5) + 6}</span>
        </motion.div>
        
        <div className="mt-8 mb-auto">
          <h2 className="text-2xl font-bold mb-3 leading-tight text-white">
            {localizedContent.title}
          </h2>
          <p className="text-gray-200 line-clamp-3 mb-4">
            {fact.preview || localizedContent.content}
          </p>
          <div className="flex items-center text-sm text-gray-300">
            <span className="bg-purple-900/50 px-2 py-1 rounded mr-2">{fact.category}</span>
            <span className="text-gray-400">• {fact.source}</span>
          </div>
        </div>
        
        {/* Tap for more */}
        <div className="mt-4 text-center">
          <span className="text-gray-400 text-sm inline-block border-b border-purple-500/30 pb-1">
            {i18n.language === 'fr' ? 'Cliquez pour en savoir plus' :
             i18n.language === 'en' ? 'Click to learn more' : '点击了解更多'}
          </span>
        </div>
        
        {/* Render custom actions if provided */}
        {renderActions && renderActions()}
      </div>
    </motion.div>
  );
};

export default FactCard;