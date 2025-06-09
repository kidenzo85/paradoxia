// Service d'optimisation pour réduire la consommation de ressources Firebase

import { 
  collection, 
  query, 
  limit, 
  startAfter, 
  orderBy, 
  where,
  getDocs,
  DocumentSnapshot,
  QueryConstraint
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Cache en mémoire pour réduire les requêtes répétées
const cache = new Map<string, { data: any; timestamp: number; ttl: number }>();

// TTL par défaut: 5 minutes
const DEFAULT_TTL = 5 * 60 * 1000;

export class FirebaseOptimizer {
  // Cache avec TTL
  static setCache(key: string, data: any, ttl: number = DEFAULT_TTL) {
    cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  static getCache(key: string): any | null {
    const cached = cache.get(key);
    if (!cached) return null;

    if (Date.now() - cached.timestamp > cached.ttl) {
      cache.delete(key);
      return null;
    }

    return cached.data;
  }

  // Pagination optimisée
  static async getPaginatedData(
    collectionName: string,
    pageSize: number = 10,
    lastDoc?: DocumentSnapshot,
    constraints: QueryConstraint[] = []
  ) {
    const cacheKey = `${collectionName}_${pageSize}_${lastDoc?.id || 'first'}_${JSON.stringify(constraints)}`;
    const cached = this.getCache(cacheKey);
    
    if (cached) {
      console.log('Cache hit for:', cacheKey);
      return cached;
    }

    const baseQuery = [
      ...constraints,
      limit(pageSize)
    ];

    if (lastDoc) {
      baseQuery.push(startAfter(lastDoc));
    }

    const q = query(collection(db, collectionName), ...baseQuery);
    const snapshot = await getDocs(q);
    
    const data = {
      docs: snapshot.docs,
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
      hasMore: snapshot.docs.length === pageSize
    };

    // Cache pour 2 minutes pour les données paginées
    this.setCache(cacheKey, data, 2 * 60 * 1000);
    
    return data;
  }

  // Requête optimisée avec cache
  static async getOptimizedQuery(
    collectionName: string,
    constraints: QueryConstraint[],
    cacheKey?: string,
    ttl?: number
  ) {
    const key = cacheKey || `${collectionName}_${JSON.stringify(constraints)}`;
    const cached = this.getCache(key);
    
    if (cached) {
      console.log('Cache hit for:', key);
      return cached;
    }

    const q = query(collection(db, collectionName), ...constraints);
    const snapshot = await getDocs(q);
    const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    this.setCache(key, data, ttl);
    
    return data;
  }

  // Nettoyage du cache
  static clearCache() {
    cache.clear();
  }

  // Nettoyage du cache expiré
  static cleanExpiredCache() {
    const now = Date.now();
    for (const [key, value] of cache.entries()) {
      if (now - value.timestamp > value.ttl) {
        cache.delete(key);
      }
    }
  }

  // Préchargement intelligent
  static async preloadData(collectionName: string, constraints: QueryConstraint[]) {
    const key = `preload_${collectionName}_${JSON.stringify(constraints)}`;
    
    // Ne précharger que si pas déjà en cache
    if (!this.getCache(key)) {
      try {
        await this.getOptimizedQuery(collectionName, constraints, key, 10 * 60 * 1000); // 10 minutes
        console.log('Preloaded data for:', key);
      } catch (error) {
        console.error('Preload failed for:', key, error);
      }
    }
  }

  // Batch operations pour réduire les requêtes
  static async batchGetDocuments(collectionName: string, ids: string[]) {
    const cacheKey = `batch_${collectionName}_${ids.sort().join(',')}`;
    const cached = this.getCache(cacheKey);
    
    if (cached) {
      return cached;
    }

    // Diviser en chunks de 10 (limite Firestore)
    const chunks = [];
    for (let i = 0; i < ids.length; i += 10) {
      chunks.push(ids.slice(i, i + 10));
    }

    const results = [];
    for (const chunk of chunks) {
      const q = query(
        collection(db, collectionName),
        where('__name__', 'in', chunk.map(id => `${collectionName}/${id}`))
      );
      const snapshot = await getDocs(q);
      results.push(...snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }

    this.setCache(cacheKey, results, 5 * 60 * 1000);
    return results;
  }
}

// Initialisation du nettoyage automatique du cache
setInterval(() => {
  FirebaseOptimizer.cleanExpiredCache();
}, 60 * 1000); // Toutes les minutes

export default FirebaseOptimizer;