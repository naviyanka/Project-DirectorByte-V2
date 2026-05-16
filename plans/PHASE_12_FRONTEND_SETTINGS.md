# PHASE 12 — Frontend: Settings Pages
> DirectorByte Rebuild · Depends on: PHASE_11 (Studio Complete)

---

## Objective

Build the complete user settings experience: profile management, API key
configuration per module, storage settings, preferences, and subscription
management (subscription checkout is a separate phase).

Route: `/settings` with tab-based sub-navigation.

---

## 12.1 — Settings Page Shell (`/pages/settings/Settings/`)

### Layout
Full AppLayout (sidebar + topbar) with settings-specific inner layout.

```
Settings
├── Profile
├── API Keys
├── Storage
├── Preferences
└── Subscription
```

Left sub-nav (within settings content area, 220px):
```
┌──────────────────────────┐
│ ACCOUNT                  │
│  Profile                 │  ← active: brand left border
│  Security                │
│  Connected Accounts      │
│                          │
│ AI CONFIGURATION         │
│  API Keys                │
│  Provider Registry       │
│                          │
│ WORKSPACE                │
│  Storage                 │
│  Preferences             │
│                          │
│ BILLING                  │
│  Subscription            │
│  Billing History         │
│                          │
│ DANGER ZONE              │
│  Delete Account          │
└──────────────────────────┘
```

Right: content panel for selected section.
Mobile: tabs replace the sub-nav (horizontal scrollable).

---

## 12.2 — Profile Tab (`/pages/settings/tabs/ProfileTab/`)

### Avatar Section
```
┌─────────────────────────────────────────────────────────┐
│ [Avatar 96px]  Display Name                             │
│                Creator Plan                             │
│ [Change photo]  [Remove photo]                          │
└─────────────────────────────────────────────────────────┘
```

Change photo: opens file picker (jpg/png/webp, max 5MB).
Shows circular crop preview before uploading.
Upload → POST /api/v1/users/me/avatar.
Remove: DELETE /api/v1/users/me/avatar, shows initials fallback.

### Profile Form
```
Display Name *
  Input, current value pre-filled, maxLength 50

Bio
  Textarea, 3 rows, maxLength 300, character counter
  placeholder: "Tell others about yourself..."

Email address
  Input, current value (non-editable inline)
  [Change email →]  ← opens Change Email modal

[Save Changes]  ← disabled until form dirty, primary button
```

### Change Email Modal
```
Modal: "Change Email Address"
──────────────────────────────
Current email: user@example.com

New email address
[input]

Confirm with your password
[password input]

"A verification link will be sent to your new email."

[Cancel]  [Send Verification]
```

After submit: success toast "Check your new inbox to confirm the change."
Email doesn't change until verified.

---

## 12.3 — Security Tab (`/pages/settings/tabs/SecurityTab/`)

### Change Password
```
Current Password
[password input, show/hide]

New Password
[password input, show/hide]
[Password strength meter — same as signup]

Confirm New Password
[password input, show/hide]

[Update Password]
```

On success: "Password updated. You've been signed out of other devices." toast.

### Active Sessions
```
Active Sessions (3)                          [Sign out all other devices]

┌───────────────────────────────────────────────────────┐
│ 💻  Chrome on Windows   ← THIS DEVICE                 │
│     Delhi, IN · Last active: Just now                 │
│     Session started: May 7, 2025                      │
├───────────────────────────────────────────────────────┤
│ 📱  Safari on iPhone                                   │
│     Delhi, IN · Last active: 2 hours ago              │
│     Session started: May 5, 2025       [Sign out]    │
├───────────────────────────────────────────────────────┤
│ 💻  Firefox on macOS                                   │
│     Mumbai, IN · Last active: 3 days ago              │
│     Session started: May 4, 2025       [Sign out]    │
└───────────────────────────────────────────────────────┘
```

"THIS DEVICE" badge on current session — cannot sign out this one here.
"Sign out all other devices" at top: terminates all sessions except current.
Confirm dialog before bulk sign out.

---

## 12.4 — Connected Accounts Tab (`/pages/settings/tabs/ConnectedAccountsTab/`)

```
GOOGLE ACCOUNT
┌───────────────────────────────────────────────────────┐
│ [G icon]  Connected as user@gmail.com                 │
│           Used for: Sign in, Google Drive             │
│                                       [Disconnect]   │
└───────────────────────────────────────────────────────┘

If not connected:
┌───────────────────────────────────────────────────────┐
│ [G icon]  Google Account                              │
│           Connect to use Google sign-in and Drive     │
│                                          [Connect]   │
└───────────────────────────────────────────────────────┘
```

Disconnect warning: "Disconnecting Google will remove Drive access.
You'll need an email/password to sign in."

---

## 12.5 — API Keys Tab (`/pages/settings/tabs/ApiKeysTab/`)

This is the most complex settings section.

### Section Header
```
API Key Manager
"Configure which AI providers power each feature.
Free plan users must provide their own keys.
Creator/Studio plan users use our managed keys by default —
but can override with their own."

[How to get API keys →]  ← links to help article
```

### Module Cards

Each AI module is a card. Cards are grouped by category:

#### LANGUAGE & SCRIPT
- AI Chat / Director Assistant
- Script & Story Generator

#### VISUAL GENERATION
- Keyframe / Storyboard Images
- Background Removal
- Image Upscaling

#### VIDEO
- Video Generation

#### AUDIO
- Music / Audio Generation
- Voice-over / Text-to-Speech

---

Each card:

```
┌───────────────────────────────────────────────────────────┐
│ 🖼️  Keyframe / Image Generation                           │
│                                                           │
│ Provider:  [Gemini Imagen      ▼]   ← current provider   │
│            ○ Gemini Imagen (Connected ✓)                  │
│            ○ DALL-E 3 (Key Required)                      │
│            ○ Stable Diffusion (Free Tier)                 │
│                                                           │
│ API Key:   [●●●●●●●●●●●●  6f3a]    ← masked, shows hint │
│            [Reveal] [Clear]                               │
│                                                           │
│ [Update Key]  →  opens key input inline                  │
│                                                           │
│ ├─ Model:   [imagen-3-fast ▼]                            │
│                                                           │
│ Status: ✅ Connected  ·  Last tested: 5 min ago           │
│                          [Test Connection]               │
│                                                           │
│ ─── Free alternative ──────────────────────────────────  │
│ [○] Use Stable Diffusion Free API instead                │
│     (slower, lower quality — no key needed)              │
└───────────────────────────────────────────────────────────┘
```

### Inline key update
Clicking "Update Key" expands an input within the card:
```
New API Key:
[paste your key here...              ] [Show] [Test & Save]
                                               [Cancel]
```

"Test & Save":
1. Sends key to backend `POST /api/v1/api-keys`
2. Backend auto-tests the key
3. If valid: saves encrypted, shows "✅ Connected" badge
4. If invalid: shows "❌ Invalid key — check your API dashboard"

### Test Connection button
For existing keys:
- Shows spinner "Testing..."
- Returns: ✅ Connected (Xms) / ❌ Error: [message] / ⚠️ Rate limited

### Free Alternative Toggle
When toggled on:
- Disables the key input section (grayed out)
- Shows "Using free Stable Diffusion API" badge
- No API key required for this module
- May show quality/speed caveat

### Managed Keys Notice (for paid users)
If user is on Creator/Studio plan:
```
┌───────────────────────────────────────────────────────────┐
│ ⚡ Using DirectorByte Managed Keys                        │
│ Your Creator plan includes our managed AI keys.           │
│ You don't need to provide your own.                       │
│                                                           │
│ [Use my own key instead →]  ← collapses the managed notice│
│                              and shows key input          │
└───────────────────────────────────────────────────────────┘
```

---

## 12.6 — Storage Tab (`/pages/settings/tabs/StorageTab/`)

```
Storage Settings

PRIMARY STORAGE
┌─────────────────────────────────────────────────────────┐
│ Where are your projects saved?                          │
│                                                         │
│ ○ DirectorByte Cloud  ← default                        │
│   ████████░░░░  8.2 GB of 20 GB used (Creator plan)   │
│                                                         │
│ ○ Google Drive                                          │
│   Connect your Drive to store projects directly there   │
│   [Connect Google Drive →]  ← OAuth button             │
└─────────────────────────────────────────────────────────┘

─── If Google Drive Connected ─────────────────────────────

GOOGLE DRIVE
┌─────────────────────────────────────────────────────────┐
│ ✅ Connected  ·  user@gmail.com                          │
│ Drive quota: 8.2 GB of 15 GB used                       │
│ App folder: /DirectorByte Projects                      │
│                                                         │
│ Currently active: [○ DB Cloud  ● Google Drive]         │
│                                                         │
│ [Sync now →]   Last synced: 2 hours ago                 │
│ [Disconnect Drive]                                      │
└─────────────────────────────────────────────────────────┘

SYNC SETTINGS
┌─────────────────────────────────────────────────────────┐
│ [✓] Auto-sync completed projects                        │
│ [  ] Sync project files (large — uses Drive quota)      │
│ [✓] Sync project metadata and thumbnails               │
└─────────────────────────────────────────────────────────┘

STORAGE BREAKDOWN
┌─────────────────────────────────────────────────────────┐
│ Video files          5.1 GB  ████████████░░  62%       │
│ Generated images     1.8 GB  ████░░░░░░░░░░  22%       │
│ Audio files          0.9 GB  ██░░░░░░░░░░░░  11%       │
│ Other                0.4 GB  █░░░░░░░░░░░░░   5%       │
│                                                         │
│ [Clear cached thumbnails]  (saves ~200MB)               │
└─────────────────────────────────────────────────────────┘
```

---

## 12.7 — Preferences Tab (`/pages/settings/tabs/PreferencesTab/`)

```
APPEARANCE
┌─────────────────────────────────────────────────────────┐
│ Theme                                                   │
│ [○ Dark  ○ Light  ○ System default]                    │
│                                                         │
│ Language                                                │
│ [English (US)              ▼]                          │
│                                                         │
│ Date format                                             │
│ [DD/MM/YYYY                ▼]                          │
└─────────────────────────────────────────────────────────┘

STUDIO DEFAULTS
┌─────────────────────────────────────────────────────────┐
│ Default export format                                   │
│ [MP4 (H.264)               ▼]                          │
│                                                         │
│ Default export resolution                               │
│ [1080p                     ▼]                          │
│                                                         │
│ Auto-save interval                                      │
│ [Every 30 seconds          ▼]                          │
│                                                         │
│ Default pipeline stages                                 │
│ [✓] Script    [✓] Storyboard  [✓] Keyframes           │
│ [✓] Video     [✓] Audio       [✓] Voice-over           │
│ [✓] Assembly                                           │
└─────────────────────────────────────────────────────────┘

EMAIL NOTIFICATIONS
┌─────────────────────────────────────────────────────────┐
│ [✓] Generation complete                                 │
│ [✓] Billing and subscription updates                   │
│ [✓] Product announcements                              │
│ [✓] Support ticket replies                             │
│ [  ] Tips and tutorials                                 │
└─────────────────────────────────────────────────────────┘

[Save Preferences]  ← primary, disabled until dirty
```

---

## 12.8 — Subscription Tab (`/pages/settings/tabs/SubscriptionTab/`)

(Subscription tab within settings — lighter version of the full subscription page.)

```
YOUR PLAN

┌─────────────────────────────────────────────────────────┐
│ ⚡ Creator Plan                          [$19/month]    │
│ Renews May 31, 2025                      [Manage Plan]  │
├─────────────────────────────────────────────────────────┤
│ What's included:                                        │
│ ✓ 500 AI credits/month                                  │
│ ✓ 20 GB storage                                         │
│ ✓ All studio modules                                    │
│ ✓ Managed AI keys (no setup needed)                    │
│ ✓ Project sharing                                       │
│ ✓ Version history                                       │
├─────────────────────────────────────────────────────────┤
│ Usage this period (May 1 – May 31)                      │
│ Credits: 380 / 500   ████████░░  76%                   │
│ Storage: 8.2 / 20 GB ████░░░░░░  41%                   │
│ Exports: 42 / 100    █████░░░░░  42%                   │
└─────────────────────────────────────────────────────────┘

[↑ Upgrade to Studio]     [↓ Cancel Subscription]

─── PROMO CODE ────────────────────────────────────────────
Have a promo code?
[input: ENTER CODE]  [Apply]

─── BILLING HISTORY ────────────────────────────────────────
[View full billing history →]  ← links to /settings/billing
```

---

## 12.9 — Billing History Tab (`/pages/settings/tabs/BillingHistoryTab/`)

```
Billing History

┌──────────────────────────────────────────────────────────┐
│ Date          Plan         Amount   Status   Invoice     │
├──────────────────────────────────────────────────────────┤
│ May 1, 2025   Creator      $19.00   Paid     [↓ PDF]    │
│ Apr 1, 2025   Creator      $19.00   Paid     [↓ PDF]    │
│ Mar 1, 2025   Creator      $14.25   Paid     [↓ PDF]    │
│               (PROMO30)                                  │
│ Feb 1, 2025   Free         $0.00    —        —           │
└──────────────────────────────────────────────────────────┘

Showing 4 of 4 payments

Payment method on file: Visa •••• 4242  [Update →]
```

PDF download: calls `/api/v1/subscriptions/invoices/:id/pdf`.

---

## 12.10 — Delete Account Section (`/pages/settings/tabs/DangerZoneTab/`)

```
Danger Zone

┌─────────────────────────────────────────────────────────┐
│ 🗑️  Delete Account                                       │
│                                                         │
│ Permanently delete your account and all associated      │
│ data. This action cannot be undone.                     │
│                                                         │
│ [Export my data first →]  ← downloads ZIP of projects  │
│                                                         │
│ [Delete my account]  ← ghost danger button             │
└─────────────────────────────────────────────────────────┘
```

Delete Account flow: opens Drawer (not modal — more serious):
```
Delete Account

This will permanently:
• Delete all your projects (142 files, 8.2 GB)
• Cancel your Creator subscription
• Remove your profile and data

Type "DELETE" to confirm:
[text input]

Your current password:
[password input]

After deletion, your data will be retained for 30 days
then permanently anonymized.

[Cancel]  [Delete My Account]  ← danger button, enabled only when both fields valid
```

---

## 12.11 — Completion Criteria

- [ ] Settings sub-nav renders correctly on desktop and mobile
- [ ] Profile: avatar upload/remove works with circular crop preview
- [ ] Profile: name and bio update saves and reflects immediately
- [ ] Change Email: modal sends verification and shows confirmation
- [ ] Security: password change invalidates other sessions
- [ ] Sessions list shows correct devices with "THIS DEVICE" badge
- [ ] Terminating a session removes it from list immediately
- [ ] API Keys: all module cards render with correct provider data
- [ ] Provider dropdown shows connected status correctly
- [ ] Key update: inline input saves, tests key, shows badge
- [ ] Test connection shows latency and error message if failed
- [ ] Free alternative toggle disables key input correctly
- [ ] Managed keys notice shown for paid plan users
- [ ] Storage: Drive connect triggers OAuth correctly
- [ ] Storage breakdown chart shows correct percentages
- [ ] Sync settings toggles save to user profile
- [ ] Preferences: theme toggle applies immediately to UI
- [ ] Email notification toggles save correctly
- [ ] Subscription tab shows correct plan, usage, and renewal date
- [ ] Promo code input validates and applies discount
- [ ] Billing history shows paginated invoices with PDF download
- [ ] Delete account: both input fields must be valid before button enables
- [ ] Zero TypeScript errors
