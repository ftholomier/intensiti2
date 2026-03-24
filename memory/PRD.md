# Intensiti - SaaS Digital Signage Solution

## Architecture
- **Backend**: FastAPI + MongoDB (Motor async) + JWT auth
- **Frontend**: React + Tailwind CSS + Shadcn UI + @dnd-kit + react-pdf
- **Deployment**: Docker Compose (MongoDB + Backend + Frontend/Nginx)

## What's Been Implemented (Complete)

### Content Types (7 types)
Media, YouTube, QR Code, Countdown, Text (WYSIWYG), RSS, PDF (page-by-page)

### Layouts (4 modes)
100%, 50/50, Full Screen (immersion), 50/50 Full Screen (split-immersion)

### Backend
- JWT auth (superadmin/client), Client CRUD, Screen CRUD + heartbeat + force refresh
- Media upload, Playlist CRUD + duplication + scheduling
- Weather (current + 3-day forecast), RSS proxy (single + batch)
- Display endpoint with scheduling logic + force_refresh + eco mode data
- Settings: colors, sizes, logo, default_transition, theme_css (separate), custom_css, wysiwyg sizes, footer/rss items, ticker toggles, weather_city, eco_mode_enabled/start/end, selected_theme_id, selected_animation_id
- Flash alerts: CRUD + list + dismiss
- Ephemeris

### Frontend
- Role-based dashboard, Client management
- Screen management + force refresh
- Media library + YouTube URLs
- Playlist Editor (DnD, 7 types, 50/50 split, auto-save, WYSIWYG 10 lines)
- Playlist Scheduling (dates, days, months) + Rename
- Bandeau defilant (dedicated page)
- **Flash Info** (NEW): Send/dismiss/history alerts shown fullscreen on displays
- **Themes** (48 themes, 8 categories) + **12 animations** (visible, professional)
- **Settings**: Logo, Meteo city, Colors, Sizes, Transitions, Mode eco (time range), WYSIWYG sizes, CSS custom (theme CSS hidden)
- **Display**: Seconds 2-digit, weather from settings, theme_css+custom_css injection, eco mode (black screen), #emergent-badge hidden, animation overlay
- Toast: bottom-right

## Docker
- `backend/Dockerfile`, `frontend/Dockerfile`, `docker-compose.yml`
- Frontend Nginx proxies /api/ to backend

## Test Results
- iteration_9.json: 100% (17/17 backend, 11/11 frontend)

## Credentials
- Superadmin: admin@intensiti.com / admin123
- Client: demo@test.com / demo123

## Prioritized Backlog
### P1
- Live preview in playlist editor
- Statistics/reporting module
- Heartbeat monitoring + alerts

### P2
- Multi-screen dashboard, Ephemeris frontend
- Playlist templates, Screen groups

### P3
- Remote screenshot, Offline cache, 2FA, Export/import, Granular roles
