import { AIProvider } from './provider.interface';
import { GeminiProvider } from './gemini.provider';
import { OpenAIProvider } from './openai.provider';
import { AnthropicProvider } from './anthropic.provider';
import { StabilityProvider } from './stability.provider';
import { RunwayMLProvider } from './video/runwayml.provider';
import { KlingProvider } from './video/kling.provider';
import { PikaProvider } from './video/pika.provider';
import { SunoProvider } from './audio/suno.provider';
import { MubertProvider } from './audio/mubert.provider';
import { ElevenLabsProvider } from './tts/elevenlabs.provider';
import { PlayHTProvider } from './tts/playht.provider';
import { GoogleTTSProvider } from './tts/googletts.provider';
import { MockVideoProvider, MockAudioProvider, MockVoiceoverProvider } from './mock.provider';
import { AppError } from '../../utils/errors';
import { env } from '../../config/env';

const providers: Record<string, new (apiKey: string) => AIProvider> = {
  gemini: GeminiProvider,
  openai: OpenAIProvider,
  anthropic: AnthropicProvider,
  stability: StabilityProvider,
  runwayml: RunwayMLProvider,
  kling: KlingProvider,
  pika: PikaProvider,
  suno: SunoProvider,
  mubert: MubertProvider,
  elevenlabs: ElevenLabsProvider,
  playht: PlayHTProvider,
  'google-tts': GoogleTTSProvider,
};

export function getProvider(providerName: string, apiKey?: string): AIProvider {
  const nameLower = providerName.toLowerCase();
  const ProviderClass = providers[nameLower];
  
  if (!ProviderClass) {
    throw new AppError(`Unknown AI provider: ${providerName}`, 400, 'UNKNOWN_PROVIDER');
  }

  if (!apiKey) {
    if (env.NODE_ENV === 'development') {
      // Use mock providers for testing without keys in dev
      if (['runwayml', 'kling', 'pika'].includes(nameLower)) return new MockVideoProvider();
      if (['suno', 'mubert'].includes(nameLower)) return new MockAudioProvider();
      if (['elevenlabs', 'playht', 'google-tts'].includes(nameLower)) return new MockVoiceoverProvider();
    }
    throw new AppError(`API Key required for provider: ${providerName}`, 400, 'MISSING_PROVIDER_KEY');
  }

  return new ProviderClass(apiKey);
}

export function getSupportedProviders(): string[] {
  return Object.keys(providers);
}
