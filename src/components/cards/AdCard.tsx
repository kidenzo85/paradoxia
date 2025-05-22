import React from 'react';
import { motion } from 'framer-motion';

const AdCard: React.FC = () => {
  return (
    <motion.div 
      className="w-full h-full rounded-xl overflow-hidden relative shadow-xl bg-gradient-to-b from-gray-900 to-black border border-gray-700"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="mb-2 text-xs text-gray-400 uppercase tracking-wider">Publicité</div>
          <div className="h-[400px] w-full flex items-center justify-center bg-gray-800/50 rounded-lg">
            <span className="text-gray-400">Espace publicitaire</span>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            Les publicités nous aident à maintenir ce service gratuit
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default AdCard;