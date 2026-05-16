import { AIProvider, AIModule, TTSOptions, AudioResponse, Voice } from '../provider.interface';

export class PlayHTProvider implements AIProvider {
  name = 'playht';
  module: AIModule = AIModule.VOICEOVER;
  private userId: string;
  private secretKey: string;
  private voiceCache: Voice[] | null = null;
  private cacheTimestamp = 0;

  constructor(apiKeyPair: string) {
    const parts = apiKeyPair.split(':');
    this.userId = parts[0] || '';
    this.secretKey = parts[1] || '';
  }

  async synthesizeSpeech(text: string, options: TTSOptions = {}): Promise<AudioResponse> {
    const payload = {
      text,
      voice: options.voice || 's3://voice-cloning-zero-shot/d9ff78ba-d016-47f6-b0ef-dd630f59414e/female-cs/manifest.json', // Default voice
      output_format: options.output_format || 'mp3',
      voice_engine: options.voice_engine || 'PlayHT2.0-turbo',
      speed: options.speed || 1.0,
    };

    const response = await fetch('https://api.play.ht/api/v2/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.secretKey}`,
        'X-USER-ID': this.userId,
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`PlayHT error: ${response.status} ${errText}`);
    }

    // PlayHT returns Server-Sent Events (SSE) stream
    // For simplicity in this implementation, we will parse the stream events until we get the completed event
    const reader = response.body?.getReader();
    const decoder = new TextDecoder('utf-8');
    let done = false;
    let audioUrl = '';

    while (!done) {
      if (!reader) break;
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      if (value) {
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6));
              if (data.event === 'completed') {
                audioUrl = data.url;
                done = true;
                break;
              }
              if (data.event === 'failed') {
                throw new Error(`PlayHT Generation Failed: ${data.error_message}`);
              }
            } catch (e) {
              // Ignore parse errors on partial chunks
            }
          }
        }
      }
    }

    if (!audioUrl) {
      throw new Error('Failed to retrieve audio URL from PlayHT stream');
    }

    return {
      status: 'SUCCEEDED',
      audioUrl
    };
  }

  async listVoices(): Promise<Voice[]> {
    if (this.voiceCache && Date.now() - this.cacheTimestamp < 86400 * 1000) { // 24 hours
      return this.voiceCache;
    }

    const response = await fetch('https://api.play.ht/api/v2/voices', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${this.secretKey}`,
        'X-USER-ID': this.userId,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch PlayHT voices: ${response.status}`);
    }

    const voices: any[] = await response.json();
    this.voiceCache = voices.map((v: any) => ({
      id: v.id,
      name: v.name,
      gender: v.gender,
      language: v.language,
      accent: v.accent,
    }));
    this.cacheTimestamp = Date.now();

    return this.voiceCache;
  }

  async validateKey(apiKeyPair: string): Promise<{ valid: boolean; error?: string }> {
    try {
      const parts = apiKeyPair.split(':');
      if (parts.length !== 2) return { valid: false, error: 'Invalid format. Expected USER_ID:SECRET_KEY' };
      
      const response = await fetch('https://api.play.ht/api/v2/voices?limit=1', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${parts[1]}`,
          'X-USER-ID': parts[0],
        },
      });

      if (response.status === 401) {
        return { valid: false, error: 'Invalid PlayHT Credentials' };
      }
      return { valid: response.ok, error: response.ok ? undefined : `Status ${response.status}` };
    } catch (e: any) {
      return { valid: false, error: e.message };
    }
  }

  estimateCredits(operation: string, params: any): number {
    const text = params?.text || '';
    return Math.ceil(text.length / 5);
  }
}
