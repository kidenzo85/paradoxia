import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import FactCard from './FactCard';
import AdCard from './AdCard';
import { Fact } from '../../context/FactContext';

type AdItem = {
  id: string;
  isAd: true;
  title: string;
};

type CardItem = Fact | AdItem;

const isAd = (item: CardItem): item is AdItem => {
  return 'isAd' in item;
};

interface SwipeableCardsProps {
  items: Fact[];
  onSwipe: (direction: string) => void;
  onClick: (item: CardItem) => void;
  renderActions?: (item: CardItem) => React.ReactNode;
}

const SwipeableCards: React.FC<SwipeableCardsProps> = ({ 
  items, 
  onSwipe, 
  onClick,
  renderActions 
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<string | null>(null);
  const controls = useAnimation();
  const constraintsRef = useRef(null);
  
  // Handle animation after direction changes
  useEffect(() => {
    if (direction) {
      const animate = async () => {
        await controls.start({
          x: direction === 'left' ? -500 : 500,
          opacity: 0,
          transition: { duration: 0.3 }
        });
        
        controls.set({ x: 0, opacity: 1 });
        setCurrentIndex(prevIndex => (prevIndex + 1) % allItems.length);
        onSwipe(direction);
        setDirection(null);
      };
      
      animate();
    }
  }, [direction, controls, onSwipe]);
  
  // Insert ad cards after every 3-5 regular cards
  const shouldShowAd = (index: number) => {
    return (index + 1) % 4 === 0; // Show ad after every 3 regular cards
  };
  
  const getItemsWithAds = (): CardItem[] => {
    const itemsWithAds: CardItem[] = [...items];
    let adCount = 0;
    
    for (let i = 3; i < items.length; i += 4) {
      if (i + adCount < itemsWithAds.length) {
        itemsWithAds.splice(i + adCount, 0, { 
          id: `ad-${adCount}`, 
          isAd: true,
          title: "Publicité",
        });
        adCount++;
      }
    }
    
    return itemsWithAds;
  };
  
  const allItems = getItemsWithAds();
  
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const threshold = 100; // minimum distance to consider a swipe
    
    if (Math.abs(info.offset.x) > threshold) {
      const newDirection = info.offset.x > 0 ? 'right' : 'left';
      setDirection(newDirection);
    } else {
      // If swipe wasn't far enough, animate back to center
      controls.start({
        x: 0,
        opacity: 1,
        transition: { type: 'spring', stiffness: 300, damping: 20 }
      });
    }
  };
  
  // No cards to display
  if (allItems.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-xl text-gray-400">Aucun fait à afficher</p>
      </div>
    );
  }

  const currentItem: CardItem = allItems[currentIndex];
  
  return (
    <div className="relative w-full h-full" ref={constraintsRef}>
      <motion.div
        drag="x"
        dragConstraints={constraintsRef}
        onDragEnd={handleDragEnd}
        animate={controls}
        className="absolute w-full h-full cursor-grab active:cursor-grabbing"
        whileTap={{ scale: 0.98 }}
        initial={{ scale: 1, opacity: 1 }} // Changed from { scale: 0.95, opacity: 0 }
        animate={{ scale: 1, opacity: 1 }} // Added explicit animate
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {isAd(currentItem) ? (
          <AdCard />
        ) : (
          <FactCard
            fact={currentItem}
            onClick={() => onClick(currentItem)}
            renderActions={renderActions ? () => renderActions(currentItem) : undefined}
          />
        )}
      </motion.div>
      
      {/* Card swipe indicators */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center space-x-2 pointer-events-none">
        <div className={`h-1 w-8 rounded-full transition-colors duration-300 ${direction === 'left' ? 'bg-red-500' : 'bg-gray-400/30'}`}></div>
        <div className={`h-1 w-8 rounded-full transition-colors duration-300 ${direction === 'right' ? 'bg-green-500' : 'bg-gray-400/30'}`}></div>
      </div>
    </div>
  );
};

export type { CardItem };
export default SwipeableCards;