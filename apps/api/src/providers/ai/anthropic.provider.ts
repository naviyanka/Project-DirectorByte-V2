import { AIProvider, AIModule, ChatMessage, ChatOptions, ChatResponse } from './provider.interface';

export class AnthropicProvider implements AIProvider {
  name = 'anthropic';
  module: AIModule = AIModule.CHAT;
  private apiKey: string;

  constructor(apiKey: string) { this.apiKey = apiKey; }

  async chat(messages: ChatMessage[], options: ChatOptions = {}): Promise<ChatResponse> {
    const model = options.model || 'claude-sonnet-4-20250514';
    const systemMsg = messages.find(m => m.role === 'system');
    const userMsgs = messages.filter(m => m.role !== 'system');

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model, max_tokens: options.maxTokens || 2048,
        system: systemMsg?.content,
        messages: userMsgs.map(m => ({ role: m.role, content: m.content })),
      }),
    });
    const data: any = await res.json();
    return {
      content: data.content?.[0]?.text || '',
      usage: { promptTokens: data.usage?.input_tokens || 0, completionTokens: data.usage?.output_tokens || 0 },
    };
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: 1, messages: [{ role: 'user', content: 'hi' }] }),
      });
      return { valid: res.ok };
    } catch (e: any) { return { valid: false, error: e.message }; }
  }

  estimateCredits(operation: string): number { return operation === 'chat' ? 2 : 1; }
}
