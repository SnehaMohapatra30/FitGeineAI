# FitGenie AI UI Overhaul: Warm Athletic Terracotta & Slate Design System

A complete visual and architectural redesign of FitGenie AI that replaces generic AI tropes (purple gradients, pill clusters, and cramped cards) with a human-designed athletic training aesthetic featuring a warm terracotta and mineral slate palette, an expansive uncrowded spatial layout, sharp precision geometry, and high-contrast badges.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> The following user preferences from Phase 1 have been integrated as binding architectural decisions:

- **Confirmed Color Scheme**: Warm athletic palette with rich terracotta (`#C85A32` / `#D96B43`), warm ember accents (`#E08E45`), deep mineral slate (`#12161A`, `#1A2026`), and warm bone/sand text (`#F5F0EB`, `#B3A89E`). Elimination of generic indigo/violet AI glows.
- **Confirmed Spatial Philosophy**: Open, expansive layout with generous negative space. Zero cramped cards, no nested cards-in-cards, and larger desktop grid gutters (`gap-8`, `p-8` to `p-10`).
- **Confirmed Styling Treatment**: Sharp athletic borders (`rounded-lg` / `rounded-xl`), subtle carbon-grain surface backdrops, high-contrast monospace badges (`font-mono tracking-wider`), and unboxed metadata.

---

## 1. Overview & Core Concept

FitGenie AI is an elite sports science and athletic conditioning platform combining real-time computer vision pose tracking, biometric periodization, macronutrient logging, and AI coaching.

### Problem Addressed
The current UI exhibits common AI-generated visual tells: bubble-shaped `rounded-3xl` cards, purple/indigo gradients, cramped side-by-side columns, and candy-colored status pills that make the platform feel like a tech demo rather than a dedicated athletic performance suite.

### Target Persona
Serious athletes, coaches, and strength trainees who demand high-contrast clarity, immediate telemetry feedback, and uncrowded visual space while performing lifts or reviewing nutritional trends.

---

## 2. User Experience & Visual Design System

### A. The 60-30-10 Color Architecture
- **60% Dominant Canvas**: Deep Mineral Obsidian (`#0C1014`) with warm dark undertones, subtle slate noise/carbon texture overlay.
- **30% Structural Surfaces**: Warm Slate Plates (`#151B22`, `#1E2630`) with crisp hairline borders (`rgba(200, 140, 110, 0.12)`).
- **10% High-Intent Terracotta Accent**: Burnt Sienna Terracotta (`#C85A32`, hover `#D96B43`), athletic bronze/amber highlights (`#E08E45`), and crisp contrast indicators.

### B. Typography & Tabular Discipline
- **Display & Headings**: `Plus Jakarta Sans` / `Outfit` with crisp geometric letterforms and balanced tracking (`text-wrap: balance`).
- **Body & Controls**: `Plus Jakarta Sans` / `DM Sans` (14px–16px, 1.6 line height) in warm bone white (`#F3EFEA`).
- **Telemetry & Numbers**: `JetBrains Mono` / `font-mono tabular-nums` for all weights, joint angles, calorie numbers, and timers to prevent layout jitter.

### C. Uncrowded Layout & Spatial Rhythm
```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│ TOP BAR: Wordmark [FITGENIE] ──── [Dashboard | Plan | Vision | Tracker | Coach] ── Auth│
├────────────────────────────────────────────────────────────────────────────────────────┤
│ HERO METRIC STRIP: [Active Phase]      [Weekly Volume]      [Daily Kcal]     [Streak]  │
├────────────────────────────────────────────────────────────────────────────────────────┤
│ MAIN WORKSPACE VIEWPORT (Max-W-7xl, Generous 32px Padding, Open Air Rhythms)           │
│                                                                                        │
│  ┌────────────────────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │ PRIMARY TELEMETRY / WORKSPACE          │  │ SECONDARY LOG & RECOVERY             │  │
│  │ (Spacious 60% Width, Sharp Borders)    │  │ (Spacious 40% Width, High Contrast)  │  │
│  │                                        │  │                                      │  │
│  └────────────────────────────────────────┘  └──────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────────────────────────┘
```
- **Spacious Desktop Canvas**: Content container expands to a generous `max-w-7xl` with `p-8` to `p-12` margins.
- **Single-Elevation Depth**: Flat, tactile cards with sharp 1px borders; zero nested card containers.
- **Unboxed Metadata**: Tags, dates, and metrics use clean text separated by `·` or `/` instead of pill wrappers.

---

## 3. Key Component Refactorings

### 1. Navigation & Top Bar Contract (`src/App.tsx`)
- Replace the bubble tab bar with a sleek, one-row athletic navigation bar.
- Zone 1: Athletic brand wordmark with sharp terracotta mark.
- Zone 2: 5 single-line tab links (`whitespace-nowrap`) with warm terracotta active underlines.
- Zone 3: User profile badge and live session quick-trigger.

### 2. Biometrics Dashboard (`src/components/DashboardView.tsx`)
- Spread cramped stat widgets across an open 4-column KPI strip with generous `p-6` card padding.
- Modernize the Recharts visual graphs with terracotta line fills and slate gridlines.
- Display macro targets as clean linear progress bars with tabular gram readouts.

### 3. Vision Lab & Webcam Pose Tracker (`src/components/VisionLab.tsx`)
- Expand camera viewport into an uncluttered, widescreen training frame with sharp corner brackets.
- High-contrast HUD telemetry overlay: Clean terracotta joint angle gauges (Knee, Hip, Elbow, Spine).
- Real-time rep counter and clean status banner without decorative pulsing dots.

### 4. Interactive Workout Tracker (`src/components/TrackerView.tsx`)
- Open calendar heat-map grid with generous spacing between workout completion days.
- Split food, water, sleep, and weight logs into spacious, uncrowded cards with hairline dividers.
- Food plate scanner modal styled with dark slate and terracotta capture triggers.

### 5. GenieCoach Visual Assistant (`src/components/ChatbotView.tsx`)
- Reorganize chat layout into a spacious 2-column studio layout.
- Replace indigo bubbles with dark slate speech surfaces and sharp terracotta accents.
- Exercise cards rendered with high-contrast badges, clear exercise titles, and zoomable photos.

### 6. Workout Session Studio (`src/components/WorkoutSession.tsx`)
- Dedicated full-screen training focus mode with high-contrast rep countdowns, rest interval timers, and audio cues.

---

## 4. Technical Architecture & State Strategy

```
┌──────────────────────────────────────────────────────────────────┐
│                      FitGenie State Store                        │
│   (Firebase Auth + Firestore Persistent Storage + Offline Cache) │
└────────────────────────────────┬─────────────────────────────────┘
                                 │
     ┌───────────────────────────┼───────────────────────────┐
     ▼                           ▼                           ▼
┌───────────────┐       ┌─────────────────┐       ┌──────────────────┐
│ DashboardView │       │    VisionLab    │       │   ChatbotView    │
│ (Metrics/KPIs)│       │ (Pose Tracking) │       │ (Visual Coach)   │
└───────────────┘       └─────────────────┘       └──────────────────┘
```

- **Zero Breaking Logic Changes**: All Firestore persistence, Firebase Auth, MediaPipe/TF.js pose calculation math, and Gemini endpoints remain 100% operational.
- **Tailwind Tokens**: Implement consistent custom color tokens in `src/index.css` (`--terracotta`, `--slate-surface`, `--slate-canvas`, `--bone-white`) to ensure cohesive theme application.
- **Verification**: Run `compile_applet` and `lint_applet` to ensure pristine compilation upon user approval.
