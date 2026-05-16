import { AIProvider, AIModule, AudioOptions, AudioResponse } from '../provider.interface';

export class MubertProvider implements AIProvider {
  name = 'mubert';
  module: AIModule = AIModule.AUDIO_GEN;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateAudio(prompt: string, options: AudioOptions = {}): Promise<AudioResponse> {
    const payload = {
      method: 'RecordTrackTTM',
      params: {
        pat: this.apiKey,
        prompt,
        format: options.format || 'mp3',
        intensity: options.intensity || 'medium',
        duration: options.durationSeconds || 30,
        mode: 'track'
      }
    };

    const response = await fetch('https://api-b2b.mubert.com/v2/RecordTrackTTM', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Mubert error: ${response.status} ${errText}`);
    }

    const data: any = await response.json();
    if (data.status !== 1) {
      throw new Error(`Mubert API Error: ${data.error?.message || 'Unknown error'}`);
    }

    const task = data.data?.tasks?.[0];
    if (!task) {
      throw new Error('Mubert returned success but no task data.');
    }

    return {
      status: 'SUCCEEDED',
      audioUrl: task.download_link,
      jobId: task.task_id
    };
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await fetch('https://api-b2b.mubert.com/v2/GetServiceAccess', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'GetServiceAccess', params: { pat: apiKey } })
      });
      const data: any = await response.json();
      if (data.status === 1) {
        return { valid: true };
      }
      return { valid: false, error: data.error?.text || 'Invalid Mubert PAT' };
    } catch (e: any) {
      return { valid: false, error: e.message };
    }
  }

  estimateCredits(operation: string, params: any): number {
    // 30s ≈ 5 credits, 60s ≈ 10 credits, proportional
    const duration = params?.durationSeconds || 30;
    return Math.ceil((duration / 30) * 5);
  }
}
