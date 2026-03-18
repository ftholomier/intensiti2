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
- Layout modes: 100%, 50/50 split (dual content), Immersion (fullscreen)
- 50/50 split: independent content pickers for left/right sides (any type each)
- Fit modes: Ajuster (contain) / Remplir (cover)
- Content types: Media, QR Code, Countdown, Text (WYSIWYG), YouTube, RSS
- Flash alerts
- Client settings (colors, logo, footer text, ticker speed, RSS feeds)
- Drag & drop slide reordering
- Per-slide scheduling with calendar + time pickers
- Playlist scheduling: date range, day-of-week (Lun-Dim), month (Jan-Dec)
- Multiple RSS feeds in footer ticker
- RSS slide type for main content area
- Adjustable ticker speed
- Force refresh button on screens
- Playlist duplication
- 3-day weather forecast

## What's Been Implemented

### Backend (All working - 33/33 tests passing)
- JWT authentication (login, token verification)
- User management (super admin creates/suspends/deletes clients)
- Screen CRUD + pairing + heartbeat + force refresh
- Media upload/management (local storage)
- Playlist CRUD with slides + duplication + scheduling (days, months, dates)
- Weather API (current + 3-day forecast)
- RSS feed proxy: GET /api/rss + POST /api/rss/batch (multi-URL)
- Display data endpoint with scheduling logic (auto-selects playlist by day/month)
- Flash alerts
- Client settings (colors, logo, footer items, rss_items, ticker_speed)
- Dashboard stats
- Ephemeris (saint du jour)

### Frontend (All working)
- Login page
- Role-based dashboard (Super Admin / Client)
- Client management (Super Admin)
- Screen management with force refresh button, preview
- Media library with drag/drop upload, YouTube URLs
- Playlist editor with DnD (@dnd-kit), WYSIWYG editor (contentEditable)
- **50/50 Split**: Two independent content pickers (Gauche/Droite), each with own type selector
- **RSS Slide Type**: Display RSS feed titles as rotating full-screen content
- Full slide editing: content, duration, transition, layout, fit mode, scheduling
- Display view with glassmorphism header, 3-day forecast, dynamic ticker speed, multi-RSS
- **Playlist Scheduling**: Dialog with date range, 7 day buttons (Lun-Dim), 12 month buttons (Jan-Dec)
- **Ticker Speed**: Slider control in Settings (Rapide → Lent)
- **Multiple RSS Feeds**: Add/remove/toggle RSS URLs in Settings
- Settings page with 7 color pickers, size controls, footer items, RSS management, logo upload, preview
- Playlist duplication button

## Test Results (March 18, 2026)
- Backend: 100% (33/33 tests passed)
- Frontend: 100% (all features working)
- Test reports: /app/test_reports/iteration_2.json, /app/test_reports/iteration_3.json

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
- PDF Smart rendering support
- Eco mode scheduling (screen on/off times)
- Remote screenshot capture
- Service Worker offline cache
- 2FA authentication
- Screen groups batch management
- Export/import playlists
- More granular user roles and permissions
