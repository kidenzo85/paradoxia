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

async function isDuplicate(fact: GeneratedFact): Promise<boolean> {
  try {
    const factsRef = collection(db, 'facts');
    
    const titleQuery = query(factsRef, where('title', '==', fact.title));
    const titleDocs = await getDocs(titleQuery);
    if (!titleDocs.empty) return true;

    const contentQuery = query(factsRef);
    const contentDocs = await getDocs(contentQuery);
    
    for (const doc of contentDocs.docs) {
      const existingFact = doc.data();
      const similarity = calculateSimilarity(fact.content, existingFact.content);
      if (similarity > 0.8) {
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking for duplicates:', error);
    return false;
  }
}

function calculateSimilarity(text1: string, text2: string): number {
  const longer = text1.length > text2.length ? text1 : text2;
  const shorter = text1.length > text2.length ? text2 : text1;
  
  if (longer.length === 0) return 1.0;
  
  const costs = new Array();
  for (let i = 0; i <= longer.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= shorter.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (longer.charAt(i - 1) !== shorter.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[shorter.length] = lastValue;
  }
  
  return (longer.length - costs[shorter.length]) / longer.length;
}

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

async function makeApiRequest(prompt: string, apiKey: string): Promise<Response> {
  const systemPrompt = `You are a scientific fact generator. Generate a fact that meets these requirements:

1. Based on peer-reviewed research with verifiable sources
2. Counter-intuitive or challenges common beliefs
3. Includes statistical evidence or measurable data
4. Format as valid JSON with these EXACT fields:
   {
     "title": "Brief, attention-grabbing title",
     "content": "Detailed explanation with evidence",
     "source": "Academic source with year",
     "category": "Scientific domain",
     "wtfScore": number between 1-10,
     "contestedTheory": "Main opposing theory"
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
      temperature: 0.7,
      max_tokens: 1000,
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
  if (typeof data.title !== 'string' || data.title.trim().length === 0) {
    console.error('Invalid title:', data.title);
    return false;
  }

  if (typeof data.content !== 'string' || data.content.trim().length === 0) {
    console.error('Invalid content:', data.content);
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
          `num=1`
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
          `q=${encodeURIComponent(fact.title)}&` +
          `type=video&` +
          `maxResults=1`
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