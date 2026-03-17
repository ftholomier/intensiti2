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

## What's Been Implemented (March 17, 2026)
### Backend
- JWT authentication (login, token verification)
- User management (super admin creates/suspends/deletes clients)
- Screen CRUD + pairing + heartbeat
- Media upload/management (local storage)
- Playlist CRUD with slides
- Weather API (OpenWeatherMap)
- Display data endpoint
- Flash alerts
- Client settings (colors, logo, footer text)
- Dashboard stats
- Ephemeris (saint du jour - full French calendar)

### Frontend
- Login page
- Role-based dashboard (Super Admin / Client)
- Client management (Super Admin)
- Screen management with "Voir l'ecran" preview button
- Media library with drag/drop upload, YouTube URLs
- Playlist editor with DnD (@dnd-kit), edit dialog, WYSIWYG
- Full slide editing: content, duration, transition, layout, fit mode, scheduling
- Display view with glassmorphism header blocks, thin CNews-style ticker
- Settings page with color pickers, logo upload, footer text

## Prioritized Backlog
### P0 (Critical - Next)
- PDF Smart rendering support
- Eco mode scheduling (screen on/off times)

### P1 (Important)
- Heartbeat monitoring improvements + email alerts after 30min offline
- Remote screenshot capture
- RSS feed support in footer
- Service Worker offline cache

### P2 (Nice to Have)
- 2FA authentication (OTP or email)
- Daily auto-refresh scheduling
- Screen groups batch management
- Advanced ephemeris (citations)
- Export/import playlists

## Next Tasks
1. Implement PDF Smart rendering in slides
2. Add Eco mode (screen schedule on/off)
3. Improve heartbeat monitoring + offline alerts
4. Add RSS feed parsing for footer text
5. Service Worker for offline cache
