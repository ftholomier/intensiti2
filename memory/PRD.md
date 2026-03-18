# Intensiti - SaaS Digital Signage Solution

## Original Problem Statement
SaaS solution for professional digital signage - browser-based full-screen display management with 2-level account architecture (Super Admin + Client), screen fleet management, media library, playlists with transitions, 3-zone display view, weather integration, flash alerts.

## Architecture
- **Backend**: FastAPI + MongoDB (Motor async) + JWT auth
- **Frontend**: React + Tailwind CSS + Shadcn UI + @dnd-kit
- **Media Storage**: Local filesystem (/app/backend/uploads/)
- **Weather**: OpenWeatherMap API
- **Display**: Full-screen browser-based 3-zone layout

## User Personas
1. **Super Admin**: Manages client accounts, quotas, global monitoring
2. **Client**: Manages screens, media library, playlists, display settings
3. **Screen Viewer**: Passive display device showing content

## Core Requirements (Static)
- 2-level account system (Super Admin + Client)
- Screen management with 6-digit pairing codes
- Media library (images, videos, YouTube URLs)
- Playlist editor with slides (add/edit/delete/duplicate/preview/schedule)
- 3-zone display: Header (logo, time, date, weather), Central (media), Footer (ticker)
- Slide transitions: fade, slide, random
- Layout modes: 100%, 50/50 split, Immersion (fullscreen)
- Fit modes: Ajuster (contain) / Remplir (cover)
- QR Code, Countdown, Text (WYSIWYG), YouTube content types
- Flash alerts
- Client settings (colors, logo, footer text)
- Drag & drop slide reordering
- Scheduling with calendar + time pickers
- RSS feed integration in footer ticker
- Force refresh button on screens
- Playlist duplication
- 3-day weather forecast

## What's Been Implemented

### Backend (All working)
- JWT authentication (login, token verification)
- User management (super admin creates/suspends/deletes clients)
- Screen CRUD + pairing + heartbeat
- Media upload/management (local storage)
- Playlist CRUD with slides + duplication
- Weather API (current + 3-day forecast)
- RSS feed proxy endpoint
- Display data endpoint
- Flash alerts
- Client settings (colors, logo, footer items, RSS URL)
- Dashboard stats
- Ephemeris (saint du jour)
- Force refresh endpoint for screens

### Frontend (All working)
- Login page
- Role-based dashboard (Super Admin / Client)
- Client management (Super Admin)
- Screen management with force refresh button, "Voir l'ecran" preview
- Media library with drag/drop upload, YouTube URLs
- Playlist editor with DnD (@dnd-kit), edit dialog, WYSIWYG (contentEditable)
- Full slide editing: content, duration, transition, layout, fit mode, scheduling
- Display view with glassmorphism header blocks, 3-day forecast, RSS ticker
- Settings page with 7 color pickers, size controls, footer items management, RSS URL, logo upload, preview
- Playlist duplication button

## Test Results (March 18, 2026)
- Backend: 100% (18/18 tests passed)
- Frontend: 100% (all features working)
- Test report: /app/test_reports/iteration_2.json

## Prioritized Backlog
### P0 (Critical - Next)
- PDF Smart rendering support
- Eco mode scheduling (screen on/off times)

### P1 (Important)
- Heartbeat monitoring improvements + email alerts after 30min offline
- Remote screenshot capture
- Service Worker offline cache
- Detailed statistics and reporting module
- Flash Info alert system improvements

### P2 (Nice to Have)
- 2FA authentication (OTP or email)
- Daily auto-refresh scheduling
- Screen groups batch management
- Advanced ephemeris (citations)
- Export/import playlists
- More granular user roles and permissions

## Credentials
- Superadmin: admin@intensiti.com / admin123
- Client: demo@test.com / demo123
