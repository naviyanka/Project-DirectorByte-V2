import { AIProvider, AIModule, VideoOptions, VideoJobResponse, AudioOptions, AudioResponse, TTSOptions, Voice } from './provider.interface';

export class MockVideoProvider implements AIProvider {
  name = 'mock-video';
  module: AIModule = AIModule.VIDEO_GEN;

  async generateVideo(prompt: string, options?: VideoOptions): Promise<VideoJobResponse> {
    return {
      jobId: `mock-video-${Date.now()}`,
      status: 'PENDING'
    };
  }

  async pollVideoJob(jobId: string): Promise<VideoJobResponse> {
    // Simulate a successful completion after some time
    return {
      jobId,
      status: 'SUCCEEDED',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      progress: 100
    };
  }

  async validateKey(): Promise<{ valid: boolean; error?: string }> {
    return { valid: true };
  }

  estimateCredits(): number {
    return 10;
  }
}

export class MockAudioProvider implements AIProvider {
  name = 'mock-audio';
  module: AIModule = AIModule.AUDIO_GEN;

  async generateAudio(prompt: string, options?: AudioOptions): Promise<AudioResponse> {
    return {
      jobId: `mock-audio-${Date.now()}`,
      status: 'SUCCEEDED',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
    };
  }

  async pollAudioJob(jobId: string): Promise<AudioResponse> {
    return {
      jobId,
      status: 'SUCCEEDED',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'
    };
  }

  async validateKey(): Promise<{ valid: boolean; error?: string }> {
    return { valid: true };
  }

  estimateCredits(): number {
    return 5;
  }
}

export class MockVoiceoverProvider implements AIProvider {
  name = 'mock-voiceover';
  module: AIModule = AIModule.VOICEOVER;

  async synthesizeSpeech(text: string, options?: TTSOptions): Promise<AudioResponse> {
    return {
      status: 'SUCCEEDED',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3'
    };
  }

  async listVoices(): Promise<Voice[]> {
    return [
      { id: 'mock-1', name: 'Mock Voice 1', gender: 'female' },
      { id: 'mock-2', name: 'Mock Voice 2', gender: 'male' }
    ];
  }

  async validateKey(): Promise<{ valid: boolean; error?: string }> {
    return { valid: true };
  }

  estimateCredits(operation: string, params: any): number {
    return Math.ceil((params?.text?.length || 0) / 10);
  }
}
