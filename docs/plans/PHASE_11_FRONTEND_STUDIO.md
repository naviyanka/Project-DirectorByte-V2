# PHASE 11 — Frontend: Studio Pipeline (Film Generation Workspace)
> DirectorByte Rebuild · Depends on: PHASE_10 (Home Complete)

---

## Objective

Build the full studio pipeline — DirectorByte's core value proposition.
This is the most complex frontend phase. Each stage of the film generation
pipeline is its own module. They can be run individually or as part of a
full pipeline. Every stage has AI provider selection, settings, progress
tracking, and output management.

Uses `StudioLayout` from Phase 08 (full-screen, no sidebar, pipeline nav on left).

---

## 11.1 — Studio Layout & Navigation

Route: `/studio/:projectId`

### StudioLayout structure
```
┌──────────────────────────────────────────────────────────────────┐
│ [← Home]  My Film Project     [AutoSave ✓ 2min ago]  [Settings] │  ← Studio Topbar
├──────────┬───────────────────────────────────────────┬───────────┤
│ Pipeline │                                           │ Settings  │
│ Stage    │          Active Stage Workspace           │ Drawer    │
│ List     │          (scrollable, full height)        │ (collaps) │
│          │                                           │           │
│ (200px)  │                (flexible)                │  (320px)  │
│          │                                           │           │
└──────────┴───────────────────────────────────────────┴───────────┘
```

### Studio Topbar (separate from app Topbar)
```
[← Home]  [Project Title (editable inline)]  [⟳ Saving...] / [✓ Saved]
                                             [Run All ▶]  [Export]  [⋮]
```

- Back arrow: prompts "Save and exit?" only if unsaved changes
- Title: click to edit inline, Enter to save, Esc to cancel
- AutoSave indicator: "Saving..." spinner → "Saved 2 min ago"
- **Run All**: triggers the full pipeline sequentially (respects enabled stages)
- **Export**: opens export modal
- **⋮ More**: duplicate, archive, share, delete project

### Pipeline Stage Navigator (left panel, 200px)

Vertical list of all stages enabled for this project:

```
PIPELINE
┌─────────────────────┐
│ ✅ 01 Script         │  ← completed (green check)
│ ✅ 02 Storyboard     │  ← completed
│ ▶  03 Keyframes      │  ← active (brand highlighted, left border)
│ ○  04 Images         │  ← pending (gray)
│ ○  05 Video          │
│ ○  06 Audio          │
│ ○  07 Assembly       │
└─────────────────────┘
⚙️ Pipeline Settings
```

Stage item states:
- Pending: gray text, empty circle icon
- In Progress: brand color, animated spinner
- Completed: green check, muted text
- Failed: red warning icon, "Retry" appears on hover
- Skipped: strikethrough text, dash icon

Clicking a stage: navigates to that stage workspace.
Pipeline Settings: drawer to enable/disable stages.

---

## 11.2 — Stage Base Component (`/features/studio/components/StageBase/`)

Every stage is built on this base. It provides:
- Stage header (number + name + status)
- AI Provider selector
- Settings drawer integration
- Run/Re-run button
- Output display area
- Progress bar (for long-running operations)

### Stage Header
```
┌──────────────────────────────────────────────────────────────────┐
│ Stage 03 · Keyframe Generation                [Run Stage ▶]      │
│ Provider: [Gemini Imagen ▼]   Model: [imagen-3 ▼]               │
│ Status: ⟳ Generating...    ETA: ~45 seconds                      │
└──────────────────────────────────────────────────────────────────┘
```

### Provider Selector
Dropdown showing available providers for this stage.
Reads from `/api/v1/api-keys/providers` for this module.
Shows:
- Provider name + icon
- "Connected ✓" if key exists and tested OK
- "Key Required" if no key set (links to Settings → API Keys)
- "Free" badge on free providers

### Progress display (while running)
```
Keyframe Generation
████████████░░░░░░░░  45%
"Generating frame 9 of 20..."
Elapsed: 00:23  ETA: ~30s

[Cancel]
```

---

## 11.3 — Stage 01: Script / Story (`/features/studio/stages/Script/`)

### Input Section
```
"Your Story Idea"
[Large textarea]
  placeholder: "Describe your film idea, any length.
                e.g. 'A lonely astronaut finds an alien artifact on Mars
                that shows a message from Earth's past...'"
  autoResize, min 6 rows

Genre: [Select]   Tone: [Select: Dramatic|Comedic|Thriller|Romantic|...]
Target Length: [Select]   Language: [Select: English|Hindi|Spanish|...]
POV: [Select: First|Third|Omniscient]

Advanced Options (collapsible):
  Act Structure: [3-Act | 5-Act | Hero's Journey | Freytag | Custom]
  Character Focus: [text input]
  Theme Keywords: [tag input]

[✦ Generate Script]  ← primary, full-width
```

### Output Section
Script is returned as structured JSON with sections.
Rendered as a formatted screenplay document:

```
╔════════════════════════════════════════════════╗
║  MY FILM TITLE                                ║
║  Written by AI · DirectorByte                 ║
╠════════════════════════════════════════════════╣
║  ACT ONE                                      ║
║                                               ║
║  EXT. MARS SURFACE - DAY                      ║
║                                               ║
║  A vast, rust-colored wasteland stretches...  ║
║                                               ║
║  COMMANDER HAYES                              ║
║       This can't be natural. No way.          ║
╚════════════════════════════════════════════════╝
```

### Script output toolbar
```
[Copy All]  [Download .txt]  [Download .pdf]  [Edit ✎]  [Regenerate ↺]
```

Edit mode: full rich text editor (TipTap) for manual script editing.
Regenerate: clear output, re-run generation with same settings.

### Scene Breakdown
Tab next to script output: auto-extracted scene list.
```
Act 1 · 3 scenes:
  Scene 1: EXT. MARS SURFACE — action, establishing
  Scene 2: INT. HABITAT — dialogue, tension
  Scene 3: EXT. CRATER — discovery, climax

[Use these scenes for storyboard →]  ← passes to next stage
```

---

## 11.4 — Stage 02: Storyboard (`/features/studio/stages/Storyboard/`)

Takes scenes from Script stage as input.
Generates visual prompts for each scene.

### Input
```
[Scene list from script — read-only with edit option]

For each scene, generates a visual description prompt.
User can edit each prompt before generating images.

Style Reference:
  [Cinematic style select]
  [Upload reference image (optional)]
  
Shot Types per scene (optional):
  [Wide | Medium | Close-up | Aerial | POV]
```

### Output
Storyboard grid — each cell is one scene frame:
```
┌──────────┬──────────┬──────────┐
│ Scene 1  │ Scene 2  │ Scene 3  │
│ [image]  │ [image]  │ [image]  │
│ prompt   │ prompt   │ prompt   │
│ [↺] [✎] │ [↺] [✎] │ [↺] [✎] │
├──────────┼──────────┼──────────┤
│ Scene 4  │ Scene 5  │ + Add    │
│ [image]  │ [image]  │ Scene    │
│ prompt   │ prompt   │          │
│ [↺] [✎] │ [↺] [✎] │          │
└──────────┴──────────┴──────────┘
```

Per frame controls:
- ↺ Regenerate this frame
- ✎ Edit prompt → regenerate
- Drag to reorder scenes
- Click frame → opens detail panel (full-size + prompt edit)

Generate: runs all frames in parallel (progress shows X/N complete).

---

## 11.5 — Stage 03: Keyframe Generation (`/features/studio/stages/Keyframes/`)

More detailed image generation for selected key moments.
Similar to Storyboard but higher resolution, more control.

### Input
```
Keyframes from storyboard (auto-imported) OR start fresh.

For each keyframe:
  Prompt: [text area]
  Negative prompt: [text area] — what to exclude
  
Global Settings:
  Aspect Ratio: [16:9 | 4:3 | 1:1 | 9:16 | 21:9]
  Style Strength: slider 0-100
  Seed: [random | fixed number]
  Quality: [Draft | Standard | High | Ultra]
  Count per frame: [1 | 2 | 4] — generate multiple variations
```

### Output
```
Keyframe: "Mars Crater Discovery"
Variations: [IMG 1] [IMG 2] [IMG 3] [IMG 4]
             ✓ Selected
                      ← click to select as primary
[Download selected]  [Use all in video]
```

Each image: click to expand to full screen lightbox.
Lightbox controls: previous/next, download, set as project thumbnail, use in video.

---

## 11.6 — Stage 04: Video Generation (`/features/studio/stages/VideoGen/`)

### Input
```
Source:
  ○ From keyframes (auto-import selected keyframes)
  ○ From storyboard
  ○ Text prompt only
  ○ Upload reference image

Video Prompt:
  [textarea — describe the motion/action]

Duration: [3s | 5s | 10s | 15s | Custom]
Motion Intensity: [slider: Subtle | Natural | Dynamic | Extreme]
Camera Movement: [Multi-select: Zoom | Pan | Tilt | Orbit | Static | Handheld]
Style: [Realistic | Cinematic | Animated | Time-lapse]
FPS: [24 | 30 | 60]

Provider-specific options (shown dynamically based on selected provider):
  - Runway ML: motion brush, seed, guidance scale
  - Kling: subject reference, creative mode
  - Pika: camera controls, consistency strength
```

### Job-based flow
Video generation is async (takes 30 seconds to several minutes).
```
[Generate Video ▶]

After clicking:
  Job submitted → shows progress:

  ┌─────────────────────────────────────────────┐
  │  🎬 Generating your video                   │
  │  ████████████░░░░░░░░  60%                  │
  │  "Rendering frames..."                       │
  │  Elapsed: 01:23  ·  Est. remaining: ~45s    │
  │  [Cancel job]                                │
  └─────────────────────────────────────────────┘
```

Status polling: every 5 seconds via React Query `refetchInterval`.
On completion: video player appears automatically.

### Video Output
```
┌─────────────────────────────────────────────────┐
│                                                 │
│           [Video Player — 16:9]                 │
│                    ▶ 0:05 / 0:10               │
│             ─────────────────────               │
│ [◀] [▶] [🔈] ──────────●─────── [⛶] [↓]       │
│                                                 │
└─────────────────────────────────────────────────┘

[Regenerate]  [Variations (4)]  [Add to Assembly]  [Download]
```

Video player: HTML5 video with custom controls (matching app design).
"Variations" button: shows N generated versions side by side to pick from.

---

## 11.7 — Stage 05: Audio / Music (`/features/studio/stages/AudioGen/`)

### Input
```
Generation Mode:
  ○ AI Music Generation  ○ Upload audio file

─── AI Music Generation ───────────────────────
Prompt: [textarea]
  placeholder: "Cinematic orchestral score, building tension,
                strings and brass, no vocals..."

Genre: [Select from: Cinematic | Electronic | Ambient | Rock | Jazz | ...]
Mood: [Multi-select pills: Tense | Epic | Sad | Happy | Mysterious | ...]
BPM: [Slider 60-180]
Duration: match to video length (auto) or [custom seconds]
Instrumental: [toggle — no vocals]

Provider-specific:
  - Suno: style, lyrics mode
  - Mubert: tags, intensity
  - ElevenLabs: clone reference

─── Upload Mode ─────────────────────────────
Drag & drop or browse audio file
Supported: MP3, WAV, M4A, FLAC (max 50MB)
Shows waveform after upload
[Trim] [Fade in/out] [Volume adjust]
```

### Audio Output
```
Generated Music: "Cinematic Score v1"
┌─────────────────────────────────────────────────┐
│ ~~~~~∿∿∿∿∿∿~~~~~~∿∿∿∿∿∿∿∿~~~~~  [waveform]    │
│ [◀] [▶]  0:00 ─────────●──────  1:45          │
└─────────────────────────────────────────────────┘
[Regenerate]  [Download MP3]  [Add to Assembly]

Previous generations: (listed below, up to 5 kept)
```

---

## 11.8 — Stage 06: Voice-over / TTS (`/features/studio/stages/Voiceover/`)

### Input
```
Text Source:
  ○ From script (auto-import)
  ○ Custom text

Script text: [TipTap editor, read-only from script or editable]

Voice Settings:
  Provider: [Google TTS | ElevenLabs | OpenAI TTS | PlayHT]
  Voice: [dynamic list from selected provider]
  Speed: [slider 0.5x – 2.0x]
  Pitch: [slider -2 to +2 semitones]
  Language: [Select]

[Preview Voice (15 sec sample)]  ← tests with first 100 chars
[Generate Full Voice-over ▶]
```

### Output
Same waveform player as audio.
Time-coded transcript (if provider returns timestamps):
```
[0:00] "Commander Hayes stepped out of the hab..."
[0:08] "The crater was deeper than expected..."
```

---

## 11.9 — Stage 07: Final Assembly (`/features/studio/stages/Assembly/`)

The timeline editor — brings everything together.

### Assembly Workspace
```
┌───────────────────────────────────────────────────────────────────┐
│ Preview (16:9)                           Layer Controls            │
│ ┌────────────────────────────────┐       [+ Add Layer]             │
│ │                                │       [Video] [Audio] [Voiceover]│
│ │   [Preview frame here]         │       [Image] [Text] [Effect]   │
│ │                                │                                  │
│ └────────────────────────────────┘       Layer list:               │
│ [◀] [▶] 0:12 ───●───────────── 1:45     ■ Video Clip 01 (0-10s)  │
│                                          ■ Video Clip 02 (10-20s) │
├───────────────────────────────────────────────────────────────────┤
│ TIMELINE                                                           │
│ ─── 0s ─────── 5s ─────── 10s ─────── 15s ─────── 20s ──         │
│ 🎞️ │▓▓▓▓▓▓▓▓│▓▓▓▓▓▓▓▓│▓▓▓▓▓▓│           ← video track           │
│ 🎵 │░░░░░░░░░░░░░░░░░░░░░░░░│           ← music track            │
│ 🎤 │    │░░░░░░░░░░░░░░░│   │           ← voice track            │
│ 📝 │         │TEXT│          │           ← text/subtitle track    │
└───────────────────────────────────────────────────────────────────┘
```

Timeline interactions:
- Drag clips left/right to reorder
- Drag clip edges to trim
- Click clip to select and show properties panel
- Scroll timeline to zoom in/out

### Subtitle Editor
Auto-generate subtitles from voice-over:
- Button: "Generate subtitles from voice-over"
- Shows subtitle list with timestamps
- Edit each subtitle inline
- Style controls: font, size, color, position (top/center/bottom)
- Export: SRT, VTT, burned-in

### Export Button
Opens Export Modal.

---

## 11.10 — Export Modal (`/features/studio/components/ExportModal/`)

```
Export Project: "My Film Project"

─── Format ──────────────────────────────────────
○ MP4 (H.264)     ← most compatible
○ MP4 (H.265)     ← smaller file size
○ GIF             ← for social sharing
○ WebM            ← web-optimized
○ ZIP (all assets) ← all raw files
○ JSON (project data) ← backup/import

─── Quality ──────────────────────────────────────
Resolution: [720p | 1080p | 1440p | 4K]
Quality: [Draft (fast) | Standard | High | Maximum]
FPS: [24 | 30 | 60]

─── Audio ────────────────────────────────────────
Include music: [✓]
Include voice-over: [✓]
Audio quality: [128kbps | 256kbps | Lossless]

─── Watermark ────────────────────────────────────
[  ] Add DirectorByte watermark  ← Free/Creator plans
← Studio plan: no watermark option, greyed out

─── Destination ──────────────────────────────────
○ Download to device
○ Save to Google Drive   (requires Drive connected)

─── Estimated ────────────────────────────────────
File size: ~124 MB     Duration: 1 min 45 sec
This export will use 2 export credits (42/100 used)

[Cancel]    [Export Now ▶]  ← shows progress after click
```

Export progress:
```
Exporting...
████████████████░░░░  80%
"Encoding video..."
[Cancel]  (cancels if possible)

─── Complete ─────
✅ Export complete!
"My_Film_Project_1080p.mp4" (124 MB)
[Download]  [Open in Drive]  [Done]
```

---

## 11.11 — Auto-save System

Every 30 seconds (configurable in settings), saves project state:

```typescript
// useAutoSave hook
// - Serializes current studio state to JSON
// - Calls POST /api/v1/projects/:id/autosave
// - Updates "Saved X ago" indicator in Studio Topbar
// - On network failure: stores in localStorage as fallback
//   - Shows warning: "Unable to save to cloud. Changes saved locally."
//   - Retries on reconnect
```

Manual save: Cmd+S shortcut, also saves immediately.

Version history modal (from Stage Navigator → "Version History"):
```
┌─────────────────────────────────────────┐
│ Version History                    [×] │
├─────────────────────────────────────────┤
│ Version 12  ·  Autosave  ·  2 min ago  │
│ [Restore]                               │
├─────────────────────────────────────────┤
│ Version 11  ·  Manual    ·  1 hour ago │
│ [Restore]                               │
├─────────────────────────────────────────┤
│ Version 10  ·  Autosave  ·  2 hours ago│
│ [Restore]                               │
│               (up to 50 versions)       │
└─────────────────────────────────────────┘
```

Restore: shows confirmation "Restore to Version 10? Current state will be saved as a new version first." → [Restore] / [Cancel]

---

## 11.12 — Studio State Management (`/store/studio.store.ts`)

```typescript
{
  // Project
  project: Project | null,
  projectId: string | null,
  
  // Pipeline
  activeStage: AIModule,
  stageStatus: Record<AIModule, StageStatus>,
  stageOutputs: Record<AIModule, StageOutput>,
  
  // Settings
  selectedProviders: Record<AIModule, string>,
  selectedModels: Record<AIModule, string>,
  stageSettings: Record<AIModule, Record<string, unknown>>,
  
  // Jobs
  activeJobs: GenerationJob[],
  
  // Save state
  lastSavedAt: Date | null,
  hasUnsavedChanges: boolean,
  isSaving: boolean,
  
  // Actions
  setActiveStage,
  setStageOutput,
  setProvider,
  updateSettings,
  markSaved,
  
  // Computed
  pipelineProgress: number,   // 0-100
  completedStages: AIModule[]
}
```

---

## 11.13 — Credit Usage Display

Before each generation, show estimated credits:
```
⚡ This generation will use approximately 5 credits
   You have 380 credits remaining (500 limit)
   [Continue] [Cancel]
```

Show only if remaining credits < 50 (as a soft warning).
If credits exhausted: block generation with hard error + upgrade prompt.

---

## 11.14 — Completion Criteria

- [ ] StudioLayout renders with pipeline nav, workspace, settings drawer
- [ ] Studio Topbar shows project name (editable inline), save status
- [ ] Pipeline stage navigator shows correct status per stage
- [ ] Clicking stage navigates to that stage's workspace
- [ ] Stage base component shows provider selector and run button
- [ ] Script stage: generates, shows formatted screenplay output
- [ ] Script output toolbar: copy, download, edit, regenerate all work
- [ ] Storyboard stage: generates grid of frames, reorderable
- [ ] Individual frame regeneration works
- [ ] Keyframe stage: generates with variations, selection works
- [ ] Video generation submits async job, polls for status, shows video player
- [ ] Audio generation shows waveform player on completion
- [ ] Voice-over stage: preview voice works before full generation
- [ ] Assembly stage: timeline renders with tracks, drag to trim works
- [ ] Subtitle editor generates from voice-over and allows editing
- [ ] Export modal shows correct credit usage warning
- [ ] Export initiates and shows progress, download works
- [ ] Auto-save fires every 30 seconds, updates save indicator
- [ ] Manual save (Cmd+S) works
- [ ] Version history modal shows versions, restore creates safety snapshot
- [ ] Credit balance check shows warning when low
- [ ] Hard block on credit exhaustion with upgrade prompt
- [ ] "Run All" pipeline runs stages sequentially, skips disabled stages
- [ ] Zero TypeScript errors
