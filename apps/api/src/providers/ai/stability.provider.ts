import { AIProvider, AIModule, ImageOptions, ImageResponse } from './provider.interface';

export class StabilityProvider implements AIProvider {
  name = 'stability';
  module: AIModule = AIModule.IMAGE_GEN;
  private apiKey: string;

  constructor(apiKey: string) { this.apiKey = apiKey; }

  async generateImage(prompt: string, options: ImageOptions = {}): Promise<ImageResponse> {
    const engine = options.model || 'stable-diffusion-xl-1024-v1-0';
    const res = await fetch(`https://api.stability.ai/v1/generation/${engine}/text-to-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${this.apiKey}`, Accept: 'application/json' },
      body: JSON.stringify({
        text_prompts: [{ text: prompt, weight: 1 }],
        cfg_scale: 7, width: options.width || 1024, height: options.height || 1024,
        samples: options.numImages || 1, steps: 30,
      }),
    });
    const data: any = await res.json();
    return { images: (data.artifacts || []).map((a: any) => ({ base64: a.base64 })) };
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const res = await fetch('https://api.stability.ai/v1/user/account', { headers: { Authorization: `Bearer ${apiKey}` } });
      return { valid: res.ok };
    } catch (e: any) { return { valid: false, error: e.message }; }
  }

  estimateCredits(operation: string): number { return operation === 'image' ? 5 : 1; }
}
