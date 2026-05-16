import { AIProvider, AIModule, VideoOptions, VideoJobResponse } from '../provider.interface';
import jwt from 'jsonwebtoken';

export class KlingProvider implements AIProvider {
  name = 'kling';
  module: AIModule = AIModule.VIDEO_GEN;
  private accessKey: string;
  private secretKey: string;

  constructor(apiKeyPair: string) {
    const parts = apiKeyPair.split(':');
    this.accessKey = parts[0] || '';
    this.secretKey = parts[1] || '';
  }

  private generateJWT(): string {
    const payload = {
      iss: this.accessKey,
      exp: Math.floor(Date.now() / 1000) + 1800, // 30 mins
      nbf: Math.floor(Date.now() / 1000) - 5,
    };
    return jwt.sign(payload, this.secretKey, { algorithm: 'HS256', header: { alg: 'HS256', typ: 'JWT' } });
  }

  async generateVideo(prompt: string, options: VideoOptions = {}): Promise<VideoJobResponse> {
    const token = this.generateJWT();
    
    // Using Kling text2video API
    const payload: any = {
      model_name: options.model || 'kling-v1-5',
      prompt,
      mode: options.mode || 'std',
      duration: options.durationSeconds?.toString() || '5',
    };

    if (options.ratio) payload.aspect_ratio = options.ratio;
    if (options.cfg_scale !== undefined) payload.cfg_scale = options.cfg_scale;
    if (options.inputImageUrl) {
      // Kling uses image2video if input image provided
      payload.image = options.inputImageUrl; 
      // Need different endpoint for image2video, handling text2video right now
    }

    const endpoint = options.inputImageUrl 
      ? 'https://api.klingai.com/v1/videos/image2video'
      : 'https://api.klingai.com/v1/videos/text2video';

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Kling error: ${response.status} ${errText}`);
    }

    const data: any = await response.json();
    if (data.code !== 0) {
      throw new Error(`Kling API Error: ${data.message}`);
    }

    return {
      jobId: data.data.task_id,
      status: 'PENDING'
    };
  }

  async pollVideoJob(jobId: string): Promise<VideoJobResponse> {
    const token = this.generateJWT();
    const response = await fetch(`https://api.klingai.com/v1/videos/text2video/${jobId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Kling error fetching job: ${response.status} ${errText}`);
    }

    const data: any = await response.json();
    if (data.code !== 0) {
      throw new Error(`Kling API Error: ${data.message}`);
    }

    const task = data.data;
    let mappedStatus = task.task_status;
    let videoUrl = undefined;
    let progress = 0;
    
    if (mappedStatus === 'succeed') {
      mappedStatus = 'SUCCEEDED';
      videoUrl = task.task_result?.videos?.[0]?.url;
      progress = 100;
    } else if (mappedStatus === 'failed') {
      mappedStatus = 'FAILED';
    } else {
      mappedStatus = 'RUNNING';
    }

    return {
      jobId,
      status: mappedStatus,
      videoUrl,
      progress,
      errorMessage: task.task_status_msg
    };
  }

  async validateKey(apiKeyPair: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const parts = apiKeyPair.split(':');
      if (parts.length !== 2) return { valid: false, error: 'Invalid key format. Expected ACCESS_KEY:SECRET_KEY' };
      
      const payload = {
        iss: parts[0],
        exp: Math.floor(Date.now() / 1000) + 1800,
        nbf: Math.floor(Date.now() / 1000) - 5,
      };
      const token = jwt.sign(payload, parts[1], { algorithm: 'HS256', header: { alg: 'HS256', typ: 'JWT' } });

      // Call some lightweight endpoint to verify
      const response = await fetch('https://api.klingai.com/v1/videos/text2video?size=1', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.status === 401 || response.status === 403) {
        return { valid: false, error: 'Invalid or expired AK/SK pair' };
      }
      return { valid: response.ok, error: response.ok ? undefined : `Status ${response.status}` };
    } catch (e: any) {
      return { valid: false, error: e.message };
    }
  }

  estimateCredits(operation: string, params: any): number {
    // Kling credits depend on mode (std vs pro) and duration
    const mode = params?.mode || 'std';
    const duration = params?.durationSeconds || 5;
    let cost = 10;
    if (mode === 'pro') cost *= 3.5;
    if (duration === 10) cost *= 2;
    return Math.ceil(cost);
  }
}
