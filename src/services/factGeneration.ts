import { getFirestore, collection, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { Fact } from '../context/FactContext';
import { Language, Translation } from './translation';

export interface GeneratedFact extends Omit<Fact, 'id' | 'status' | 'approvedAt'> {
  translations?: Record<Language, Translation>;
}

const db = getFirestore();

async function getApiKey(keyId: string): Promise<string | null> {
  try {
    const apiKeyDoc = await getDoc(doc(db, 'api_keys', keyId));
    if (apiKeyDoc.exists()) {
      return apiKeyDoc.data().key;
    }
    return null;
  } catch (error) {
    console.error(`Error fetching ${keyId} API key:`, error);
    return null;
  }
}

// Fonction améliorée de détection de doublons
async function isDuplicate(fact: GeneratedFact): Promise<boolean> {
  try {
    console.log('Checking for duplicates...');
    const factsRef = collection(db, 'facts');
    
    // Vérification exacte du titre
    const titleQuery = query(factsRef, where('title', '==', fact.title));
    const titleDocs = await getDocs(titleQuery);
    if (!titleDocs.empty) {
      console.log('Duplicate found: exact title match');
      return true;
    }

    // Vérification de similarité du contenu
    const allFactsQuery = query(factsRef);
    const allFactsDocs = await getDocs(allFactsQuery);
    
    for (const docSnapshot of allFactsDocs.docs) {
      const existingFact = docSnapshot.data();
      
      // Similarité du titre
      const titleSimilarity = calculateSimilarity(
        fact.title.toLowerCase(), 
        existingFact.title.toLowerCase()
      );
      
      // Similarité du contenu
      const contentSimilarity = calculateSimilarity(
        fact.content.toLowerCase(), 
        existingFact.content.toLowerCase()
      );
      
      // Si le titre est très similaire (>85%) ou le contenu est très similaire (>80%)
      if (titleSimilarity > 0.85 || contentSimilarity > 0.80) {
        console.log(`Duplicate found: title similarity ${titleSimilarity}, content similarity ${contentSimilarity}`);
        return true;
      }
      
      // Vérification des mots-clés communs
      const factKeywords = extractKeywords(fact.title + ' ' + fact.content);
      const existingKeywords = extractKeywords(existingFact.title + ' ' + existingFact.content);
      const keywordOverlap = calculateKeywordOverlap(factKeywords, existingKeywords);
      
      if (keywordOverlap > 0.7) {
        console.log(`Duplicate found: keyword overlap ${keywordOverlap}`);
        return true;
      }
    }

    console.log('No duplicates found');
    return false;
  } catch (error) {
    console.error('Error checking for duplicates:', error);
    return false;
  }
}

// Fonction améliorée de calcul de similarité (Levenshtein distance)
function calculateSimilarity(text1: string, text2: string): number {
  if (text1 === text2) return 1.0;
  
  const longer = text1.length > text2.length ? text1 : text2;
  const shorter = text1.length > text2.length ? text2 : text1;
  
  if (longer.length === 0) return 1.0;
  
  const costs = new Array(shorter.length + 1);
  for (let i = 0; i <= shorter.length; i++) {
    costs[i] = i;
  }
  
  for (let i = 1; i <= longer.length; i++) {
    costs[0] = i;
    let nw = i - 1;
    for (let j = 1; j <= shorter.length; j++) {
      const cj = Math.min(
        1 + Math.min(costs[j], costs[j - 1]),
        longer.charAt(i - 1) === shorter.charAt(j - 1) ? nw : nw + 1
      );
      nw = costs[j];
      costs[j] = cj;
    }
  }
  
  return (longer.length - costs[shorter.length]) / longer.length;
}

// Extraction de mots-clés
function extractKeywords(text: string): string[] {
  const stopWords = new Set([
    'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'ou', 'mais', 'donc', 'car',
    'que', 'qui', 'quoi', 'dont', 'où', 'ce', 'cette', 'ces', 'son', 'sa', 'ses',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'
  ]);
  
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(word => word.length > 3 && !stopWords.has(word))
    .slice(0, 10); // Garder les 10 premiers mots-clés
}

// Calcul du chevauchement de mots-clés
function calculateKeywordOverlap(keywords1: string[], keywords2: string[]): number {
  if (keywords1.length === 0 || keywords2.length === 0) return 0;
  
  const set1 = new Set(keywords1);
  const set2 = new Set(keywords2);
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  
  return intersection.size / Math.min(set1.size, set2.size);
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function makeApiRequest(prompt: string, apiKey: string): Promise<Response> {
  const systemPrompt = `You are a scientific fact generator. Generate a fact that meets these requirements:

1. Based on peer-reviewed research with verifiable sources
2. Counter-intuitive or challenges common beliefs
3. Includes statistical evidence or measurable data
4. Must be unique and not commonly known
5. Format as valid JSON with these EXACT fields:
   {
     "title": "Brief, attention-grabbing title (max 100 characters)",
     "content": "Detailed explanation with evidence (200-400 words)",
     "source": "Academic source with year (e.g., 'University of X, 2023')",
     "category": "Scientific domain",
     "wtfScore": number between 1-10,
     "contestedTheory": "Main opposing theory or controversy"
   }

CRITICAL: Output MUST be valid JSON only, no other text.`;

  return fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.8, // Augmenté pour plus de variété
      max_tokens: 1200,
      response_format: { type: "json_object" }
    })
  });
}

function cleanApiResponse(text: string): string {
  // Remove any markdown code blocks
  text = text.replace(/```(?:json)?\n?([\s\S]*?)\n?```/g, '$1');
  
  // Remove any text before the first {
  text = text.replace(/^[^{]*/, '');
  
  // Remove any text after the last }
  text = text.replace(/[^}]*$/, '');
  
  // Remove any remaining markdown formatting
  text = text.replace(/\*\*/g, '');
  
  return text.trim();
}

function validateFactData(data: any): data is GeneratedFact {
  const requiredFields = ['title', 'content', 'source', 'category', 'wtfScore', 'contestedTheory'];
  
  // Check for missing fields
  const missingFields = requiredFields.filter(field => !(field in data));
  if (missingFields.length > 0) {
    console.error('Missing required fields:', {
      missingFields,
      receivedData: data
    });
    return false;
  }

  // Validate field types and content
  if (typeof data.title !== 'string' || data.title.trim().length === 0 || data.title.length > 150) {
    console.error('Invalid title:', data.title);
    return false;
  }

  if (typeof data.content !== 'string' || data.content.trim().length < 100 || data.content.length > 1000) {
    console.error('Invalid content length:', data.content?.length);
    return false;
  }

  if (typeof data.source !== 'string' || data.source.trim().length === 0) {
    console.error('Invalid source:', data.source);
    return false;
  }

  if (typeof data.category !== 'string' || data.category.trim().length === 0) {
    console.error('Invalid category:', data.category);
    return false;
  }

  if (typeof data.wtfScore !== 'number' || data.wtfScore < 1 || data.wtfScore > 10) {
    console.error('Invalid wtfScore:', data.wtfScore);
    return false;
  }

  if (typeof data.contestedTheory !== 'string' || data.contestedTheory.trim().length === 0) {
    console.error('Invalid contestedTheory:', data.contestedTheory);
    return false;
  }

  return true;
}

export async function generateFact(prompt: string): Promise<GeneratedFact | null> {
  const apiKey = await getApiKey('deepseek');
  if (!apiKey) {
    throw new Error('DeepSeek API key not configured');
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Generating fact (attempt ${attempt}/${MAX_RETRIES})`);
      
      const response = await makeApiRequest(prompt, apiKey);
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`API request failed (${response.status}): ${errorText}`);
      }

      const rawResponse = await response.text();
      console.log('Raw API response:', rawResponse);

      let factData: any;
      try {
        // Try parsing the raw response first
        factData = JSON.parse(rawResponse);
        
        // If the response is wrapped in a completion object, extract the content
        if (factData.choices?.[0]?.message?.content) {
          const content = factData.choices[0].message.content;
          factData = typeof content === 'string' ? JSON.parse(content) : content;
        }
      } catch (e) {
        // If direct parsing fails, try cleaning the response
        const cleaned = cleanApiResponse(rawResponse);
        console.log('Cleaned response:', cleaned);
        factData = JSON.parse(cleaned);
      }

      if (!validateFactData(factData)) {
        throw new Error('Invalid fact data structure');
      }

      // Check for duplicates
      if (await isDuplicate(factData)) {
        throw new Error('Generated fact is too similar to existing facts');
      }

      console.log('Successfully generated unique fact:', factData);
      return factData;
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < MAX_RETRIES) {
        const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError || new Error('Failed to generate fact after all attempts');
}

interface Media {
  imageUrl: string | null;
  videoUrl: string | null;
}

export async function findRelatedMedia(fact: GeneratedFact): Promise<Media> {
  let imageUrl: string | null = null;
  let videoUrl: string | null = null;

  try {
    const searchEngineId = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;
    const googleImagesApiKey = await getApiKey('google-images');
    const youtubeApiKey = await getApiKey('youtube');

    if (googleImagesApiKey && searchEngineId) {
      try {
        const imageResponse = await fetch(
          `https://customsearch.googleapis.com/customsearch/v1?` +
          `key=${googleImagesApiKey}&` +
          `cx=${searchEngineId}&` +
          `q=${encodeURIComponent(fact.title)}&` +
          `searchType=image&` +
          `num=1&` +
          `safe=active&` +
          `rights=cc_publicdomain,cc_attribute,cc_sharealike`
        );

        if (imageResponse.ok) {
          const imageData = await imageResponse.json();
          imageUrl = imageData.items?.[0]?.link || null;
        }
      } catch (error) {
        console.warn('Failed to fetch image:', error);
      }
    }

    if (youtubeApiKey) {
      try {
        const videoResponse = await fetch(
          `https://www.googleapis.com/youtube/v3/search?` +
          `key=${youtubeApiKey}&` +
          `part=snippet&` +
          `q=${encodeURIComponent(fact.title + ' science')}&` +
          `type=video&` +
          `maxResults=1&` +
          `safeSearch=strict&` +
          `relevanceLanguage=fr`
        );

        if (videoResponse.ok) {
          const videoData = await videoResponse.json();
          const videoId = videoData.items?.[0]?.id?.videoId;
          if (videoId) {
            videoUrl = `https://www.youtube.com/embed/${videoId}`;
          }
        }
      } catch (error) {
        console.warn('Failed to fetch video:', error);
      }
    }
  } catch (error) {
    console.error('Error in findRelatedMedia:', error);
  }

  return { imageUrl, videoUrl };
}