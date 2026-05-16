# PHASE 07B — Backend: Video & Audio AI Provider Implementations
> DirectorByte Rebuild · Depends on: PHASE_07 (AI Provider Interface defined)
> Insert this phase between PHASE_07 and PHASE_08.

---

## Objective

Implement the concrete provider backends for video generation and audio generation.
Phase 07 defines the `AIProvider` interface and implements text/image providers
(Gemini, OpenAI, Anthropic, Stability). This phase extends that with the full set
of video and audio providers the Studio pipeline requires.

---

## 7B.1 — Video Generation Providers

All video providers implement the `AIProvider` interface from Phase 07.
They must implement: `generateVideo()`, `pollVideoJob()`, and `validateKey()`.

Video generation is always async — you submit a job, get a job ID, then poll for completion.
The studio worker in Phase 07 handles the polling loop.

### RunwayML (`/providers/ai/video/runwayml.provider.ts`)

API reference: https://docs.dev.runwayml.com/

```typescript
class RunwayMLProvider implements AIProvider {
  name = 'runwayml'
  module = AIModule.VIDEO_GEN

  // Submit video generation job
  async generateVideo(prompt: string, options: VideoOptions): Promise<VideoJobResponse>
    // POST https://api.dev.runwayml.com/v1/image_to_video (or text_to_video)
    // options: { model: 'gen3a_turbo' | 'gen3a', duration: 5|10, ratio: '16:9'|'9:16', seed?, inputImageUrl? }
    // Returns: { jobId: string, status: 'PENDING' }

  // Poll job status
  async pollVideoJob(jobId: string): Promise<VideoJobResponse>
    // GET https://api.dev.runwayml.com/v1/tasks/{id}
    // Returns: { jobId, status: 'PENDING'|'RUNNING'|'SUCCEEDED'|'FAILED', outputUrl?, progress? }

  async validateKey(apiKey: string): Promise<{ valid: bool, error?: string }>
    // GET https://api.dev.runwayml.com/v1/tasks (list with limit=1)
    // If 200: valid. If 401: invalid.

  estimateCredits(operation: string, params: unknown): number
    // gen3a_turbo 5s ≈ 50 credits, 10s ≈ 100
    // gen3a 5s ≈ 100 credits, 10s ≈ 200
}
```

**VideoOptions type extension for RunwayML:**
```typescript
{
  model: 'gen3a_turbo' | 'gen3a'
  duration: 5 | 10                  // seconds
  ratio: '16:9' | '9:16' | '1:1'
  seed?: number
  inputImageUrl?: string            // for image-to-video mode
  motionVector?: string             // camera direction hint
}
```

---

### Kling AI (`/providers/ai/video/kling.provider.ts`)

API reference: https://klingai.com/api (uses JWT auth, not simple API key)

```typescript
class KlingProvider implements AIProvider {
  name = 'kling'
  module = AIModule.VIDEO_GEN

  // Kling uses JWT signed with AK/SK pair, not a raw API key
  // The "apiKey" stored for Kling is: "ACCESS_KEY:SECRET_KEY" format
  // On each request: generate JWT (HS256, 30min expiry) from AK/SK

  private generateJWT(accessKey: string, secretKey: string): string
    // header: { alg: 'HS256', typ: 'JWT' }
    // payload: { iss: accessKey, exp: now+1800, nbf: now-5 }
    // sign with secretKey

  async generateVideo(prompt: string, options: VideoOptions): Promise<VideoJobResponse>
    // POST https://api.klingai.com/v1/videos/text2video
    // Body: { model_name, prompt, negative_prompt?, cfg_scale, mode, duration, aspect_ratio }
    // model_name: 'kling-v1' | 'kling-v1-5' | 'kling-v2'
    // mode: 'std' | 'pro'
    // Returns: { task_id, task_status: 'submitted' }

  async pollVideoJob(jobId: string): Promise<VideoJobResponse>
    // GET https://api.klingai.com/v1/videos/text2video/{task_id}
    // Returns status + output video URL when complete

  async validateKey(apiKey: string): Promise<{ valid: bool, error?: string }>
    // Parse "ACCESS_KEY:SECRET_KEY", generate JWT, call list endpoint
}
```

**Storage format for Kling key:** Store as `"ACCESS_KEY:SECRET_KEY"` in encrypted field.
The key parsing and JWT generation happens inside the provider, transparent to callers.

---

### Pika Labs (`/providers/ai/video/pika.provider.ts`)

```typescript
class PikaProvider implements AIProvider {
  name = 'pika'
  module = AIModule.VIDEO_GEN

  // Pika API is invite-only / enterprise — implement with their REST API
  // Fallback: if API not available, mark provider as 'unavailable' gracefully

  async generateVideo(prompt: string, options: VideoOptions): Promise<VideoJobResponse>
    // POST https://api.pika.art/v1/generate
    // Body: { prompt, options: { frameRate, resolution, camera, guidanceScale } }

  async pollVideoJob(jobId: string): Promise<VideoJobResponse>
    // GET https://api.pika.art/v1/jobs/{id}

  async validateKey(apiKey: string): Promise<{ valid: bool, error?: string }>
    // GET https://api.pika.art/v1/account

  estimateCredits(operation: string, params: unknown): number
    // Standard generation ≈ 80 credits per video
}
```

**Graceful unavailability:** If the Pika API returns 403/404 consistently, the provider
should set `this.available = false` and the factory should skip it with a log message.
Do not crash the application.

---

## 7B.2 — Audio Generation Providers

All audio providers implement: `generateAudio()` and/or `synthesizeSpeech()` and `validateKey()`.

### Suno AI (`/providers/ai/audio/suno.provider.ts`)

Used for: background music generation, soundtrack generation.

```typescript
class SunoProvider implements AIProvider {
  name = 'suno'
  module = AIModule.AUDIO_GEN

  async generateAudio(prompt: string, options: AudioOptions): Promise<AudioResponse>
    // Suno uses an unofficial API / web scraping approach currently
    // Official API: POST https://studio-api.suno.ai/api/generate/v2/
    // Body: { prompt, mv: 'chirp-v3-5', make_instrumental: bool, tags, title }
    // Returns: { clips: [{ id, status, audio_url?, video_url? }] }

  async pollAudioJob(jobId: string): Promise<AudioResponse>
    // GET https://studio-api.suno.ai/api/feed/?ids={id}
    // Wait for status 'complete', then return audio_url

  async validateKey(apiKey: string): Promise<{ valid: bool, error?: string }>
    // Validate by checking session/account endpoint

  estimateCredits(operation: string, params: unknown): number
    // 1 generation ≈ 10 platform credits (Suno uses its own credit system)
}
```

**Note for Antigravity:** Suno's official API access requires applying. If not available,
implement a `mockProvider` stub that returns a placeholder audio file URL for development.

---

### Mubert (`/providers/ai/audio/mubert.provider.ts`)

Used for: royalty-free background music generation (AI-generated, licensed).

```typescript
class MubertProvider implements AIProvider {
  name = 'mubert'
  module = AIModule.AUDIO_GEN

  async generateAudio(prompt: string, options: AudioOptions): Promise<AudioResponse>
    // POST https://api-b2b.mubert.com/v2/RecordTrackTTM
    // Body: { pat: apiKey, prompt, format: 'mp3', intensity: 'low'|'medium'|'high',
    //         duration: number (30-600s), mode: 'track' }
    // Returns: { status: 1, data: { tasks: [{ download_link }] } }
    // Mubert is synchronous — audio URL returned directly, no polling needed

  async validateKey(apiKey: string): Promise<{ valid: bool, error?: string }>
    // POST https://api-b2b.mubert.com/v2/GetServiceAccess
    // Body: { pat: apiKey }

  estimateCredits(operation: string, params: unknown): number
    // 30s ≈ 5 credits, 60s ≈ 10 credits, proportional
}
```

---

### ElevenLabs (`/providers/ai/audio/elevenlabs.provider.ts`)

Used for: voiceover / narration synthesis (text-to-speech).

```typescript
class ElevenLabsProvider implements AIProvider {
  name = 'elevenlabs'
  module = AIModule.VOICEOVER

  async synthesizeSpeech(text: string, options: TTSOptions): Promise<AudioResponse>
    // POST https://api.elevenlabs.io/v1/text-to-speech/{voice_id}
    // Headers: xi-api-key: apiKey
    // Body: { text, model_id: 'eleven_multilingual_v2'|'eleven_turbo_v2_5',
    //         voice_settings: { stability, similarity_boost, style, use_speaker_boost } }
    // Returns: audio/mpeg stream
    // Save stream to temp file, upload to storage, return URL

  async listVoices(apiKey: string): Promise<Voice[]>
    // GET https://api.elevenlabs.io/v1/voices
    // Returns available voices (cached for 1 hour per user)

  async validateKey(apiKey: string): Promise<{ valid: bool, error?: string }>
    // GET https://api.elevenlabs.io/v1/user
    // Returns subscription info — valid if 200

  estimateCredits(operation: string, params: { text: string }): number
    // ElevenLabs charges per character: ~1 credit per 5 chars (platform conversion)
    // estimateCredits('tts', { text }) => Math.ceil(text.length / 5)
}
```

**Extra route needed — Voice listing:**
Add `GET /api/v1/studio/voices` to Phase 04 studio routes:
```typescript
// Query: { provider: 'elevenlabs' | 'google' | 'openai' }
// Calls the provider's listVoices() method
// Caches result for 1 hour in Redis (key: voices:{userId}:{provider})
// Returns: [{ id, name, preview_url?, gender?, accent?, language? }]
```

---

### PlayHT (`/providers/ai/audio/playht.provider.ts`)

Used for: voiceover synthesis (alternative to ElevenLabs). Notable for voice cloning.

```typescript
class PlayHTProvider implements AIProvider {
  name = 'playht'
  module = AIModule.VOICEOVER

  // PlayHT uses userId + secretKey (two separate values)
  // Store as "USER_ID:SECRET_KEY" format in encrypted field (same pattern as Kling)

  async synthesizeSpeech(text: string, options: TTSOptions): Promise<AudioResponse>
    // POST https://api.play.ht/api/v2/tts
    // Headers: Authorization: Bearer secretKey, X-USER-ID: userId
    // Body: { text, voice: voiceId, output_format: 'mp3', voice_engine: 'PlayHT2.0-turbo' }
    // Returns: SSE stream with audio URL in final event

  async listVoices(apiKey: string): Promise<Voice[]>
    // GET https://api.play.ht/api/v2/voices
    // Returns 900+ voices — cache aggressively (24 hours)

  async validateKey(apiKey: string): Promise<{ valid: bool, error?: string }>
    // Parse userId:secretKey, call GET https://api.play.ht/api/v2/voices (first 1 result)
}
```

---

### Google TTS (`/providers/ai/audio/googletts.provider.ts`)

Used for: free-tier voiceover synthesis using Google Cloud Text-to-Speech.
Available to all users (uses platform key or user's own GCP key).

```typescript
class GoogleTTSProvider implements AIProvider {
  name = 'google-tts'
  module = AIModule.VOICEOVER

  async synthesizeSpeech(text: string, options: TTSOptions): Promise<AudioResponse>
    // POST https://texttospeech.googleapis.com/v1/text:synthesize
    // Body: { input: { text }, voice: { languageCode, name, ssmlGender },
    //         audioConfig: { audioEncoding: 'MP3', speakingRate, pitch } }
    // Returns: { audioContent: base64 string }
    // Decode base64, upload to storage, return URL

  async listVoices(apiKey?: string): Promise<Voice[]>
    // GET https://texttospeech.googleapis.com/v1/voices
    // Returns 300+ voices — cache 24 hours

  async validateKey(apiKey: string): Promise<{ valid: bool, error?: string }>
    // Call listVoices with the provided key
}
```

---

## 7B.3 — Provider Registry Updates

Update `/config/providers.config.ts` (defined in Phase 07) to include all new providers:

```typescript
export const PROVIDER_REGISTRY: ProviderRegistryEntry[] = [
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
    keyFormat: 'pair',       // "ACCESS_KEY:SECRET_KEY"
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
]
```

---

## 7B.4 — Studio Worker Updates

Update `studio.worker.ts` from Phase 07 to handle async video/audio polling:

### Polling loop for async providers

```typescript
async function pollUntilComplete(
  provider: AIProvider,
  jobId: string,
  generationJobId: string,
  maxWaitMinutes = 10
): Promise<VideoJobResponse | AudioResponse> {
  const pollIntervalMs = 5000     // poll every 5 seconds
  const maxPolls = (maxWaitMinutes * 60 * 1000) / pollIntervalMs

  for (let i = 0; i < maxPolls; i++) {
    const result = await provider.pollVideoJob!(jobId)

    // Update progress in DB (0-100)
    const progress = result.progress ?? Math.min(i * 5, 90)
    await updateJobProgress(generationJobId, progress)

    if (result.status === 'SUCCEEDED' || result.status === 'completed') {
      return result
    }
    if (result.status === 'FAILED' || result.status === 'error') {
      throw new Error(result.errorMessage ?? 'Generation failed')
    }

    await sleep(pollIntervalMs)
  }

  throw new Error(`Generation timed out after ${maxWaitMinutes} minutes`)
}
```

### Output file handling

When a video/audio job completes:
1. Download the output URL to a temp file
2. Upload to the user's configured storage provider (GCS / Drive / local)
3. Store the final URL in `GenerationJob.outputPayload`
4. Delete temp file
5. Update project's storageSizeBytes

```typescript
async function downloadAndStore(
  outputUrl: string,
  userId: string,
  projectId: string,
  fileType: 'video' | 'audio'
): Promise<string> {
  // Download from provider CDN to /tmp/
  // Upload to user's storage via StorageService
  // Return permanent URL stored in our system
}
```

---

## 7B.5 — New Environment Variables

Add these to `/directorbyte-v2/backend/.env.example`:

```bash
# Video Generation Providers (Platform-level keys for managed plans)
PLATFORM_RUNWAYML_API_KEY=
PLATFORM_KLING_ACCESS_KEY=
PLATFORM_KLING_SECRET_KEY=
PLATFORM_PIKA_API_KEY=

# Audio Generation Providers
PLATFORM_SUNO_API_KEY=
PLATFORM_MUBERT_PAT=

# Voiceover Providers
PLATFORM_ELEVENLABS_API_KEY=
PLATFORM_PLAYHT_USER_ID=
PLATFORM_PLAYHT_SECRET_KEY=
PLATFORM_GOOGLE_TTS_API_KEY=
```

Update `config/env.ts` Zod schema to include these as optional (`z.string().optional()`).
At startup, log which platform keys are configured vs missing (without exposing values):
```
[providers] Configured: runwayml, elevenlabs, google-tts
[providers] Missing (users must provide BYO key): kling, pika, suno, mubert, playht
```

---

## 7B.6 — Admin Services Panel Updates

Update the admin services API from Phase 06 (`GET /api/v1/admin/services`) to include
the new providers in the `aiProviders` array. Each new provider follows the same schema
as existing providers: `{ id, name, module, isActive, keyHint, lastTested, model, ... }`.

For "pair" type keys (Kling, PlayHT): the admin UI shows two separate masked fields
(ACCESS_KEY and SECRET_KEY / USER_ID and SECRET_KEY). The backend stores them concatenated
as `ACCESS_KEY:SECRET_KEY` in the encrypted field.

`PATCH /api/v1/admin/services/ai/:providerId` for pair keys:
- Body: `{ accessKey?, secretKey? }` (or `{ userId?, secretKey? }` for PlayHT)
- Backend: concatenate as `accessKey:secretKey` before encrypting and storing

---

## 7B.7 — Mock Provider (Development)

Create `/providers/ai/mock.provider.ts` for development without real API keys:

```typescript
class MockVideoProvider implements AIProvider {
  name = 'mock-video'
  module = AIModule.VIDEO_GEN

  async generateVideo(prompt: string): Promise<VideoJobResponse> {
    return { jobId: `mock-${Date.now()}`, status: 'PENDING' }
  }

  async pollVideoJob(jobId: string): Promise<VideoJobResponse> {
    // Simulate 10-second generation
    return {
      jobId,
      status: 'SUCCEEDED',
      outputUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4'
    }
  }

  async validateKey(): Promise<{ valid: bool }> { return { valid: true } }
  estimateCredits(): number { return 10 }
}

class MockAudioProvider implements AIProvider {
  name = 'mock-audio'
  module = AIModule.AUDIO_GEN
  // Returns: royalty-free sample audio URL
}

class MockVoiceoverProvider implements AIProvider {
  name = 'mock-voiceover'
  module = AIModule.VOICEOVER
  // Returns: royalty-free sample speech URL
}
```

When `NODE_ENV=development` and no platform key is configured for a module,
the provider factory falls back to the mock provider and logs a warning.

---

## 7B.8 — Completion Criteria

- [ ] RunwayML provider: `generateVideo`, `pollVideoJob`, `validateKey` all implemented
- [ ] Kling provider: JWT generation from AK/SK pair works, video gen and poll work
- [ ] Pika provider: implemented with graceful unavailability fallback
- [ ] Suno provider: audio generation and poll implemented
- [ ] Mubert provider: synchronous audio generation implemented
- [ ] ElevenLabs provider: TTS synthesis saves file and returns URL
- [ ] PlayHT provider: TTS synthesis with user_id:secret_key parsing
- [ ] Google TTS provider: works for free tier users without extra key
- [ ] `GET /api/v1/studio/voices` route implemented and cached
- [ ] Provider registry updated with all new providers including key format hints
- [ ] Studio worker polling loop handles timeouts gracefully
- [ ] Output files downloaded from provider CDN and stored in user storage
- [ ] All new env vars in `.env.example` and validated in `config/env.ts`
- [ ] Admin services panel returns new providers
- [ ] Mock providers work in development for all three modules
- [ ] Zero TypeScript errors
