/**
 * AI Provider Interface
 * ----------------------
 * Common interface for all AI providers (Gemini, OpenAI, Anthropic, Stability).
 */

import { AIModule } from '@prisma/client';
export { AIModule };

export interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string; }
export interface ChatOptions { model?: string; temperature?: number; maxTokens?: number; }
export interface ChatResponse { content: string; usage?: { promptTokens: number; completionTokens: number }; }

export interface ImageOptions { model?: string; width?: number; height?: number; numImages?: number; }
export interface ImageResponse { images: Array<{ url?: string; base64?: string }>; }

export interface VideoOptions { 
  model?: string; 
  durationSeconds?: number; 
  ratio?: '16:9' | '9:16' | '1:1';
  seed?: number;
  inputImageUrl?: string;
  motionVector?: string;
  mode?: 'std' | 'pro';
  cfg_scale?: number;
  frameRate?: number;
  resolution?: string;
  camera?: string;
  guidanceScale?: number;
}
export interface VideoJobResponse { jobId: string; status: string; videoUrl?: string; progress?: number; errorMessage?: string; }

export interface AudioOptions { 
  model?: string; 
  voice?: string; 
  format?: string; 
  intensity?: 'low'|'medium'|'high';
  durationSeconds?: number;
}
export interface AudioResponse { audioUrl?: string; audioBase64?: string; durationMs?: number; status?: string; jobId?: string; }

export interface TTSOptions { 
  voice?: string; 
  language?: string; 
  speed?: number; 
  model_id?: string;
  voice_settings?: any;
  output_format?: string;
  voice_engine?: string;
}

export interface Voice {
  id: string;
  name: string;
  preview_url?: string;
  gender?: string;
  accent?: string;
  language?: string;
}

export interface AIProvider {
  name: string;
  module: AIModule;

  chat?(messages: ChatMessage[], options: ChatOptions): Promise<ChatResponse>;
  generateImage?(prompt: string, options: ImageOptions): Promise<ImageResponse>;
  
  generateVideo?(prompt: string, options: VideoOptions): Promise<VideoJobResponse>;
  pollVideoJob?(jobId: string): Promise<VideoJobResponse>;
  
  generateAudio?(prompt: string, options: AudioOptions): Promise<AudioResponse>;
  pollAudioJob?(jobId: string): Promise<AudioResponse>;
  
  synthesizeSpeech?(text: string, options: TTSOptions): Promise<AudioResponse>;
  listVoices?(apiKey?: string): Promise<Voice[]>;
  
  validateKey(apiKey: string): Promise<{ valid: boolean; error?: string }>;
  estimateCredits(operation: string, params: unknown): number;
}
