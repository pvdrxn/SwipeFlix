# SwipeFlix - Agent Instructions

## Important Rules
- **Always confirm with the user before importing any new packages or libraries into the project.**

## Tech Stack
- **Frontend**: React Native + Expo (JavaScript)
- **Backend**: Django + Django REST Framework (Python)
- **Database**: PostgreSQL
- **Auth**: JWT via djangorestframework-simplejwt

## Developer Commands

### Frontend
```bash
cd frontend
npm start                    # Run Expo dev server
npm run android              # Run on Android
npm run ios                 # Run on iOS
```

### Backend
```bash
cd backend
venv\Scripts\activate       # Activate virtualenv (Windows)
python manage.py migrate   # Run migrations
python manage.py runserver # Start Django server
```

## Environment Variables

| File | Variable | Purpose |
|------|----------|---------|
| `frontend/.env` | `EXPO_PUBLIC_TMDB_API_KEY` | TMDB API key for Expo |
| `backend/.env` | `API_KEY` | TMDB API key for Django |
| `backend/.env` | `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT` | PostgreSQL config |

## Project Structure
- `frontend/src/screens/` - Screen components (Login, Register, Home, category screens)
- `frontend/src/services/` - API client logic (tmdb.js, api.js)
- `frontend/src/navigation/` - React Navigation config
- `frontend/src/context/` - Auth context
- `backend/api/` - Django app (models, views, serializers)
- `backend/config/` - Django settings

## TMDB Integration
The frontend calls TMDB directly using `src/services/tmdb.js`:
- `fetchPopularMovies()` → `/movie/popular`
- `fetchTrendingMovies()` → `/trending/movie/{day|week}`
- `fetchTopRatedMovies()` → `/movie/top_rated`
- `fetchUpcomingMovies()` → `/movie/upcoming`

## Current Feature Status
- Bottom tabs created: Popular, Trending, Top Rated, Upcoming
- TMDB service created with fetch functions for all categories
- Category screens wired to TMDB endpoints
- Swipe UI pending

See `.cursor/project_builder.md` for detailed feature history and task list.