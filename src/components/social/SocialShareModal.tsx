import React from 'react';
import { motion } from 'framer-motion';
import { X, Facebook, Twitter, Instagram, Linkedin, Copy, Mail } from 'lucide-react';

interface SocialShareModalProps {
  fact: any;
  onClose: () => void;
}

const SocialShareModal: React.FC<SocialShareModalProps> = ({ fact, onClose }) => {
  const shareUrl = window.location.href;
  const shareTitle = fact.title || 'Un fait insolite sur Savoirs Insolites';
  
  const shareOptions = [
    { 
      name: 'Facebook', 
      icon: <Facebook size={20} />, 
      color: 'bg-[#1877F2]',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    },
    { 
      name: 'Twitter', 
      icon: <Twitter size={20} />, 
      color: 'bg-[#1DA1F2]',
      url: `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`
    },
    { 
      name: 'LinkedIn', 
      icon: <Linkedin size={20} />, 
      color: 'bg-[#0077B5]',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`
    },
    { 
      name: 'Email', 
      icon: <Mail size={20} />, 
      color: 'bg-gray-600',
      url: `mailto:?subject=${encodeURIComponent(shareTitle)}&body=${encodeURIComponent('Découvre ce fait insolite: ' + shareUrl)}`
    },
  ];
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    // Show toast - would implement with a toast library in a real app
    alert('Lien copié!');
  };
  
  const handleShare = (option: typeof shareOptions[0]) => {
    window.open(option.url, '_blank');
  };

  return (
    <motion.div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div 
        className="w-full max-w-md bg-gray-900 border border-purple-900/30 rounded-xl p-6 shadow-xl"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Partager</h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
            aria-label="Fermer"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Fact preview */}
        <div className="mb-6 p-4 bg-black/40 rounded-lg border border-gray-800">
          <h4 className="font-medium text-gray-200 line-clamp-2">{shareTitle}</h4>
          <p className="text-sm text-gray-400 mt-1 line-clamp-2">
            {fact.preview || 'Découvrez ce fait scientifique insolite et inexplicable...'}
          </p>
        </div>
        
        {/* Social share buttons */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {shareOptions.map((option) => (
            <button
              key={option.name}
              onClick={() => handleShare(option)}
              className={`${option.color} hover:opacity-90 text-white rounded-lg flex flex-col items-center justify-center py-4`}
            >
              <span className="mb-1">{option.icon}</span>
              <span className="text-xs">{option.name}</span>
            </button>
          ))}
        </div>
        
        {/* Copy link button */}
        <button 
          onClick={copyToClipboard}
          className="w-full flex items-center justify-center gap-2 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
        >
          <Copy size={16} />
          <span>Copier le lien</span>
        </button>
      </motion.div>
    </motion.div>
  );
};

export default SocialShareModal;