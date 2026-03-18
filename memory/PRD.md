# Intensiti - SaaS Digital Signage Solution

## Original Problem Statement
SaaS solution for professional digital signage - browser-based full-screen display management with 2-level account architecture (Super Admin + Client), screen fleet management, media library, playlists with transitions, 3-zone display view, weather integration, flash alerts.

## Architecture
- **Backend**: FastAPI + MongoDB (Motor async) + JWT auth
- **Frontend**: React + Tailwind CSS + Shadcn UI + @dnd-kit + react-pdf
- **Media Storage**: Local filesystem (/app/backend/uploads/)
- **Weather**: OpenWeatherMap API
- **Display**: Full-screen browser-based 3-zone layout

## What's Been Implemented (Complete)

### Content Types (7 types)
1. **Media** (images, videos) - from media library
2. **YouTube** - URL embed
3. **QR Code** - auto-generated from URL
4. **Countdown** - target date/time
5. **Text** - WYSIWYG contentEditable editor
6. **RSS** - Rotating feed titles from URL
7. **PDF** - Page-by-page display with configurable duration per page (react-pdf)

### Backend Features
- JWT authentication (superadmin/client roles)
- Client management (CRUD, quotas, suspension)
- Screen management (CRUD, pairing codes, heartbeat, force refresh)
- Media library (images, videos, PDFs upload + YouTube URLs)
- Playlist CRUD with 7 slide types + duplication
- **Advanced scheduling**: day-of-week (Mon-Sun), month (Jan-Dec), date range
- **Scheduling respects default playlist**: assigned playlist also checked against its own schedule
- Weather API (current + 3-day forecast via OpenWeatherMap)
- RSS feed proxy (single + batch for multiple URLs)
- Display data endpoint with scheduling logic
- Settings: colors, sizes, logo, footer items, RSS items, ticker speed, ticker text/RSS toggles
- Flash alerts, Ephemeris (saint du jour)

### Frontend Features
- Login page with role-based routing
- Super Admin dashboard (clients management)
- Client dashboard (screens, media, playlists, settings)
- **Playlist Editor** (full-width popups 95vw):
  - Drag-and-drop slide reordering (@dnd-kit)
  - 7 content types with dedicated UIs
  - **50/50 Split**: independent Gauche/Droite content pickers (any type each side)
  - Per-slide settings: duration, transition, layout, fit mode
  - Per-slide scheduling (start/end dates)
  - WYSIWYG editor with large editing area (min-h-300px)
  - MediaGrid shows ALL types (images, videos, PDFs)
  - PDF slide: select from media library + configurable page_duration
- **Playlist Scheduling Dialog**: dates, 7 day buttons (Lun-Dim), 12 month buttons (Jan-Dec)
- **Display Page**: 3-zone layout with glassmorphism header, transitions, dynamic ticker
- **Settings**: colors (7), sizes (8), logo, footer text items, RSS feeds (multiple), ticker speed slider, **ticker text/RSS toggles**
- Screen management with force refresh button, preview link
- Playlist duplication

### Display Rendering
- 3-zone layout: Header (logo, time, date, weather+3-day forecast), Main (slides), Footer (ticker)
- Slide transitions: fade, slide, random, none
- Layouts: 100%, 50/50 split (dual content), Immersion (fullscreen, hides header/footer)
- Fit modes: Ajuster (contain), Remplir (cover)
- PDF slides: auto-advance pages with progress indicator
- Dynamic ticker speed from settings
- Ticker text/RSS independently toggleable
- Flash alert overlay

## Test Results (March 18, 2026)
- iteration_2.json: 100% (33/33 backend)
- iteration_3.json: 100% (33/33 backend, all frontend)
- iteration_4.json: 100% (15/15 new features, all frontend)

## Credentials
- Superadmin: admin@intensiti.com / admin123
- Client: demo@test.com / demo123

## Prioritized Backlog
### P1 (Important)
- Statistics and reporting module
- Flash Info alert system improvements
- Heartbeat monitoring + email alerts after 30min offline
- Ephemeris (saint du jour / citations) frontend integration

### P2 (Nice to Have)
- Eco mode scheduling (screen on/off times)
- Remote screenshot capture
- Service Worker offline cache
- 2FA authentication
- Screen groups batch management
- Export/import playlists
- More granular user roles and permissions
