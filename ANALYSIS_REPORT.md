# DirectorByte v2 — Analysis Report
Generated: 2026-05-16

## Feature Inventory

| Feature | Location | What it does | UI | API | State | Status | Migrate to v2 |
|---------|----------|--------------|----|-----|-------|--------|---------------|
| **Story Generation** | `lib/genkit/story-flow.ts` | Expands raw story into cinematic screenplay & visual guide. | Yes (`/projects/new`) | Vertex AI (Gemini) | Firestore | Working | Yes |
| **Scene Breakdown** | `lib/genkit/story-flow.ts` | Splits story into timed scenes with cinematography notes. | Yes (`/projects/[id]/storyboard`) | Vertex AI (Gemini) | Firestore | Working | Yes |
| **Image Generation** | `lib/genkit/imagen-flow.ts` | Generates keyframes for each scene. | Yes (`/projects/[id]/storyboard`) | Vertex AI (Imagen) | Firestore/GCS | Working | Yes |
| **Video Generation** | `lib/genkit/veo-flow.ts` | Generates 8s video clips from keyframes. | Yes (`/projects/[id]/video`) | Vertex AI (Veo) | Firestore/GCS | Working | Yes |
| **Narration** | `lib/genkit/narration-agent.ts` | Generates voiceover for scenes. | Partial | GCP Text-to-Speech | Firestore/GCS | Partial | Yes |
| **Film Assembly** | `lib/gcp/transcoder.ts` | Concatenates clips, audio, and music into final film. | Yes (`/projects/[id]/assemble`) | GCP Transcoder | Firestore/GCS | Working | Yes |
| **Project Management** | `lib/db/queries.ts` | CRUD for films and scenes. | Yes (`/projects`) | Firestore | Firestore | Working | Yes |
| **Authentication** | `lib/firebase/admin.ts` | User login/session management. | Yes (`/`) | Firebase Auth | Firebase | Working | Yes |

## Package Changes

| Package | Version | Action | Reason |
|---------|---------|--------|--------|
| `next` | 16.2.4 | Keep (Upgrade to Stable) | Stick to Latest Stable 15 or 16 if verified. |
| `tailwindcss` | 4.2.0 | Keep | Using v4 as requested. |
| `genkit` | 1.33.0 | Keep | Core AI orchestration. |
| `prisma` | - | **ADD** | Replacing raw Firestore with Prisma + PostgreSQL for v2. |
| `zustand` | - | **ADD** | For client-side state management. |
| `framer-motion`| - | **ADD** | For premium animations. |
| `lucide-react` | 0.564.0 | Keep | Icon set. |

## External Services

| Service | Purpose | Auth | v2 Plan |
|---------|---------|------|---------|
| **Vertex AI (Gemini)** | Story/Scene/Logic | Service Account | Keep (Multi-provider support) |
| **Vertex AI (Imagen)** | Keyframes | Service Account | Keep (Multi-provider support) |
| **Vertex AI (Veo)** | Video Generation | Service Account | Keep (Multi-provider support) |
| **GCP Storage** | Media Assets | Service Account | Keep (Add Google Drive/Local support) |
| **Firestore** | DB | Service Account | **Replace** with PostgreSQL + Prisma |
| **GCP Pub/Sub** | Task Queue | Service Account | **Replace** with BullMQ + Redis |
| **GCP Transcoder**| Final Rendering | Service Account | Keep |

## Data Models Required

- **User**: Profile, subscription tier, credits, API keys.
- **Project**: Title, story, expansion, style guide, status, timestamps.
- **Scene**: Project relation, index, title, description, prompts, media URLs (image/video), status, quality notes.
- **Job**: Type (Image/Video/Audio), status, payload, result, retry count.
- **Subscription**: Tier name, limits (projects/month, storage), price ID.
- **SupportTicket**: User relation, subject, message, status, admin responses.

## Screens to Rebuild

1.  **Landing Page**: High-conversion cinematic landing.
2.  **Dashboard (`/`)**: Overview of projects, credits, and quick actions.
3.  **Project List (`/projects`)**: Grid view of existing films with status badges.
4.  **Creation Flow (`/projects/new`)**: Step-by-step wizard (Story -> AI Refinement -> Confirm).
5.  **Studio Studio (`/projects/[id]`)**: The "Main Hub" for a film.
6.  **Storyboard Editor**: Visual grid of scenes, prompt editing, regenerate buttons.
7.  **Video Pipeline**: Status tracking for video generation, preview player.
8.  **Assembly & Export**: Final render preview, download buttons, sharing options.
9.  **Admin Center**: User management, job monitoring, system health.
10. **Settings**: API Key management (BYOK), profile, billing.

## Known Issues to Fix

1.  **Async Reliability**: Pub/Sub is failing in the existing code; v2 will use BullMQ/Redis for robust task handling.
2.  **Polling Overload**: Current Veo generation uses manual polling; v2 should implement better status tracking or webhooks where possible.
3.  **Database Scalability**: Moving from Firestore (NoSQL) to PostgreSQL (Relational) for better complex queries (admin center, billing).
4.  **Service Account Safety**: Ensure secrets are managed via Env Vars/Vault, not local JSON files.
5.  **Hardcoded Logic**: Many prompts and durations are hardcoded; v2 will use a config-driven approach.
6.  **Error Handling**: Safety filters (RAI) in Veo need smoother user feedback (currently just retries with sanitized prompts).

## Migration Notes

- **Continuity Engine**: The `visualStyleGuide` and `continuityNotes` are key to the "premium" feel. These MUST be preserved and enhanced in v2.
- **Language Support**: Existing code handles language in prompts; v2 should formalize this with a localization system.
- **BYOK (Bring Your Own Key)**: v2 must allow users to use their own GCP/OpenAI/Runway keys as an alternative to the platform's credits.
