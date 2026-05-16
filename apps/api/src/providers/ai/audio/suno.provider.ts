import { AIProvider, AIModule, AudioOptions, AudioResponse } from '../provider.interface';

export class SunoProvider implements AIProvider {
  name = 'suno';
  module: AIModule = AIModule.AUDIO_GEN;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateAudio(prompt: string, options: AudioOptions = {}): Promise<AudioResponse> {
    const payload = {
      prompt,
      mv: options.model || 'chirp-v3-5',
      make_instrumental: false,
      title: 'DirectorByte Audio',
    };

    const response = await fetch('https://studio-api.suno.ai/api/generate/v2/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Suno error: ${response.status} ${errText}`);
    }

    const data: any = await response.json();
    
    // Suno returns an array of clips, we'll track the first one
    if (!data.clips || data.clips.length === 0) {
      throw new Error('Suno API returned no clips.');
    }

    return {
      jobId: data.clips[0].id,
      status: 'PENDING'
    };
  }

  async pollAudioJob(jobId: string): Promise<AudioResponse> {
    const response = await fetch(`https://studio-api.suno.ai/api/feed/?ids=${jobId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Suno error fetching job: ${response.status} ${errText}`);
    }

    const data: any = await response.json();
    
    if (!data || data.length === 0) {
      throw new Error('Suno job not found.');
    }

    const clip = data[0];
    let mappedStatus = clip.status;
    let audioUrl = undefined;
    
    if (clip.status === 'complete' || clip.status === 'streaming') {
      if (clip.audio_url) {
        mappedStatus = 'SUCCEEDED';
        audioUrl = clip.audio_url;
      } else {
        mappedStatus = 'RUNNING';
      }
    } else if (clip.status === 'error') {
      mappedStatus = 'FAILED';
    } else {
      mappedStatus = 'RUNNING';
    }

    return {
      jobId,
      status: mappedStatus,
      audioUrl
    };
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await fetch('https://studio-api.suno.ai/api/client/user', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      if (response.status === 401 || response.status === 403) {
        return { valid: false, error: 'Invalid API key or Session Token' };
      }
      return { valid: response.ok, error: response.ok ? undefined : `Status ${response.status}` };
    } catch (e: any) {
      return { valid: false, error: e.message };
    }
  }

  estimateCredits(operation: string, params: any): number {
    // 1 generation ≈ 10 platform credits
    return 10;
  }
}
