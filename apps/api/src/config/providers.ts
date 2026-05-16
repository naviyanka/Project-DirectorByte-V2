import { AIModule } from '@prisma/client';

export interface ProviderRegistryEntry {
  id: string;
  name: string;
  module: AIModule;
  models?: string[];
  defaultModel?: string;
  isFree: boolean;
  requiresKey: boolean;
  docUrl?: string;
  keyFormat?: 'standard' | 'pair';
  keyLabel?: string;
  keyPlaceholder?: string;
  keyHint?: string;
  freeQuota?: string;
}

export const PROVIDER_REGISTRY: ProviderRegistryEntry[] = [
  // --- CHAT ---
  {
    id: 'gemini',
    name: 'Google Gemini',
    module: AIModule.CHAT,
    models: ['gemini-1.5-pro', 'gemini-1.5-flash'],
    defaultModel: 'gemini-1.5-pro',
    isFree: false,
    requiresKey: true,
    keyFormat: 'standard',
    keyLabel: 'Google AI Studio API Key',
  },
  {
    id: 'openai',
    name: 'OpenAI',
    module: AIModule.CHAT,
    models: ['gpt-4o', 'gpt-4-turbo', 'gpt-4o-mini'],
    defaultModel: 'gpt-4o-mini',
    isFree: false,
    requiresKey: true,
    keyFormat: 'standard',
    keyLabel: 'OpenAI API Key',
  },
  {
    id: 'anthropic',
    name: 'Anthropic Claude',
    module: AIModule.CHAT,
    models: ['claude-3-5-sonnet'],
    defaultModel: 'claude-3-5-sonnet',
    isFree: false,
    requiresKey: true,
    keyFormat: 'standard',
    keyLabel: 'Anthropic API Key',
  },
  {
    id: 'gemini-free',
    name: 'Gemini (Free Tier)',
    module: AIModule.CHAT,
    isFree: true,
    requiresKey: true,
    keyFormat: 'standard',
  },

  // --- IMAGE_GEN ---
  {
    id: 'openai-dall-e',
    name: 'DALL-E 3',
    module: AIModule.IMAGE_GEN,
    models: ['dall-e-3'],
    defaultModel: 'dall-e-3',
    isFree: false,
    requiresKey: true,
    keyFormat: 'standard',
  },
  {
    id: 'stability',
    name: 'Stability AI',
    module: AIModule.IMAGE_GEN,
    models: ['core', 'sd3'],
    defaultModel: 'core',
    isFree: false,
    requiresKey: true,
    keyFormat: 'standard',
  },

  // --- VIDEO_GEN ---
  {
    id: 'runwayml',
    name: 'RunwayML Gen-3',
    module: AIModule.VIDEO_GEN,
    models: ['gen3a_turbo', 'gen3a'],
    defaultModel: 'gen3a_turbo',
    isFree: false,
    requiresKey: true,
    docUrl: 'https://docs.dev.runwayml.com/',
    keyFormat: 'standard',
    keyLabel: 'RunwayML API Key',
  },
  {
    id: 'kling',
    name: 'Kling AI',
    module: AIModule.VIDEO_GEN,
    models: ['kling-v1', 'kling-v1-5', 'kling-v2'],
    defaultModel: 'kling-v1-5',
    isFree: false,
    requiresKey: true,
    docUrl: 'https://klingai.com/api-reference',
    keyFormat: 'pair',
    keyLabel: 'Kling Access Key : Secret Key',
    keyPlaceholder: 'your_access_key:your_secret_key',
    keyHint: 'Format: access_key:secret_key (with colon separator)',
  },
  {
    id: 'pika',
    name: 'Pika Labs',
    module: AIModule.VIDEO_GEN,
    models: ['pika-1.0', 'pika-2.0'],
    defaultModel: 'pika-1.0',
    isFree: false,
    requiresKey: true,
    docUrl: 'https://pika.art/api',
    keyFormat: 'standard',
    keyLabel: 'Pika API Key',
  },

  // --- AUDIO_GEN ---
  {
    id: 'suno',
    name: 'Suno AI',
    module: AIModule.AUDIO_GEN,
    models: ['chirp-v3-5', 'chirp-v4'],
    defaultModel: 'chirp-v3-5',
    isFree: false,
    requiresKey: true,
    docUrl: 'https://suno.com/api',
    keyFormat: 'standard',
    keyLabel: 'Suno API Key / Session Token',
  },
  {
    id: 'mubert',
    name: 'Mubert',
    module: AIModule.AUDIO_GEN,
    models: ['mubert-default'],
    defaultModel: 'mubert-default',
    isFree: false,
    requiresKey: true,
    docUrl: 'https://mubert.com/render/pricing/api',
    keyFormat: 'standard',
    keyLabel: 'Mubert PAT (Personal Access Token)',
  },

  // --- VOICEOVER ---
  {
    id: 'elevenlabs',
    name: 'ElevenLabs',
    module: AIModule.VOICEOVER,
    models: ['eleven_multilingual_v2', 'eleven_turbo_v2_5', 'eleven_monolingual_v1'],
    defaultModel: 'eleven_multilingual_v2',
    isFree: false,
    requiresKey: true,
    docUrl: 'https://elevenlabs.io/docs/api-reference',
    keyFormat: 'standard',
    keyLabel: 'ElevenLabs API Key',
  },
  {
    id: 'playht',
    name: 'PlayHT',
    module: AIModule.VOICEOVER,
    models: ['PlayHT2.0-turbo', 'PlayHT2.0', 'Play3.0-mini'],
    defaultModel: 'PlayHT2.0-turbo',
    isFree: false,
    requiresKey: true,
    docUrl: 'https://docs.play.ht/reference',
    keyFormat: 'pair',
    keyLabel: 'PlayHT User ID : Secret Key',
    keyPlaceholder: 'your_user_id:your_secret_key',
    keyHint: 'Format: user_id:secret_key (with colon separator)',
  },
  {
    id: 'google-tts',
    name: 'Google Cloud TTS (Free Tier)',
    module: AIModule.VOICEOVER,
    models: ['standard', 'wavenet', 'neural2'],
    defaultModel: 'wavenet',
    isFree: true,
    requiresKey: true,
    docUrl: 'https://cloud.google.com/text-to-speech/docs',
    keyFormat: 'standard',
    keyLabel: 'Google Cloud API Key',
    freeQuota: '1M chars/month (WaveNet), 4M chars/month (Standard)',
  },
];
