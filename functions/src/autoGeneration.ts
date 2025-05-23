import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { generateFact } from '../../src/services/factGeneration';
import { translateFact } from '../../src/services/translation';

admin.initializeApp();

export const generateScheduledFacts = functions.pubsub
  .schedule('every 1 hours')
  .onRun(async (context) => {
    const db = admin.firestore();
    
    try {
      // Récupérer toutes les configurations actives
      const configsSnapshot = await db.collection('auto_generation_config')
        .where('enabled', '==', true)
        .get();

      for (const configDoc of configsSnapshot.docs) {
        const config = configDoc.data();
        
        // Vérifier si c'est le moment de générer pour cette configuration
        const lastGeneration = config.lastGeneration?.toDate() || new Date(0);
        const now = new Date();
        const hoursSinceLastGen = (now.getTime() - lastGeneration.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastGen < config.minInterval) {
          continue;
        }

        // Générer un fait
        const fact = await generateFact(`Generate a scientific fact in the category: ${config.category}`);
        if (!fact) continue;

        // Générer les traductions
        const translations = {};
        for (const lang of config.languages) {
          if (lang === 'fr') continue; // Skip French as it's the original
          const translation = await translateFact({
            title: fact.title,
            content: fact.content,
            contestedTheory: fact.contestedTheory
          }, lang);
          if (translation) {
            translations[lang] = translation;
          }
        }

        // Sauvegarder le fait
        await db.collection('facts').add({
          ...fact,
          translations,
          status: config.autoApprove ? 'approved' : 'pending',
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          approvedAt: config.autoApprove ? admin.firestore.FieldValue.serverTimestamp() : null
        });

        // Mettre à jour la date de dernière génération
        await configDoc.ref.update({
          lastGeneration: admin.firestore.FieldValue.serverTimestamp(),
          nextGeneration: new Date(now.getTime() + (Math.random() * (config.maxInterval - config.minInterval) + config.minInterval) * 60 * 60 * 1000)
        });
      }

      return null;
    } catch (error) {
      console.error('Error in generateScheduledFacts:', error);
      return null;
    }
  });