import { Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Type } from '@google/genai';

@Injectable()
export class AiService {
  private client: GoogleGenAI | null = null;
  private readonly logger = new Logger(AiService.name);

  constructor(private configService: ConfigService) {}

  private getClient(): GoogleGenAI {
    if (this.client) return this.client;
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new InternalServerErrorException('AI service not configured');
    }
    this.client = new GoogleGenAI({ apiKey });
    return this.client;
  }

  private cleanText(input?: string): string {
    if (!input) return '';
    return input.replace(/```json/gi, '').replace(/```/g, '').trim();
  }

  private parseSafeJSON(input?: string): any {
    const cleaned = this.cleanText(input);
    if (!cleaned) return null;
    try {
      return JSON.parse(cleaned);
    } catch (error) {
      this.logger.warn('Failed to parse AI JSON response');
      return null;
    }
  }

  async generateText(model: string, prompt: string, config?: Record<string, any>) {
    try {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config,
      });
      return response.text || '';
    } catch (error) {
      this.logger.error('AI generateText failed');
      throw new InternalServerErrorException('AI request failed');
    }
  }

  async getMarketSentiment(symbol: string, price: number, change24h: number, volume: number) {
    const schema = {
      type: Type.OBJECT,
      properties: {
        sentiment: {
          type: Type.STRING,
          enum: ['Bullish', 'Bearish', 'Neutral'],
          description: 'The overall market trend classification.',
        },
        score: {
          type: Type.NUMBER,
          description: 'A fear/greed score from 0 (Extreme Fear) to 100 (Extreme Greed).',
        },
        summary: {
          type: Type.STRING,
          description: 'A concise 1-sentence analytical summary of the price action.',
        },
        supportLevel: {
          type: Type.NUMBER,
          description: 'The nearest estimated technical support price level.',
        },
        resistanceLevel: {
          type: Type.NUMBER,
          description: 'The nearest estimated technical resistance price level.',
        },
        signalStrength: {
          type: Type.STRING,
          enum: ['Weak', 'Moderate', 'Strong'],
          description: 'The confidence level of the analysis.',
        },
      },
      required: ['sentiment', 'score', 'summary', 'supportLevel', 'resistanceLevel', 'signalStrength'],
    };

    const prompt = `Analyze the current 24h market data for ${symbol}.
Price: ${price}
Change: ${change24h}%
Volume: ${volume}

Act as a senior technical analyst. Calculate key levels and sentiment score based on momentum and volatility.`;

    try {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.1,
        },
      });

      const data = this.parseSafeJSON(response.text);
      return (
        data || {
          sentiment: 'Neutral',
          score: 50,
          summary: 'Analysis unavailable due to data format error.',
          supportLevel: price * 0.95,
          resistanceLevel: price * 1.05,
          signalStrength: 'Weak',
        }
      );
    } catch (error) {
      this.logger.error('AI getMarketSentiment failed');
      return {
        sentiment: 'Neutral',
        score: 50,
        summary: 'AI Analysis unavailable at the moment.',
        supportLevel: price * 0.95,
        resistanceLevel: price * 1.05,
        signalStrength: 'Weak',
      };
    }
  }

  async analyzeDispute(chatHistory: any[], reason: string, buyerName: string, sellerName: string) {
    const schema = {
      type: Type.OBJECT,
      properties: {
        recommendation: {
          type: Type.STRING,
          enum: ['Buyer Wins', 'Seller Wins', 'More Evidence Needed'],
          description: 'The verdict recommendation.',
        },
        confidence: { type: Type.NUMBER, description: 'Confidence score 0-100' },
        reasoning: { type: Type.STRING, description: 'Explanation of the verdict based on chat logs.' },
        key_evidence: { type: Type.STRING, description: 'Specific messages or actions that led to this conclusion.' },
      },
      required: ['recommendation', 'confidence', 'reasoning', 'key_evidence'],
    };

    const chatLog = chatHistory.map((m) => `[${m.timestamp}] ${m.sender}: ${m.text}`).join('\n');

    const prompt = `You are an expert P2P Arbitration Judge. Analyze this dispute.

Context:
- Buyer: ${buyerName}
- Seller: ${sellerName}
- Dispute Reason: ${reason}

Chat History:
${chatLog}

Analyze the conversation for proof of payment, acknowledgement of receipt, or refusal to release. Determine who is likely telling the truth.`;

    try {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: schema,
          temperature: 0.0,
        },
      });

      return this.parseSafeJSON(response.text);
    } catch (error) {
      this.logger.error('AI analyzeDispute failed');
      return null;
    }
  }

  async analyzeImage(base64Image: string, prompt: string) {
    try {
      const ai = this.getClient();
      const cleanBase64 = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: cleanBase64,
              },
            },
            { text: prompt },
          ],
        },
      });

      return this.cleanText(response.text);
    } catch (error) {
      this.logger.error('AI analyzeImage failed');
      throw new InternalServerErrorException('AI request failed');
    }
  }

  async generateSpeech(text: string) {
    try {
      const ai = this.getClient();
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-preview-tts',
        contents: {
          parts: [{ text }],
        },
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;
    } catch (error) {
      this.logger.error('AI generateSpeech failed');
      throw new InternalServerErrorException('AI request failed');
    }
  }
}
