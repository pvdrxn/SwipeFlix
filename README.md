# SwipeFlix

## Overview
SwipeFlix is a cross-platform mobile application for discovering movies through **Tinder-style swiping**. Built with **React Native (Expo)** on the frontend and **Django + Django REST Framework** on the backend.

## Tech Stack
| Layer | Technology |
|-------|-----------|
| **Frontend** | React Native + Expo (JavaScript) |
| **Backend** | Django + Django REST Framework (Python) |
| **Database** | PostgreSQL |
| **Auth** | JWT via djangorestframework-simplejwt |
| **External API** | TMDB (The Movie Database) |

## Project Structure

### `frontend/` (React Native + Expo)
- `src/screens/` — Screen components (Login, Register, Home, Pick, Library, MovieDetails, Settings)
- `src/components/` — Reusable UI (MovieCard, AnimatedScreen)
- `src/services/` — API client logic (`tmdb.js`, `api.js`)
- `src/navigation/` — React Navigation config (tabs + stack)
- `src/context/` — Auth & Language context providers
- `src/i18n/` — Multi-language support (English, Spanish, Russian)
- `src/auth/` — Authentication logic
- `src/theme.js` — App theming

### `backend/` (Django + DRF)
- `api/` — Django app (models, views, serializers, urls)
- `config/` — Django settings
- `manage.py` — Django management script

## Features
- Swipe-based movie discovery (left to reject, right/save to favorites)
- Browse by categories: Popular, Trending, Top Rated, Upcoming
- Movie details with trailers
- Library with favorites and list filtering
- JWT authentication (register/login)
- Multi-language support (EN, ES, RU)
- Settings screen

## Commands

### Frontend
```bash
cd frontend
npm start           # Start Expo dev server
npm run android     # Run on Android
npm run ios         # Run on iOS
```

### Backend
```bash
cd backend
venv\Scripts\activate         # Activate virtualenv (Windows)
python manage.py migrate      # Run migrations
python manage.py runserver    # Start Django server
```
