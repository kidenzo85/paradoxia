import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Check } from 'lucide-react';

interface RealityChallengeProps {
  onClose: () => void;
}

const RealityChallenge: React.FC<RealityChallengeProps> = ({ onClose }) => {
  const [fact, setFact] = useState({
    title: "Les cafards peuvent survivre jusqu'à un mois sans tête",
    content: "Selon des études de l'Université de Berkeley, les cafards peuvent continuer à vivre jusqu'à 30 jours après avoir été décapités. Cela est dû au fait que leur système respiratoire fonctionne différemment du nôtre et qu'ils peuvent contrôler leur perte de sang.",
    isReal: true,
  });
  
  const [userGuess, setUserGuess] = useState<boolean | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  
  const handleGuess = (guess: boolean) => {
    setUserGuess(guess);
    setShowResult(true);
    
    // Update score
    if (guess === fact.isReal) {
      setScore(prev => prev + 1);
    }
  };
  
  const handleNext = () => {
    setUserGuess(null);
    setShowResult(false);
    onClose();
  };

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div 
        className="w-full max-w-lg bg-gradient-to-b from-indigo-950 to-black border border-purple-900/30 rounded-xl overflow-hidden shadow-xl"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Défi de Réalité</h2>
            <div className="bg-purple-900/50 backdrop-blur-sm px-3 py-1 rounded-full text-purple-300 text-sm">
              Score: {score}
            </div>
          </div>
          
          <p className="text-gray-300 mb-6">
            Ce fait est-il réel ou généré par l'IA? Faites votre choix!
          </p>
          
          <div className="bg-gray-900/50 backdrop-blur-sm rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-white mb-3">{fact.title}</h3>
            <p className="text-gray-300">{fact.content}</p>
          </div>
          
          {!showResult ? (
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={() => handleGuess(true)}
                className="flex-1 py-3 bg-green-700 hover:bg-green-600 text-white rounded-lg transition-colors"
              >
                C'est réel
              </button>
              <button
                onClick={() => handleGuess(false)}
                className="flex-1 py-3 bg-red-700 hover:bg-red-600 text-white rounded-lg transition-colors"
              >
                C'est fake
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className={`p-4 rounded-lg ${userGuess === fact.isReal ? 'bg-green-900/30 border border-green-500/50' : 'bg-red-900/30 border border-red-500/50'}`}>
                <div className="flex items-center gap-3 mb-2">
                  {userGuess === fact.isReal ? (
                    <>
                      <div className="bg-green-500 rounded-full p-1">
                        <Check size={16} />
                      </div>
                      <p className="font-medium text-green-300">Bonne réponse!</p>
                    </>
                  ) : (
                    <>
                      <div className="bg-red-500 rounded-full p-1">
                        <X size={16} />
                      </div>
                      <p className="font-medium text-red-300">Mauvaise réponse!</p>
                    </>
                  )}
                </div>
                <p className="text-gray-300">
                  {fact.isReal 
                    ? "Ce fait est bien réel et vérifié scientifiquement." 
                    : "Ce fait a été généré par l'IA et n'est pas vérifiable scientifiquement."}
                </p>
              </div>
              
              <button
                onClick={handleNext}
                className="w-full py-3 bg-purple-700 hover:bg-purple-600 text-white rounded-lg transition-colors"
              >
                Continuer
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default RealityChallenge;