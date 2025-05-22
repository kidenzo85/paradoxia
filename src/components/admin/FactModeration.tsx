import React, { useState, useEffect } from 'react';
import { Check, X, Edit2, ExternalLink, Globe } from 'lucide-react';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  updateDoc,
  doc,
  serverTimestamp
} from 'firebase/firestore';
import { Language, Translation } from '../../services/translation';
import { db } from '../../lib/firebase';

interface Fact {
  id: string;
  title: string;
  content: string;
  source: string;
  imageUrl?: string;
  category: string;
  wtfScore: number;
  status: 'pending' | 'approved' | 'rejected';
  translations?: Record<Language, Translation>;
  contestedTheory: string;
}

const FactModeration: React.FC = () => {
  const [facts, setFacts] = useState<Fact[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedFact, setSelectedFact] = useState<Fact | null>(null);
  const [editedContent, setEditedContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [previewLanguage, setPreviewLanguage] = useState<Language>('fr');
  const [editingTranslation, setEditingTranslation] = useState<Language | null>(null);
  const [editedTranslation, setEditedTranslation] = useState<Translation | null>(null);

  const languages: { code: Language; name: string }[] = [
    { code: 'fr', name: 'Français' },
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文' }
  ];
  
  useEffect(() => {
    const factsRef = collection(db, 'facts');
    const q = query(factsRef, orderBy('createdAt', 'desc'));
    
    console.log('Subscribing to facts collection with query:', {
      orderBy: 'createdAt',
      direction: 'desc'
    });
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Received facts snapshot with', snapshot.size, 'documents');
      const factsData: Fact[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Processing fact:', {
          id: doc.id,
          status: data.status,
          hasApprovedAt: !!data.approvedAt,
          hasCreatedAt: !!data.createdAt
        });
        factsData.push({ id: doc.id, ...data } as Fact);
      });
      setFacts(factsData);
      setIsLoading(false);
    }, (error) => {
      console.error('Error in facts subscription:', {
        error: error.message,
        code: error.code,
        stack: error.stack
      });
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const handleApprove = async (id: string) => {
    try {
      const factRef = doc(db, 'facts', id);
      const now = new Date();
      const updateData = {
        status: 'approved',
        approvedAt: serverTimestamp(),
        approvedAtClient: now.toISOString(),
        lastModified: serverTimestamp()
      };
      
      console.log('Approving fact with data:', {
        id,
        status: 'approved',
        approvedAt: 'serverTimestamp',
        approvedAtClient: now.toISOString()
      });
      
      const beforeUpdate = new Date().toISOString();
      await updateDoc(factRef, updateData);
      const afterUpdate = new Date().toISOString();
      
      console.log('Fact approved successfully:', {
        id,
        beforeUpdate,
        afterUpdate,
        updateDurationMs: new Date(afterUpdate).getTime() - new Date(beforeUpdate).getTime()
      });
    } catch (error) {
      console.error('Error approving fact:', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        id
      });
    }
  };
  
  const handleReject = async (id: string) => {
    try {
      const factRef = doc(db, 'facts', id);
      await updateDoc(factRef, { status: 'rejected' });
    } catch (error) {
      console.error('Error rejecting fact:', error);
    }
  };
  
  const handleEdit = (fact: Fact, language?: Language) => {
    setSelectedFact(fact);
    if (language) {
      setEditingTranslation(language);
      setEditedTranslation(fact.translations?.[language] || null);
    } else {
      setEditedContent(fact.content);
    }
  };
  
  const saveEdit = async () => {
    if (!selectedFact) return;
    
    try {
      const factRef = doc(db, 'facts', selectedFact.id);
      if (editingTranslation && editedTranslation) {
        await updateDoc(factRef, {
          [`translations.${editingTranslation}`]: editedTranslation
        });
        setEditingTranslation(null);
        setEditedTranslation(null);
      } else {
        await updateDoc(factRef, { content: editedContent });
      }
      setSelectedFact(null);
    } catch (error) {
      console.error('Error updating fact:', error);
    }
  };

  const getTranslatedContent = (fact: Fact) => {
    if (previewLanguage === 'fr' || !fact.translations?.[previewLanguage]) {
      return {
        title: fact.title,
        content: fact.content,
        contestedTheory: fact.contestedTheory
      };
    }
    return fact.translations[previewLanguage];
  };
  
  const filteredFacts = facts.filter(fact => {
    if (filter === 'all') return true;
    return fact.status === filter;
  });
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-900/20 text-green-400 border-green-700';
      case 'rejected': return 'bg-red-900/20 text-red-400 border-red-700';
      default: return 'bg-yellow-900/20 text-yellow-400 border-yellow-700';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-6">Modération des Faits</h2>
      
      {/* Filters */}
      <div className="flex mb-6 border-b border-gray-700 pb-4">
        <button 
          onClick={() => setFilter('pending')}
          className={`px-4 py-2 rounded-lg mr-2 ${
            filter === 'pending' 
              ? 'bg-yellow-900/20 text-yellow-400 border border-yellow-700' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          En attente ({facts.filter(f => f.status === 'pending').length})
        </button>
        <button 
          onClick={() => setFilter('approved')}
          className={`px-4 py-2 rounded-lg mr-2 ${
            filter === 'approved' 
              ? 'bg-green-900/20 text-green-400 border border-green-700' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Approuvés ({facts.filter(f => f.status === 'approved').length})
        </button>
        <button 
          onClick={() => setFilter('rejected')}
          className={`px-4 py-2 rounded-lg mr-2 ${
            filter === 'rejected' 
              ? 'bg-red-900/20 text-red-400 border border-red-700' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Rejetés ({facts.filter(f => f.status === 'rejected').length})
        </button>
        <button 
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg ${
            filter === 'all' 
              ? 'bg-purple-900/20 text-purple-400 border border-purple-700' 
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Tous ({facts.length})
        </button>
      </div>
      
      {/* Fact list */}
      <div className="space-y-4">
        {filteredFacts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            Aucun fait à modérer dans cette catégorie
          </div>
        ) : (
          filteredFacts.map((fact) => (
            <div 
              key={fact.id} 
              className="bg-gray-800/40 rounded-lg p-6 border border-gray-700"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-medium text-white">
                      {getTranslatedContent(fact).title}
                    </h3>
                    <div className="flex items-center gap-2">
                      <Globe size={16} className="text-gray-400" />
                      <select
                        value={previewLanguage}
                        onChange={(e) => setPreviewLanguage(e.target.value as Language)}
                        className="bg-gray-700 text-sm text-gray-200 rounded px-2 py-1 border border-gray-600"
                      >
                        {languages.map((lang) => (
                          <option key={lang.code} value={lang.code}>
                            {lang.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-center mt-1">
                    <span className="bg-purple-900/50 text-xs px-2 py-1 rounded text-purple-300 mr-3">
                      {fact.category}
                    </span>
                    <span className="text-xs text-gray-400">
                      Source: {fact.source}
                    </span>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs ${getStatusColor(fact.status)}`}>
                  {fact.status === 'pending' && 'En attente'}
                  {fact.status === 'approved' && 'Approuvé'}
                  {fact.status === 'rejected' && 'Rejeté'}
                </div>
              </div>
              
              {selectedFact?.id === fact.id ? (
                <div className="mb-4">
                  {editingTranslation ? (
                    <>
                      <div className="space-y-4 mb-4">
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Titre</label>
                          <input
                            type="text"
                            value={editedTranslation?.title || ''}
                            onChange={(e) => setEditedTranslation(prev => ({
                              ...(prev || { content: '', contestedTheory: '' }),
                              title: e.target.value
                            }))}
                            className="w-full px-4 py-2 text-gray-200 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Contenu</label>
                          <textarea
                            value={editedTranslation?.content || ''}
                            onChange={(e) => setEditedTranslation(prev => ({
                              ...(prev || { title: '', contestedTheory: '' }),
                              content: e.target.value
                            }))}
                            className="w-full px-4 py-3 text-gray-200 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            rows={5}
                          ></textarea>
                        </div>
                        <div>
                          <label className="block text-sm text-gray-400 mb-1">Théorie contestée</label>
                          <textarea
                            value={editedTranslation?.contestedTheory || ''}
                            onChange={(e) => setEditedTranslation(prev => ({
                              ...(prev || { title: '', content: '' }),
                              contestedTheory: e.target.value
                            }))}
                            className="w-full px-4 py-3 text-gray-200 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            rows={3}
                          ></textarea>
                        </div>
                      </div>
                    </>
                  ) : (
                    <textarea
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      className="w-full px-4 py-3 text-gray-200 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                      rows={5}
                    ></textarea>
                  )}
                  <div className="flex justify-between mt-2">
                    <div className="flex gap-2">
                      {languages.map((lang) => (
                        <button
                          key={lang.code}
                          onClick={() => handleEdit(fact, lang.code)}
                          className={`px-3 py-1 rounded ${
                            editingTranslation === lang.code
                              ? 'bg-purple-700 text-white'
                              : 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                          }`}
                        >
                          {lang.name}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedFact(null);
                          setEditingTranslation(null);
                          setEditedTranslation(null);
                        }}
                        className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={saveEdit}
                        className="px-3 py-1 bg-purple-700 hover:bg-purple-600 text-white rounded"
                      >
                        Enregistrer
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 mb-4">
                  <p className="text-gray-300">{getTranslatedContent(fact).content}</p>
                  <div className="border-t border-gray-700 pt-4">
                    <h4 className="text-sm font-medium text-gray-400 mb-2">Théorie contestée</h4>
                    <p className="text-gray-300">{getTranslatedContent(fact).contestedTheory}</p>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-500 text-white font-bold px-3 py-1 rounded-full flex items-center">
                    <span className="mr-1 text-xs uppercase">WTF</span>
                    <span>{fact.wtfScore}</span>
                  </div>
                  
                  <button className="ml-4 text-blue-400 hover:text-blue-300 flex items-center">
                    <ExternalLink size={16} className="mr-1" />
                    <span className="text-sm">Vérifier sources</span>
                  </button>
                </div>
                
                {fact.status === 'pending' && (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEdit(fact)}
                      className="p-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleReject(fact.id)}
                      className="p-2 bg-red-700 hover:bg-red-600 text-white rounded"
                    >
                      <X size={18} />
                    </button>
                    <button
                      onClick={() => handleApprove(fact.id)}
                      className="p-2 bg-green-700 hover:bg-green-600 text-white rounded"
                    >
                      <Check size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default FactModeration;