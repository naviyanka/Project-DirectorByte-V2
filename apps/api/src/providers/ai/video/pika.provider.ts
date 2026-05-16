import { AIProvider, AIModule, VideoOptions, VideoJobResponse } from '../provider.interface';

export class PikaProvider implements AIProvider {
  name = 'pika';
  module: AIModule = AIModule.VIDEO_GEN;
  private apiKey: string;
  private available = true;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateVideo(prompt: string, options: VideoOptions = {}): Promise<VideoJobResponse> {
    if (!this.available) {
      throw new Error('Pika API is currently unavailable or invite-only.');
    }

    const payload: any = {
      promptText: prompt,
      options: {
        frameRate: options.frameRate || 24,
        camera: options.camera,
        guidanceScale: options.guidanceScale || 12,
        aspectRatio: options.ratio || '16:9',
      }
    };

    if (options.inputImageUrl) payload.image = options.inputImageUrl;

    const response = await fetch('https://api.pika.art/v1/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (response.status === 403 || response.status === 404) {
      this.available = false;
      throw new Error('Pika API access denied. Marking provider as unavailable.');
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Pika error: ${response.status} ${errText}`);
    }

    const data: any = await response.json();
    return {
      jobId: data.id,
      status: 'PENDING'
    };
  }

  async pollVideoJob(jobId: string): Promise<VideoJobResponse> {
    if (!this.available) {
      throw new Error('Pika API is currently unavailable.');
    }

    const response = await fetch(`https://api.pika.art/v1/jobs/${jobId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (response.status === 403 || response.status === 404) {
      this.available = false;
      throw new Error('Pika API access denied. Marking provider as unavailable.');
    }

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Pika error fetching job: ${response.status} ${errText}`);
    }

    const data: any = await response.json();
    
    // Assume status: 'queued', 'generating', 'finished', 'failed'
    let mappedStatus = data.status;
    let videoUrl = undefined;
    let progress = data.progress || 0;
    
    if (data.status === 'finished') {
      mappedStatus = 'SUCCEEDED';
      videoUrl = data.resultUrl;
      progress = 100;
    } else if (data.status === 'failed') {
      mappedStatus = 'FAILED';
    } else {
      mappedStatus = 'RUNNING';
    }

    return {
      jobId,
      status: mappedStatus,
      videoUrl,
      progress,
      errorMessage: data.error
    };
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await fetch('https://api.pika.art/v1/account', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
        },
      });
      if (response.status === 401 || response.status === 403 || response.status === 404) {
        return { valid: false, error: 'Invalid API key or account lacks API access.' };
      }
      return { valid: response.ok, error: response.ok ? undefined : `Status ${response.status}` };
    } catch (e: any) {
      return { valid: false, error: e.message };
    }
  }

  estimateCredits(operation: string, params: any): number {
    // Standard generation ≈ 80 credits per video
    return 80;
  }
}
