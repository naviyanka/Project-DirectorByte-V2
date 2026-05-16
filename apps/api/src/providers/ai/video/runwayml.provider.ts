import { AIProvider, AIModule, VideoOptions, VideoJobResponse } from '../provider.interface';

export class RunwayMLProvider implements AIProvider {
  name = 'runwayml';
  module: AIModule = AIModule.VIDEO_GEN;
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateVideo(prompt: string, options: VideoOptions = {}): Promise<VideoJobResponse> {
    const model = options.model || 'gen3a_turbo';
    
    // Using Gen-3 Alpha API spec
    const payload: any = {
      model,
      promptText: prompt,
      duration: options.durationSeconds || 5,
      ratio: options.ratio || '16:9',
    };

    if (options.seed !== undefined) payload.seed = options.seed;
    if (options.inputImageUrl) payload.promptImage = options.inputImageUrl;
    if (options.motionVector) payload.motionVector = options.motionVector;

    const endpoint = options.inputImageUrl 
      ? 'https://api.dev.runwayml.com/v1/image_to_video'
      : 'https://api.dev.runwayml.com/v1/text_to_video';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Runway-Version': '2024-09-13', // Using standard versioning
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`RunwayML error: ${response.status} ${errText}`);
    }

    const data: any = await response.json();
    return {
      jobId: data.id,
      status: 'PENDING'
    };
  }

  async pollVideoJob(jobId: string): Promise<VideoJobResponse> {
    const response = await fetch(`https://api.dev.runwayml.com/v1/tasks/${jobId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'X-Runway-Version': '2024-09-13',
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`RunwayML error fetching job: ${response.status} ${errText}`);
    }

    const data: any = await response.json();
    
    // Status mapping: PENDING, RUNNING, SUCCEEDED, FAILED
    const mappedStatus = data.status;
    let videoUrl = undefined;
    let progress = data.progress ? Math.round(data.progress * 100) : 0;
    
    if (data.status === 'SUCCEEDED') {
      videoUrl = data.output?.[0]; // Gen-3 API returns an array of output URLs
      progress = 100;
    }

    return {
      jobId: data.id,
      status: mappedStatus,
      videoUrl,
      progress,
      errorMessage: data.error
    };
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await fetch('https://api.dev.runwayml.com/v1/tasks', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'X-Runway-Version': '2024-09-13',
        },
      });
      if (response.status === 401 || response.status === 403) {
        return { valid: false, error: 'Invalid or expired API key' };
      }
      return { valid: response.ok, error: response.ok ? undefined : `Status ${response.status}` };
    } catch (e: any) {
      return { valid: false, error: e.message };
    }
  }

  estimateCredits(operation: string, params: any): number {
    // gen3a_turbo: 5s ≈ 50 credits, 10s ≈ 100
    // gen3a: 5s ≈ 100 credits, 10s ≈ 200
    const duration = params?.durationSeconds || 5;
    const model = params?.model || 'gen3a_turbo';
    
    if (model === 'gen3a') {
      return duration === 10 ? 200 : 100;
    }
    return duration === 10 ? 100 : 50;
  }
}
