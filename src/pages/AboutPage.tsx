import React from 'react';
import { motion } from 'framer-motion';
import { Brain, FlaskRound as Flask, Users, Shield, MessageSquare, Sparkles } from 'lucide-react';

const AboutPage: React.FC = () => {
  const features = [
    {
      icon: Brain,
      title: 'Intelligence Artificielle',
      description: 'Utilisation de modèles IA avancés pour générer et vérifier des faits scientifiques'
    },
    {
      icon: Flask,
      title: 'Rigueur Scientifique',
      description: 'Vérification systématique des sources et des études scientifiques citées'
    },
    {
      icon: Users,
      title: 'Communauté Active',
      description: 'Une communauté passionnée qui participe à la validation des faits'
    },
    {
      icon: Shield,
      title: 'Modération Stricte',
      description: 'Processus de modération rigoureux pour garantir la qualité du contenu'
    },
    {
      icon: MessageSquare,
      title: 'Discussions Enrichissantes',
      description: 'Échanges constructifs autour des découvertes scientifiques'
    },
    {
      icon: Sparkles,
      title: 'Contenu Unique',
      description: 'Des faits scientifiques rares et contre-intuitifs soigneusement sélectionnés'
    }
  ];

  const teamMembers = [
    {
      name: 'Dr. Sarah Chen',
      role: 'Directrice Scientifique',
      image: 'https://images.pexels.com/photos/3714743/pexels-photo-3714743.jpeg',
      description: 'Docteure en physique quantique, passionnée par les paradoxes scientifiques'
    },
    {
      name: 'Marc Dubois',
      role: 'Responsable Éditorial',
      image: 'https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg',
      description: 'Journaliste scientifique avec 15 ans d\'expérience dans la vulgarisation'
    },
    {
      name: 'Elena Rodriguez',
      role: 'Responsable IA',
      image: 'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg',
      description: 'Experte en IA et en traitement du langage naturel'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-indigo-950 pt-24 pb-12">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 mb-20">
        <div className="text-center">
          <motion.h1 
            className="text-4xl md:text-5xl font-bold text-white mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            À Propos de Savoirs Insolites
          </motion.h1>
          <motion.p 
            className="text-xl text-gray-300 max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Nous explorons les frontières de la science pour vous présenter les découvertes 
            les plus étonnantes et contre-intuitives, validées par la recherche académique.
          </motion.p>
        </div>
      </div>

      {/* Features Grid */}
      <div className="max-w-7xl mx-auto px-4 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                className="bg-gray-900/50 backdrop-blur-sm rounded-xl p-6 border border-purple-900/30"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <div className="w-12 h-12 bg-purple-900/50 rounded-lg flex items-center justify-center mb-4">
                  <Icon className="text-purple-400" size={24} />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Team Section */}
      <div className="max-w-7xl mx-auto px-4 mb-20">
        <h2 className="text-3xl font-bold text-white text-center mb-12">Notre Équipe</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => (
            <motion.div
              key={index}
              className="bg-gray-900/50 backdrop-blur-sm rounded-xl overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
            >
              <div className="h-48 relative">
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: `url(${member.image})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent"></div>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-white mb-1">{member.name}</h3>
                <p className="text-purple-400 text-sm mb-3">{member.role}</p>
                <p className="text-gray-400">{member.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 rounded-xl p-8 md:p-12 backdrop-blur-sm border border-purple-900/30">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-bold text-white mb-6">Notre Mission</h2>
            <p className="text-gray-300 mb-8">
              Savoirs Insolites a pour mission de démocratiser l'accès aux découvertes scientifiques 
              les plus fascinantes et contre-intuitives. Nous croyons que la science est remplie de 
              mystères qui méritent d'être explorés et partagés avec le plus grand nombre.
            </p>
            <a 
              href="/categories" 
              className="inline-block px-8 py-3 bg-purple-700 hover:bg-purple-600 text-white rounded-lg transition-colors"
            >
              Explorer les Catégories
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;