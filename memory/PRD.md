# Intensiti - SaaS Digital Signage Solution

## Architecture
- **Backend**: FastAPI + MongoDB (Motor async) + JWT auth
- **Frontend**: React + Tailwind CSS + Shadcn UI + @dnd-kit + react-pdf

## What's Been Implemented (Complete)

### Content Types (7 types)
Media, YouTube, QR Code, Countdown, Text (WYSIWYG), RSS, PDF (page-by-page)

### Layouts (4 modes)
100%, 50/50, Full Screen (immersion), 50/50 Full Screen (split-immersion)

### Backend
- JWT auth (superadmin/client), Client CRUD, Screen CRUD + heartbeat + force refresh (flag clear)
- Media upload (images, videos, PDFs, YouTube URLs), Playlist CRUD + duplication + scheduling (day/month/date)
- Weather (current + 3-day forecast), RSS proxy (single + batch)
- Display endpoint with scheduling logic + force_refresh
- Settings: colors, sizes, logo, default_transition, custom_css, wysiwyg_size_* (6 levels), footer items, rss_items, ticker_speed/text/rss toggles
- Flash alerts, Ephemeris

### Frontend
- Role-based dashboard, Client management (Super Admin)
- Screen management + force refresh button
- Media library + YouTube URLs
- **Playlist Editor** (full-width 95vw popups):
  - DnD, 7 types, 50/50 split + 50/50 Full Screen (both with independent L/R pickers)
  - Auto-save on every action (add/edit/delete/toggle/reorder/rename)
  - WYSIWYG 10 lines (250px), font sizes: Petit→Enorme
- **Playlist Scheduling**: dates, days (Lun-Dim), months (Jan-Dec)
- **Rename playlist**: pencil icon on list page + inline rename in editor (onBlur auto-save)
- **Bandeau defilant** (dedicated page): speed, text toggle, RSS toggle
- **Settings**: colors, sizes, logo, transition (4 types), WYSIWYG font sizes (6 levels px), custom CSS textarea, preview
- **Display**: slides advance (useMemo), transitions, force refresh, custom CSS injection, font size CSS mapping, split-immersion
- Toast: bottom-right

## Test Results (March 18, 2026)
- iteration_6.json: 100% (12/12 backend, 100% frontend)

## Credentials
- Superadmin: admin@intensiti.com / admin123
- Client: demo@test.com / demo123

## Prioritized Backlog
### P1
- Statistics/reporting, Flash Info, Heartbeat monitoring + alerts, Ephemeris frontend

### P2
- Eco mode, Remote screenshot, Offline cache, 2FA, Screen groups, Export/import, Granular roles
