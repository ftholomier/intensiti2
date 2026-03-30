# Intensiti - SaaS Digital Signage Solution

## Architecture
- **Backend**: FastAPI + MongoDB (Motor async) + JWT auth
- **Frontend**: React + Tailwind CSS + Shadcn UI + @dnd-kit + react-pdf
- **Deployment**: Docker Compose (MongoDB + Backend + Frontend/Nginx)

## What's Been Implemented

### Core
- JWT auth, Client/Screen/Media/Playlist CRUD, 7 content types, 4 layouts
- DnD, auto-save, scheduling (days/months/dates), rename, duplicate
- Display: transitions, force refresh, custom CSS, eco mode, animation overlay
- 48 themes (8 cat), 12 animations, Flash Info alerts
- Bandeau defilant (speed up to 300s), Weather city/icon size in settings

### Latest Changes (This Session)
- **Text color applied everywhere**: RSS uses settings textColor, PDF bg transparent
- **RSS customizable**: title badge + pause between slides configurable per slide
- **PDF pause**: page_duration already configurable
- **YouTube from media**: Fixed SingleContent to handle media+youtube type
- **Dashboard pro**: Stat cards with navigation, media distribution chart, recent playlists, screen list
- **Media library**: Image/YouTube thumbnails, preview dialog (image/video/PDF/YouTube)
- **Playlist thumbnails**: Real slide content previews instead of grey squares
- **Weather icon size**: New setting field
- **Screen creation**: Default header=100, footer=50

## Test Results
- iteration_11.json: 100% (17/17 backend, 12/12 frontend)

## Credentials
- Superadmin: admin@intensiti.com / admin123
- Client: demo@test.com / demo123

## Prioritized Backlog
### P1 - Live preview in playlist editor, Statistics/reporting module
### P2 - Multi-screen dashboard, Ephemeris frontend, Playlist templates
### P3 - Remote screenshot, Offline cache, 2FA, Granular roles
