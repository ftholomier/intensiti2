# Intensiti - SaaS Digital Signage Solution

## Architecture
- **Backend**: FastAPI + MongoDB (Motor async) + JWT auth
- **Frontend**: React + Tailwind CSS + Shadcn UI + @dnd-kit + react-pdf
- **Media Storage**: Local filesystem (/app/backend/uploads/)
- **Weather**: OpenWeatherMap API

## What's Been Implemented (Complete)

### Content Types (7 types)
Media, YouTube, QR Code, Countdown, Text (WYSIWYG), RSS, PDF (page-by-page)

### Backend Features
- JWT auth (superadmin/client), Client CRUD, Screen CRUD + pairing + heartbeat + force refresh (with flag clear)
- Media upload (images, videos, PDFs, YouTube URLs), Playlist CRUD + duplication + advanced scheduling (day/month/date)
- Weather (current + 3-day forecast), RSS proxy (single + batch), Display with scheduling logic
- Settings: colors, sizes, logo, footer items, rss_items, ticker_speed/text/rss toggles, default_transition
- Flash alerts, Ephemeris

### Frontend Features
- Role-based dashboard, Client management (Super Admin)
- Screen management with force refresh button
- Media library with upload + YouTube URLs
- **Playlist Editor** (full-width 95vw popups):
  - DnD reordering, 7 content types, 50/50 split (independent left/right pickers)
  - Per-slide: duration, transition, layout, fit mode, scheduling
  - WYSIWYG (min 300px), MediaGrid shows ALL types (images, videos, PDFs)
  - **Auto-save**: every slide action auto-saves to API
- **Playlist Scheduling**: dates, 7 day buttons (Lun-Dim), 12 month buttons (Jan-Dec)
- **Bandeau defilant** (dedicated page): speed slider, text items toggle, RSS feeds toggle
- **Settings**: colors, sizes, logo, default_transition (Fondu/Glissement/Aleatoire/Sans), preview
- **Display**: slides advance correctly (useMemo fix), transitions, force refresh via flag+reload
- **Toast notifications**: bottom-right position

### Display Rendering
- 3-zone: Header (logo, time, date, weather+3d forecast), Main (slides), Footer (ticker)
- Transitions: fade, slide, random, none + default_transition from settings
- Layouts: 100%, 50/50 split, Immersion
- PDF: auto-advance pages with progress indicator
- Dynamic ticker speed, text/RSS independently toggleable
- Force refresh: flag set → display polls → reload

## Test Results (March 18, 2026)
- iteration_5.json: 100% (17/17 backend, 100% frontend)

## Credentials
- Superadmin: admin@intensiti.com / admin123
- Client: demo@test.com / demo123

## Prioritized Backlog
### P1
- Statistics/reporting module, Flash Info improvements, Heartbeat monitoring + email alerts, Ephemeris frontend

### P2
- Eco mode, Remote screenshot, Offline cache, 2FA, Screen groups, Export/import playlists, Granular roles
