import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, MousePointerClick, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface OnboardingGuideProps {
  onComplete: () => void;
}

const OnboardingGuide: React.FC<OnboardingGuideProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const { t } = useTranslation();
  
  const steps = [
    {
      icon: ArrowLeftRight,
      title: t('onboarding.swipe.title', 'Swipez pour découvrir'),
      description: t('onboarding.swipe.description', 'Faites glisser vers la gauche ou la droite pour explorer de nouveaux faits'),
      animation: {
        x: [0, 20, 0],
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }
    },
    {
      icon: MousePointerClick,
      title: t('onboarding.tap.title', 'Cliquez pour plus de détails'),
      description: t('onboarding.tap.description', 'Appuyez sur un fait pour découvrir son histoire complète'),
      animation: {
        scale: [1, 0.9, 1],
        transition: {
          duration: 1.5,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }
    },
    {
      icon: Share2,
      title: t('onboarding.share.title', 'Partagez vos découvertes'),
      description: t('onboarding.share.description', 'Partagez les faits les plus intéressants avec vos amis'),
      animation: {
        rotate: [0, 15, -15, 0],
        transition: {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }
      }
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        onComplete();
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [currentStep, steps.length, onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="max-w-sm mx-auto p-6 text-center"
        >
          <motion.div
            className="mb-8 flex justify-center"
            {...steps[currentStep].animation}
          >
            {React.createElement(steps[currentStep].icon, {
              size: 48,
              className: "text-purple-400"
            })}
          </motion.div>
          
          <h3 className="text-2xl font-bold text-white mb-3">
            {steps[currentStep].title}
          </h3>
          <p className="text-gray-300 mb-6">
            {steps[currentStep].description}
          </p>
          
          <div className="flex justify-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index === currentStep 
                    ? 'bg-purple-500' 
                    : 'bg-gray-600'
                }`}
              />
            ))}
          </div>
          
          <button
            onClick={onComplete}
            className="mt-8 text-sm text-gray-400 hover:text-white transition-colors"
          >
            {t('onboarding.skip', 'Passer')}
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default OnboardingGuide;