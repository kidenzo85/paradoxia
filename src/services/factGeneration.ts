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

// Function to check for duplicate facts
async function isDuplicate(fact: GeneratedFact): Promise<boolean> {
  try {
    const factsRef = collection(db, 'facts');
    
    // Check for exact title match
    const titleQuery = query(factsRef, where('title', '==', fact.title));
    const titleDocs = await getDocs(titleQuery);
    if (!titleDocs.empty) return true;

    // Check for similar content using a similarity threshold
    const contentQuery = query(factsRef);
    const contentDocs = await getDocs(contentQuery);
    
    for (const doc of contentDocs.docs) {
      const existingFact = doc.data();
      const similarity = calculateSimilarity(fact.content, existingFact.content);
      if (similarity > 0.8) { // 80% similarity threshold
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('Error checking for duplicates:', error);
    return false;
  }
}

// Calculate text similarity using Levenshtein distance
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
  return fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{
        role: 'system',
        content: 'You are a scientific fact generator that MUST output ONLY raw JSON with NO markdown formatting, NO explanatory text, and NO prefix. Your response must be a single, valid JSON object matching this EXACT structure:\n\n' +
        '{\n' +
        '  "title": "string (concise fact title)",\n' +
        '  "content": "string (detailed description with evidence)",\n' +
        '  "source": "string (academic source with year)",\n' +
        '  "category": "string (scientific domain)",\n' +
        '  "wtfScore": number (1-10 strangeness rating),\n' +
        '  "contestedTheory": "string (opposing theory)"\n' +
        '}\n\n' +
        'IMPORTANT RULES:\n' +
        '1. Output MUST be valid JSON parsable by JSON.parse()\n' +
        '2. NO markdown formatting (no ```json, no **)\n' +
        '3. NO explanatory text before/after the JSON\n' +
        '4. NO array - only a single JSON object\n' +
        '5. ALL fields must be present and non-empty\n' +
        '6. wtfScore must be a number between 1-10\n\n' +
        'Failure to follow these rules will break the system. Generate real but counterintuitive facts based on peer-reviewed research.'
      }, {
        role: 'user',
        content: prompt || 'Generate a scientific fact that meets ALL these requirements:\n' +
        '1. Based on at least one peer-reviewed study (include DOI or citation)\n' +
        '2. Challenges common beliefs or seems counterintuitive\n' +
        '3. Includes:\n' +
        '   - Clear description of the phenomenon\n' +
        '   - Statistical evidence from the study\n' +
        '   - Complete academic source (author, year, journal)\n' +
        '   - Main contested theory or alternative explanation\n' +
        '4. Structured as JSON with these EXACT fields:\n' +
        '   - title: Concise fact title (string)\n' +
        '   - content: Detailed description with evidence (string)\n' +
        '   - source: Academic reference (string)\n' +
        '   - category: Scientific domain (string)\n' +
        '   - wtfScore: Strangeness rating 1-10 (number)\n' +
        '   - contestedTheory: Opposing view (string)\n\n' +
        'IMPORTANT: Output must be valid JSON with ALL fields present.'
      }]
    })
  });
}

function cleanApiResponse(text: string): string {
  // First try to extract JSON from common patterns
  const jsonMatch = text.match(/\{(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/);
  if (jsonMatch) {
    return jsonMatch[0];
  }

  // Fallback to removing all non-JSON content
  return text
    // Remove markdown code blocks
    .replace(/```(?:json)?\n?([\s\S]*?)\n?```/g, '$1')
    // Remove any text before first {
    .replace(/^[^{]*/, '')
    // Remove any text after last }
    .replace(/[^}]*$/, '')
    // Remove any remaining markdown formatting
    .replace(/\*\*Fact:\*\*\s*|\*\*/g, '')
    .replace(/^#+\s+.*$/gm, '')
    .trim();
}

function validateFactData(data: any): data is GeneratedFact {
  const requiredFields: Array<keyof GeneratedFact> = [
    'title',
    'content',
    'source',
    'category',
    'wtfScore',
    'contestedTheory'
  ];

  // Check all required fields exist
  const missingFields = requiredFields.filter(field => !(field in data));
  if (missingFields.length > 0) {
    console.error('Missing required fields:', missingFields);
    return false;
  }

  // Validate field types
  if (typeof data.title !== 'string' || data.title.trim().length === 0) {
    console.error('Invalid title: must be non-empty string');
    return false;
  }

  if (typeof data.content !== 'string' || data.content.trim().length === 0) {
    console.error('Invalid content: must be non-empty string');
    return false;
  }

  if (typeof data.source !== 'string' || data.source.trim().length === 0) {
    console.error('Invalid source: must be non-empty string');
    return false;
  }

  if (typeof data.category !== 'string' || data.category.trim().length === 0) {
    console.error('Invalid category: must be non-empty string');
    return false;
  }

  if (typeof data.wtfScore !== 'number' || data.wtfScore < 1 || data.wtfScore > 10) {
    console.error('Invalid wtfScore: must be number between 1-10');
    return false;
  }

  if (typeof data.contestedTheory !== 'string' || data.contestedTheory.trim().length === 0) {
    console.error('Invalid contestedTheory: must be non-empty string');
    return false;
  }

  return true;
}

export async function generateFact(prompt: string): Promise<GeneratedFact | null> {
  const apiKey = await getApiKey('deepseek');
  if (!apiKey) {
    console.error('DeepSeek API key not configured');
    return null;
  }

  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`Generating fact (attempt ${attempt}/${MAX_RETRIES})`);
      
      const response = await makeApiRequest(prompt, apiKey);
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const rawResponse = await response.text();
      console.debug(`Raw API response:`, rawResponse);

      try {
        // First try direct parse
        const directData = JSON.parse(rawResponse);
        if (validateFactData(directData)) {
          // Check for duplicates before returning
          if (await isDuplicate(directData)) {
            throw new Error('Generated fact is too similar to existing facts');
          }
          console.log('Successfully parsed direct response');
          return directData;
        }
      } catch (e) {
        console.debug('Direct parse failed, trying cleaned response');
      }

      // If direct parse failed, try cleaned version
      const cleaned = cleanApiResponse(rawResponse);
      console.debug('Cleaned response:', cleaned);
      
      const cleanedData = JSON.parse(cleaned);
      if (validateFactData(cleanedData)) {
        // Check for duplicates before returning
        if (await isDuplicate(cleanedData)) {
          throw new Error('Generated fact is too similar to existing facts');
        }
        console.log('Successfully parsed cleaned response');
        return cleanedData;
      }

      // If we get here, validation failed
      throw new Error('API response validation failed - invalid data structure');
    } catch (error) {
      console.error(`Attempt ${attempt} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt >= MAX_RETRIES) {
        console.error('All attempts failed');
        throw lastError;
      }

      // Exponential backoff before retrying
      const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
      console.log(`Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('Failed to generate fact after all attempts');
}

function parseApiResponse(rawResponse: string): GeneratedFact {
  try {
    // Try direct parse first
    try {
      const directData = JSON.parse(rawResponse);
      if (validateFactData(directData)) {
        return directData;
      }
    } catch (e) {
      console.debug('Direct parse failed, trying cleaned response');
    }

    // Try parsing as OpenAI-style response
    try {
      const openAiData = JSON.parse(rawResponse);
      if (openAiData.choices?.[0]?.message?.content) {
        const content = openAiData.choices[0].message.content;
        const parsedContent = typeof content === 'string'
          ? JSON.parse(content)
          : content;
        if (validateFactData(parsedContent)) {
          return parsedContent;
        }
      }
    } catch (e) {
      console.debug('OpenAI-style parse failed');
    }

    // Try cleaned response
    const cleaned = cleanApiResponse(rawResponse);
    if (cleaned) {
      const cleanedData = JSON.parse(cleaned);
      if (validateFactData(cleanedData)) {
        return cleanedData;
      }
    }

    throw new Error('No valid JSON found in response');
  } catch (error) {
    console.error('Failed to parse API response:', {
      rawResponse,
      error: error instanceof Error ? error.message : String(error)
    });
    throw new Error(`Invalid fact data format: ${error instanceof Error ? error.message : String(error)}`);
  }
}

interface Media {
  imageUrl: string | null;
  videoUrl: string | null;
}

export async function findRelatedMedia(fact: GeneratedFact): Promise<Media> {
  let imageUrl: string | null = null;
  let videoUrl: string | null = null;

  try {
    // Get configuration
    const searchEngineId = import.meta.env.VITE_GOOGLE_SEARCH_ENGINE_ID;
    const googleImagesApiKey = await getApiKey('google-images');
    const youtubeApiKey = await getApiKey('youtube');

    // Try to fetch image if configured
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
    } else {
      if (!googleImagesApiKey) {
        console.warn('Google Images API key not configured');
      }
      if (!searchEngineId) {
        console.warn('Google Search Engine ID not configured');
      }
    }

    // Try to fetch video if configured
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
    } else {
      console.warn('YouTube API key not configured');
    }
  } catch (error) {
    console.error('Error in findRelatedMedia:', error);
  }

  return {
    imageUrl,
    videoUrl
  };
}