# Intensiti - SaaS Digital Signage Solution

## Architecture
- **Backend**: FastAPI + MongoDB (Motor async) + JWT auth
- **Frontend**: React + Tailwind CSS + Shadcn UI + @dnd-kit + react-pdf
- **Deployment**: Docker Compose (MongoDB + Backend + Frontend/Nginx)

## What's Been Implemented (Complete)

### Core
- JWT auth (superadmin/client), Client/Screen/Media/Playlist CRUD
- 7 content types, 4 layouts, DnD, auto-save, scheduling
- Display page with transitions, force refresh, custom CSS injection
- 48 themes (8 categories), 12 animations (new set: ruban, nebuleuse, flux, prisme, aurore, maille, horizon)
- Flash Info alerts, Mode eco (time range), Weather city in settings
- Bandeau defilant with speed up to 300s
- Theme colors populate Settings for custom modifications (no !important CSS overrides)
- Default palette: Onyx. Default sizes: time=32, date=22, weather=32, footer=22, header=100, footer=50
- Default WYSIWYG: small=25, normal=40, medium=60, large=75, xlarge=90, huge=130
- #emergent-badge hidden, crypto.randomUUID() fully replaced

## Key Fixes (Latest Session)
- Theme CSS no longer uses !important → settings colors apply correctly on Display
- Eco mode saves default times (22:00-07:00) when toggled ON
- Settings.up() uses functional state update (prev => ...)

## Test Results
- iteration_10.json: 100% (12/12 backend, 10/10 frontend)

## Credentials
- Superadmin: admin@intensiti.com / admin123
- Client: demo@test.com / demo123

## Prioritized Backlog
### P1
- Live preview in playlist editor
- Statistics/reporting module

### P2
- Multi-screen dashboard, Ephemeris frontend, Playlist templates

### P3
- Remote screenshot, Offline cache, 2FA, Granular roles
