import { AIProvider, AIModule, ChatMessage, ChatOptions, ChatResponse, ImageOptions, ImageResponse } from './provider.interface';

export class GeminiProvider implements AIProvider {
  name = 'gemini';
  module: AIModule = AIModule.CHAT;
  private apiKey: string;

  constructor(apiKey: string) { this.apiKey = apiKey; }

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
    const model = options.model || 'gemini-2.0-flash';
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: messages.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
        generationConfig: { temperature: options.temperature || 0.7, maxOutputTokens: options.maxTokens || 2048 },
      }),
    });
    const data: any = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return { content: text, usage: { promptTokens: 0, completionTokens: 0 } };
  }

  async generateImage(prompt: string, options: ImageOptions = {}): Promise<ImageResponse> {
    // Imagen via Gemini API (placeholder — actual endpoint varies)
    return { images: [{ url: `https://placeholder.com/${prompt}` }] };
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      return { valid: res.ok };
    } catch (e: any) { return { valid: false, error: e.message }; }
  }

  estimateCredits(operation: string): number {
    return operation === 'chat' ? 1 : operation === 'image' ? 5 : 1;
  }
}
