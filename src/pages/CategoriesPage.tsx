import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Brain, Atom, Database, Skull, Cog, Leaf, Pill, Users, Moon, Globe2, Ghost, Utensils, Heart, Search } from 'lucide-react';

const categories = [
  { id: 'bio', name: 'Biologie Interdite', icon: Brain, description: 'Découvertes biologiques qui défient notre compréhension du vivant', color: 'from-purple-500 to-pink-500', image: 'https://images.pexels.com/photos/356040/pexels-photo-356040.jpeg' },
  { id: 'phys', name: 'Physique Fantôme', icon: Atom, description: 'Phénomènes physiques inexpliqués et paradoxes quantiques', color: 'from-blue-500 to-cyan-500', image: 'https://images.pexels.com/photos/2150/sky-space-dark-galaxy.jpg' },
  { id: 'mem', name: 'Mémoire de la Matière', icon: Database, description: 'Études sur la conscience et la mémoire de la matière', color: 'from-green-500 to-emerald-500', image: 'https://images.pexels.com/photos/2832382/pexels-photo-2832382.jpeg' },
  { id: 'arch', name: 'Archéologie Interdite', icon: Skull, description: 'Découvertes archéologiques qui réécrivent l\'histoire', color: 'from-yellow-500 to-orange-500', image: 'https://images.pexels.com/photos/161936/pyramids-desert-egypt-sand-161936.jpeg' },
  { id: 'tech', name: 'Technologies Perdues', icon: Cog, description: 'Technologies anciennes inexplicablement avancées', color: 'from-red-500 to-rose-500', image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg' },
  { id: 'eco', name: 'Écologie Paradoxale', icon: Leaf, description: 'Comportements écologiques qui défient la logique', color: 'from-emerald-500 to-teal-500', image: 'https://images.pexels.com/photos/5486845/pexels-photo-5486845.jpeg' },
  { id: 'med', name: 'Médecine Extrême', icon: Pill, description: 'Cas médicaux inexpliqués et guérisons spontanées', color: 'from-cyan-500 to-blue-500', image: 'https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg' },
  { id: 'soc', name: 'Sociétés Cryptiques', icon: Users, description: 'Civilisations secrètes et sociétés oubliées', color: 'from-violet-500 to-purple-500', image: 'https://images.pexels.com/photos/699466/pexels-photo-699466.jpeg' },
  { id: 'dream', name: 'Rêves Prédateurs', icon: Moon, description: 'Études sur les rêves partagés et la conscience collective', color: 'from-indigo-500 to-violet-500', image: 'https://images.pexels.com/photos/3214944/pexels-photo-3214944.jpeg' },
  { id: 'geo', name: 'Géographie Maudite', icon: Globe2, description: 'Lieux inexpliqués et anomalies géographiques', color: 'from-teal-500 to-green-500', image: 'https://images.pexels.com/photos/831056/pexels-photo-831056.jpeg' },
  { id: 'ghost', name: 'Métiers Fantômes', icon: Ghost, description: 'Professions disparues mystérieusement', color: 'from-gray-500 to-slate-500', image: 'https://images.pexels.com/photos/5477883/pexels-photo-5477883.jpeg' },
  { id: 'food', name: 'Nourriture Alien', icon: Utensils, description: 'Aliments aux propriétés inexplicables', color: 'from-orange-500 to-red-500', image: 'https://images.pexels.com/photos/4040691/pexels-photo-4040691.jpeg' },
  { id: 'pleasure', name: 'Science Interdite du Plaisir', icon: Heart, description: 'Recherches censurées sur le plaisir et les émotions', color: 'from-pink-500 to-rose-500', image: 'https://images.pexels.com/photos/3758104/pexels-photo-3758104.jpeg' },
  { id: 'mystery', name: 'Mystères & Tabous Sociaux', icon: Search, description: 'Phénomènes sociaux inexpliqués', color: 'from-slate-500 to-gray-500', image: 'https://images.pexels.com/photos/6474915/pexels-photo-6474915.jpeg' }
];

const CategoriesPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-black to-indigo-950 pt-24 pb-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Catégories</h1>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Explorez notre collection de faits insolites classés par domaines. 
            Chaque catégorie ouvre une porte vers des découvertes scientifiques qui défient l'entendement.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const Icon = category.icon;
            return (
              <motion.div
                key={category.id}
                className="relative group cursor-pointer"
                whileHover={{ scale: 1.02 }}
                onClick={() => navigate(`/category/${category.id}`)}
              >
                <div className="absolute inset-0 bg-cover bg-center rounded-xl" 
                  style={{ backgroundImage: `url(${category.image})` }}>
                  <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-transparent rounded-xl"></div>
                </div>
                
                <div className="relative p-6 h-full flex flex-col">
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${category.color} flex items-center justify-center mb-4`}>
                    <Icon className="text-white" size={24} />
                  </div>
                  
                  <h3 className="text-xl font-bold text-white mb-2">{category.name}</h3>
                  <p className="text-gray-300 text-sm flex-grow">{category.description}</p>
                  
                  <div className="mt-4 flex items-center text-sm">
                    <span className="text-purple-400">Explorer</span>
                    <div className="ml-2 w-4 h-0.5 bg-purple-400 transform transition-all group-hover:w-6"></div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;