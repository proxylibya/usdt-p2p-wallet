
import apiClient from './apiClient';

export const AIService = {
    
    /**
     * Helper to clean AI output (removes markdown code blocks and whitespace)
     */
    cleanText: (input: string | undefined): string => {
        if (!input) return "";
        // Remove markdown code blocks (```json ... ``` or just ```)
        let cleaned = input.replace(/```json/gi, '').replace(/```/g, '').trim();
        return cleaned;
    },

    /**
     * Safely parses JSON from AI response, handling potential formatting issues
     */
    parseSafeJSON: (input: string | undefined): any => {
        const cleaned = AIService.cleanText(input);
        if (!cleaned) return null;
        try {
            return JSON.parse(cleaned);
        } catch {
            return null;
        }
    },

    /**
     * Generates text content based on a prompt.
     */
    generateText: async (model: string, prompt: string, config?: any) => {
        const response = await apiClient.post<{ text: string }>('/ai/text', {
            model,
            prompt,
            config
        });

        if (!response.success) {
            throw new Error(response.error || 'AI request failed');
        }

        return response.data?.text || '';
    },

    /**
     * Generates structured market sentiment data using JSON schema.
     * Analyzes price action, volume, and volatility to produce a trading signal.
     */
    getMarketSentiment: async (symbol: string, price: number, change24h: number, volume: number) => {
        try {
            const response = await apiClient.post<any>('/ai/market-sentiment', {
                symbol,
                price,
                change24h,
                volume
            });

            if (response.success && response.data) {
                return response.data;
            }
        } catch {}

        // Return neutral fallback data on error to prevent UI crash
        return {
            sentiment: "Neutral",
            score: 50,
            summary: "AI Analysis unavailable at the moment.",
            supportLevel: price * 0.95,
            resistanceLevel: price * 1.05,
            signalStrength: "Weak"
        };
    },

    /**
     * Analyzes P2P Trade Dispute based on chat history.
     */
    analyzeDispute: async (chatHistory: any[], reason: string, buyerName: string, sellerName: string) => {
        try {
            const response = await apiClient.post<any>('/ai/dispute-analysis', {
                chatHistory,
                reason,
                buyerName,
                sellerName
            });

            return response.success ? response.data : null;
        } catch {
            return null;
        }
    },

    /**
     * Analyzes an image (QR or Text) to extract crypto addresses.
     * Uses Gemini Vision 2.5.
     */
    analyzeImage: async (base64Image: string, prompt: string) => {
        const response = await apiClient.post<{ text: string }>('/ai/analyze-image', {
            base64Image,
            prompt
        });

        if (!response.success) {
            throw new Error(response.error || 'AI request failed');
        }

        return AIService.cleanText(response.data?.text || '');
    },

    /**
     * Generates audio from text (TTS).
     */
    generateSpeech: async (text: string) => {
        const response = await apiClient.post<{ audioBase64: string | null }>('/ai/speech', { text });

        if (!response.success) {
            throw new Error(response.error || 'AI request failed');
        }

        return response.data?.audioBase64 || null;
    }
};
