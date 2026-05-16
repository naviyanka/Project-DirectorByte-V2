# PHASE 00 — Existing Codebase Analysis & Feature Inventory
> DirectorByte Rebuild · Run this phase FIRST before any code is written

---

## Objective

Before writing a single line of new code, perform a complete audit of the existing
DirectorByte codebase at https://github.com/naviyanka/Project-DirectorByte.
This phase produces a living inventory document that all future phases reference.

---

## Step 1 — Clone & Inspect

Clone the repository into a read-only reference directory:
```
/directorbyte-existing/   ← reference only, never modify
/directorbyte-v2/         ← this is where ALL new code will go
```

Walk the entire directory tree. List every file and folder with a one-line description
of its purpose. Note which files are entry points, which are config, which are UI,
which are API, which are unused or dead code.

---

## Step 2 — Feature Extraction

For each existing feature found, document:

```
Feature: [name]
Location: [file/folder path]
What it does: [plain English description]
UI: [does it have a UI component? describe it]
API: [does it call an API? which one?]
State: [where is state stored? local, global, server?]
Dependencies: [external packages or services it needs]
Status: [working / broken / partial / unknown]
Migrate to v2: [yes / no / modified — and why]
New home in v2: [where in the new structure this will live]
```

Produce one entry per feature. Organize them into categories:
- Authentication features
- Studio / generation features
- Project management features
- Settings features
- UI/layout features
- Backend / API features
- Any admin features
- Any billing/subscription features
- Any storage features

---

## Step 3 — Dependency Audit

List all packages in package.json(s):
- Identify which packages are actively used
- Identify which packages are outdated (flag major version behind)
- Identify which packages should be replaced in v2 (e.g. CRA → Vite)
- Identify which packages must be kept for feature parity
- Flag any packages with known security issues

---

## Step 4 — API & Service Inventory

Document every external API or service the app currently uses:
```
Service: [name]
Purpose: [what feature uses it]
Auth method: [API key / OAuth / none]
Where key is stored: [env / hardcoded / user-provided]
Usage volume: [how often called]
Cost model: [free / paid / quota-based]
v2 plan: [keep as-is / replace with / make user-configurable]
```

---

## Step 5 — Data Structure Map

For any data the existing app stores or manages (even in localStorage, JSON files,
or an existing database), document the shape:
```
Entity: [name]
Fields: [list all fields with types]
Relationships: [what other entities does it relate to]
Currently stored in: [localStorage / file / DB / memory]
v2 storage plan: [PostgreSQL table name + Prisma model name]
```

---

## Step 6 — UI/UX Inventory

Screenshot or describe every existing screen/page:
- Route path
- Page name
- Components used
- Current design quality (1-5)
- What to keep in v2
- What to redesign completely
- What to add/expand

---

## Step 7 — Known Issues & Gaps

Document anything that is currently broken, incomplete, or missing:
- Bugs observed in the code
- Features referenced in code but not implemented
- Placeholder/TODO comments
- Missing error handling
- Missing loading states
- Missing mobile responsiveness
- Missing dark mode
- Security gaps (exposed keys, missing auth checks, etc.)

---

## Step 8 — Output Deliverable

Produce a single file: `/directorbyte-v2/ANALYSIS_REPORT.md`

This file becomes the source of truth for all future phases.
Every subsequent phase should reference this file to ensure no
existing feature is accidentally dropped.

Structure:
```markdown
# DirectorByte v2 — Analysis Report
Generated: [date]

## Feature Inventory (N features found)
[table of all features]

## Package Changes
[table: keep / replace / remove per package]

## External Services
[table of all services]

## Data Models Required
[list of all entities to model in DB]

## Screens to Rebuild
[list of all screens with notes]

## Known Issues to Fix
[numbered list]

## Migration Notes
[anything Antigravity needs to remember across phases]
```

---

## Step 9 — Directory Scaffold Preview

Before Phase 01 begins, output the planned `/directorbyte-v2/` directory tree
in full (all folders and key files, no code yet — just the structure).
Get confirmation that the structure looks correct before proceeding.

This preview should be exhaustive — every folder that will exist in the final
app should appear here. Use comments to explain non-obvious folders.
