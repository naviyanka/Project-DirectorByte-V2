import { AIProvider, AIModule, ChatMessage, ChatOptions, ChatResponse, ImageOptions, ImageResponse } from './provider.interface';

export class OpenAIProvider implements AIProvider {
  name = 'openai';
  module: AIModule = AIModule.CHAT;
  private apiKey: string;

  constructor(apiKey: string) { this.apiKey = apiKey; }

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
    const model = options.model || 'gpt-4o-mini';
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({
        model, messages, temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 2048,
      }),
    });
    const data: any = await res.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      usage: { promptTokens: data.usage?.prompt_tokens || 0, completionTokens: data.usage?.completion_tokens || 0 },
    };
  }

  async generateImage(prompt: string, options: ImageOptions = {}): Promise<ImageResponse> {
    const res = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}` },
      body: JSON.stringify({ prompt, model: options.model || 'dall-e-3', n: options.numImages || 1, size: `${options.width || 1024}x${options.height || 1024}` }),
    });
    const data: any = await res.json();
    return { images: (data.data || []).map((d: any) => ({ url: d.url })) };
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const res = await fetch('https://api.openai.com/v1/models', { headers: { Authorization: `Bearer ${apiKey}` } });
      return { valid: res.ok };
    } catch (e: any) { return { valid: false, error: e.message }; }
  }

  estimateCredits(operation: string): number {
    return operation === 'chat' ? 1 : operation === 'image' ? 10 : 1;
  }
}
