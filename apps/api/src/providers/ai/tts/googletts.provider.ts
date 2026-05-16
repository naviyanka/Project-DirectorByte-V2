import { AIProvider, AIModule, TTSOptions, AudioResponse, Voice } from '../provider.interface';

export class GoogleTTSProvider implements AIProvider {
  name = 'google-tts';
  module: AIModule = AIModule.VOICEOVER;
  private apiKey: string;
  private voiceCache: Voice[] | null = null;
  private cacheTimestamp = 0;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async synthesizeSpeech(text: string, options: TTSOptions = {}): Promise<AudioResponse> {
    const payload = {
      input: { text },
      voice: { 
        languageCode: options.language || 'en-US', 
        name: options.voice || 'en-US-Journey-D',
      },
      audioConfig: { 
        audioEncoding: options.output_format || 'MP3',
        speakingRate: options.speed || 1.0
      }
    };

    const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${this.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Google TTS error: ${response.status} ${errText}`);
    }

    const data: any = await response.json();
    if (!data.audioContent) {
      throw new Error('Google TTS did not return audioContent');
    }

    return {
      status: 'SUCCEEDED',
      audioBase64: data.audioContent,
    };
  }

  async listVoices(apiKey?: string): Promise<Voice[]> {
    if (this.voiceCache && Date.now() - this.cacheTimestamp < 86400 * 1000) { // 24 hours
      return this.voiceCache;
    }

    const key = apiKey || this.apiKey;
    const response = await fetch(`https://texttospeech.googleapis.com/v1/voices?key=${key}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch Google TTS voices: ${response.status}`);
    }

    const data: any = await response.json();
    this.voiceCache = data.voices.map((v: any) => ({
      id: v.name,
      name: v.name,
      gender: v.ssmlGender,
      language: v.languageCodes?.[0],
    }));
    this.cacheTimestamp = Date.now();

    return this.voiceCache || [];
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await fetch(`https://texttospeech.googleapis.com/v1/voices?key=${apiKey}`, {
        method: 'GET'
      });
      if (response.status === 400 || response.status === 403) {
        return { valid: false, error: 'Invalid Google Cloud API Key' };
      }
      return { valid: response.ok, error: response.ok ? undefined : `Status ${response.status}` };
    } catch (e: any) {
      return { valid: false, error: e.message };
    }
  }

  estimateCredits(operation: string, params: any): number {
    // 0 credits, as it's meant to be a free tier usage or uses platform limits.
    // If we wanted to track chars, we could.
    return 0;
  }
}
