import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { Language, Translation } from '../services/translation';
import { useTranslation } from 'react-i18next';
import { db } from '../lib/firebase';

export interface Fact {
  id: string;
  title: string;
  content: string;
  preview?: string;
  source: string;
  imageUrl?: string;
  category: string;
  wtfScore: number;
  contestedTheory: string;
  status: 'pending' | 'approved' | 'rejected';
  translations?: Partial<Record<Language, Translation>>;
  approvedAt?: Date;
}

interface FactContextType {
  facts: Fact[];
  loading: boolean;
  getFact: (id: string) => Fact | null;
  getLocalizedFact: (fact: Fact) => {
    title: string;
    content: string;
    contestedTheory: string;
  };
}

const FactContext = createContext<FactContextType | undefined>(undefined);

export const useFacts = () => {
  const context = useContext(FactContext);
  if (context === undefined) {
    throw new Error('useFacts must be used within a FactProvider');
  }
  return context;
};

export const FactProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [facts, setFacts] = useState<Fact[]>([]);
  const [loading, setLoading] = useState(true);
  const { i18n } = useTranslation();

  const getLocalizedFact = (fact: Fact) => {
    const currentLanguage = i18n.language.split('-')[0] as Language;
    
    // If the fact has translations and the current language is not French
    if (fact.translations && currentLanguage !== 'fr') {
      const translation = fact.translations[currentLanguage];
      if (translation) {
        return {
          title: translation.title,
          content: translation.content,
          contestedTheory: translation.contestedTheory
        };
      }
    }

    // Default to French content if no translation is available
    return {
      title: fact.title,
      content: fact.content,
      contestedTheory: fact.contestedTheory
    };
  };
  
  useEffect(() => {
    console.log('Initializing FactContext subscription...');
    const factsRef = collection(db, 'facts');
    const approvedFactsQuery = query(
      factsRef,
      where('status', '==', 'approved'),
      orderBy('approvedAt', 'desc')
    );

    const unsubscribe = onSnapshot(approvedFactsQuery, (snapshot) => {
      console.log('Received Firestore update with', snapshot.size, 'documents');
      const factsData: Fact[] = [];
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        factsData.push({
          id: doc.id,
          ...data,
          approvedAt: data.approvedAt?.toDate()
        } as Fact);
      });
      
      setFacts(factsData);
      setLoading(false);
    }, (error) => {
      console.error('Error in Firestore subscription:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  
  const getFact = (id: string) => {
    return facts.find(fact => fact.id === id) || null;
  };
  
  return (
    <FactContext.Provider value={{
      facts,
      loading,
      getFact,
      getLocalizedFact
    }}>
      {children}
    </FactContext.Provider>
  );
};