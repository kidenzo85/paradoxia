import { getFirestore, doc, getDoc } from 'firebase/firestore';

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

export interface Translation {
  title: string;
  content: string;
  contestedTheory: string;
}

export type Language = 'fr' | 'en' | 'zh' | 'ar' | 'es';

export async function translateText(text: string, targetLang: Language): Promise<string | null> {
  try {
    const apiKey = await getApiKey('deepseek');
    if (!apiKey) {
      throw new Error('DeepSeek API key not configured');
    }

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{
          role: 'system',
          content: `You are a professional translator. Translate the following text to ${targetLang}. Keep scientific terms accurate.`
        }, {
          role: 'user',
          content: text
        }]
      })
    });

    if (!response.ok) {
      throw new Error('Failed to translate text');
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error translating text:', error);
    return null;
  }
}

export async function translateFact(fact: {
  title: string;
  content: string;
  contestedTheory: string;
}, targetLang: Language): Promise<Translation | null> {
  try {
    const [translatedTitle, translatedContent, translatedTheory] = await Promise.all([
      translateText(fact.title, targetLang),
      translateText(fact.content, targetLang),
      translateText(fact.contestedTheory, targetLang)
    ]);

    if (!translatedTitle || !translatedContent || !translatedTheory) {
      throw new Error('Failed to translate some parts of the fact');
    }

    return {
      title: translatedTitle,
      content: translatedContent,
      contestedTheory: translatedTheory
    };
  } catch (error) {
    console.error('Error translating fact:', error);
    return null;
  }
}