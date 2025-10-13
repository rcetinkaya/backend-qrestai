/**
 * AI Service
 * OpenAI integration for menu generation and content creation
 */

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface AIGenerationResult {
  content: string;
  tokensUsed: number;
  model: string;
}

export class AIService {
  /**
   * Generate item description from title
   */
  static async generateItemDescription(
    itemName: string,
    category?: string,
    cuisine?: string,
    language: string = 'en'
  ): Promise<AIGenerationResult> {
    const languageMap: Record<string, string> = {
      en: 'English',
      tr: 'Turkish',
      de: 'German',
      fr: 'French',
      es: 'Spanish',
      it: 'Italian',
    };

    const prompt = `You are a professional menu writer for a restaurant. Generate a delicious and appetizing description for the following menu item:

Item Name: ${itemName}
${category ? `Category: ${category}` : ''}
${cuisine ? `Cuisine Type: ${cuisine}` : ''}
Language: ${languageMap[language] || 'English'}

Requirements:
- Write 2-3 sentences (max 100 words)
- Make it appetizing and descriptive
- Highlight key ingredients or preparation method
- Use professional restaurant language
- Write in ${languageMap[language] || 'English'}

Description:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.7,
    });

    return {
      content: completion.choices[0].message.content?.trim() || '',
      tokensUsed: completion.usage?.total_tokens || 0,
      model: completion.model,
    };
  }

  /**
   * Translate menu item
   */
  static async translateMenuItem(
    itemName: string,
    description: string,
    fromLanguage: string,
    toLanguage: string
  ): Promise<AIGenerationResult> {
    const languageMap: Record<string, string> = {
      en: 'English',
      tr: 'Turkish',
      de: 'German',
      fr: 'French',
      es: 'Spanish',
      it: 'Italian',
    };

    const prompt = `Translate the following menu item from ${languageMap[fromLanguage]} to ${languageMap[toLanguage]}:

Name: ${itemName}
Description: ${description}

Requirements:
- Translate accurately while maintaining culinary terminology
- Keep the appetizing tone
- Ensure cultural appropriateness

Translated Name:
Translated Description:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      temperature: 0.3,
    });

    return {
      content: completion.choices[0].message.content?.trim() || '',
      tokensUsed: completion.usage?.total_tokens || 0,
      model: completion.model,
    };
  }

  /**
   * Generate complete menu based on restaurant type
   */
  static async generateCompleteMenu(
    restaurantName: string,
    cuisineType: string,
    categories: string[],
    itemsPerCategory: number = 5,
    language: string = 'en'
  ): Promise<AIGenerationResult> {
    const languageMap: Record<string, string> = {
      en: 'English',
      tr: 'Turkish',
      de: 'German',
      fr: 'French',
      es: 'Spanish',
      it: 'Italian',
    };

    const prompt = `You are a professional menu designer. Create a complete menu for a restaurant with the following details:

Restaurant Name: ${restaurantName}
Cuisine Type: ${cuisineType}
Categories: ${categories.join(', ')}
Items per category: ${itemsPerCategory}
Language: ${languageMap[language] || 'English'}

Requirements:
- Generate ${itemsPerCategory} items for each category
- Include item name, description (2-3 sentences), and suggested price
- Make descriptions appetizing and authentic to the cuisine
- Ensure variety within each category
- Write everything in ${languageMap[language] || 'English'}

Format as JSON:
{
  "categories": [
    {
      "name": "category name",
      "description": "category description",
      "items": [
        {
          "name": "item name",
          "description": "item description",
          "suggestedPrice": number
        }
      ]
    }
  ]
}

Menu:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.8,
      response_format: { type: 'json_object' },
    });

    return {
      content: completion.choices[0].message.content?.trim() || '',
      tokensUsed: completion.usage?.total_tokens || 0,
      model: completion.model,
    };
  }

  /**
   * Generate image prompt for menu item
   */
  static async generateImagePrompt(
    itemName: string,
    description: string,
    cuisineType?: string
  ): Promise<AIGenerationResult> {
    const prompt = `Generate a detailed image generation prompt for the following menu item. The prompt should be suitable for DALL-E or Midjourney:

Item Name: ${itemName}
Description: ${description}
${cuisineType ? `Cuisine: ${cuisineType}` : ''}

Requirements:
- Create a vivid, detailed prompt for food photography
- Include plating, presentation, lighting details
- Mention professional food photography style
- Keep it concise (max 100 words)
- Focus on making the food look appetizing

Image Prompt:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.8,
    });

    return {
      content: completion.choices[0].message.content?.trim() || '',
      tokensUsed: completion.usage?.total_tokens || 0,
      model: completion.model,
    };
  }

  /**
   * Optimize/improve menu item description
   */
  static async optimizeDescription(
    itemName: string,
    currentDescription: string,
    language: string = 'en'
  ): Promise<AIGenerationResult> {
    const languageMap: Record<string, string> = {
      en: 'English',
      tr: 'Turkish',
      de: 'German',
      fr: 'French',
      es: 'Spanish',
      it: 'Italian',
    };

    const prompt = `You are a professional menu copywriter. Improve the following menu item description to make it more appetizing and professional:

Item Name: ${itemName}
Current Description: ${currentDescription}
Language: ${languageMap[language] || 'English'}

Requirements:
- Make it more descriptive and appetizing
- Use professional restaurant language
- Highlight key selling points
- Keep it 2-3 sentences (max 100 words)
- Maintain the same language

Improved Description:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
      temperature: 0.7,
    });

    return {
      content: completion.choices[0].message.content?.trim() || '',
      tokensUsed: completion.usage?.total_tokens || 0,
      model: completion.model,
    };
  }

  /**
   * Analyze menu and provide suggestions
   */
  static async analyzeMenu(
    menuData: {
      categories: Array<{
        name: string;
        items: Array<{
          name: string;
          description?: string;
          price: number;
        }>;
      }>;
    },
    _language: string = 'en'
  ): Promise<AIGenerationResult> {
    const prompt = `You are a restaurant consultant. Analyze the following menu and provide suggestions for improvement:

${JSON.stringify(menuData, null, 2)}

Provide analysis on:
1. Menu structure and balance
2. Pricing strategy
3. Description quality
4. Missing opportunities
5. Recommendations for improvement

Analysis:`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.6,
    });

    return {
      content: completion.choices[0].message.content?.trim() || '',
      tokensUsed: completion.usage?.total_tokens || 0,
      model: completion.model,
    };
  }

  /**
   * Calculate estimated tokens for a prompt (rough estimation)
   */
  static estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Calculate credit cost based on tokens used
   * 1 credit = ~1000 tokens (adjustable)
   */
  static calculateCreditCost(tokensUsed: number): number {
    const TOKENS_PER_CREDIT = 1000;
    return Math.ceil(tokensUsed / TOKENS_PER_CREDIT);
  }
}
