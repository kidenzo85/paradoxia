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
    const currentLanguage = i18n.language as Language;
    if (currentLanguage === 'fr' || !fact.translations || !fact.translations[currentLanguage]) {
      return {
        title: fact.title,
        content: fact.content,
        contestedTheory: fact.contestedTheory
      };
    }

    const translation = fact.translations[currentLanguage];
    return {
      title: translation.title,
      content: translation.content,
      contestedTheory: translation.contestedTheory
    };
  };
  
  useEffect(() => {
    console.log('Initializing FactContext subscription...');
    const factsRef = collection(db, 'facts');
    // Simplifier la requête pour récupérer tous les faits approuvés
    // Récupérer d'abord tous les faits pour debug
    const allFactsQuery = query(factsRef);
    
    console.log('Initializing debug query to check all facts...');
    
    const debugUnsubscribe = onSnapshot(allFactsQuery, (snapshot) => {
      console.log('DEBUG - All facts in collection:', snapshot.size);
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('DEBUG - Fact:', {
          id: doc.id,
          status: data.status,
          approvedAt: data.approvedAt?.toDate(),
          title: data.title
        });
      });
    });
    
    // Requête principale pour les faits approuvés
    const approvedFactsQuery = query(
      factsRef,
      where('status', '==', 'approved'),
      orderBy('approvedAt', 'desc')
    );

    console.log('Subscribing to approved facts with query:', {
      status: 'approved',
      orderBy: 'approvedAt'
    });

    const unsubscribe = onSnapshot(approvedFactsQuery, (snapshot) => {
      console.log('Received Firestore update with', snapshot.size, 'documents');
      const factsData: Fact[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Processing fact:', {
          id: doc.id,
          status: data.status,
          approvedAt: data.approvedAt,
          hasApprovedAt: !!data.approvedAt
        });
        
        if (!data.approvedAt) {
          console.warn('Fact missing approvedAt field:', doc.id);
        }

        factsData.push({
          id: doc.id,
          ...data,
          approvedAt: data.approvedAt?.toDate() // Convertir le timestamp en Date
        } as Fact);
      });
      console.log('Setting', factsData.length, 'approved facts with details:', {
        firstFact: factsData[0]?.id,
        lastFact: factsData[factsData.length - 1]?.id
      });
      setFacts(factsData);
      setLoading(false);
    }, (error) => {
      console.error('Error in Firestore subscription:', error, {
        errorCode: error.code,
        errorMessage: error.message
      });
      setLoading(false);
    });

    return () => {
      unsubscribe();
      debugUnsubscribe();
    };
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