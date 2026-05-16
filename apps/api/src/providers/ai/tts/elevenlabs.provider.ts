import { AIProvider, AIModule, TTSOptions, AudioResponse, Voice } from '../provider.interface';

export class ElevenLabsProvider implements AIProvider {
  name = 'elevenlabs';
  module: AIModule = AIModule.VOICEOVER;
  private apiKey: string;
  private voiceCache: Voice[] | null = null;
  private cacheTimestamp = 0;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async synthesizeSpeech(text: string, options: TTSOptions = {}): Promise<AudioResponse> {
    const voiceId = options.voice || 'EXAVITQu4vr4xnSDxMaL'; // Default voice
    const model_id = options.model_id || 'eleven_multilingual_v2';
    
    const payload: any = {
      text,
      model_id,
      voice_settings: options.voice_settings || {
        stability: 0.5,
        similarity_boost: 0.75,
        style: 0.0,
        use_speaker_boost: true
      }
    };

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey,
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`ElevenLabs error: ${response.status} ${errText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    return {
      status: 'SUCCEEDED',
      audioBase64: buffer.toString('base64'),
    };
  }

  async listVoices(): Promise<Voice[]> {
    // Cache for 1 hour
    if (this.voiceCache && Date.now() - this.cacheTimestamp < 3600 * 1000) {
      return this.voiceCache;
    }

    const response = await fetch('https://api.elevenlabs.io/v1/voices', {
      method: 'GET',
      headers: {
        'xi-api-key': this.apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch ElevenLabs voices: ${response.status}`);
    }

    const data: any = await response.json();
    this.voiceCache = data.voices.map((v: any) => ({
      id: v.voice_id,
      name: v.name,
      preview_url: v.preview_url,
      gender: v.labels?.gender,
      accent: v.labels?.accent,
      language: v.labels?.language
    }));
    this.cacheTimestamp = Date.now();

    return this.voiceCache || [];
  }

  async validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const response = await fetch('https://api.elevenlabs.io/v1/user', {
        method: 'GET',
        headers: { 'xi-api-key': apiKey }
      });
      if (response.status === 401) {
        return { valid: false, error: 'Invalid ElevenLabs API Key' };
      }
      return { valid: response.ok, error: response.ok ? undefined : `Status ${response.status}` };
    } catch (e: any) {
      return { valid: false, error: e.message };
    }
  }

  estimateCredits(operation: string, params: any): number {
    // ElevenLabs charges per character: ~1 credit per 5 chars (platform conversion)
    const text = params?.text || '';
    return Math.ceil(text.length / 5);
  }
}
