const TMDB_BASE_URL = "https://api.themoviedb.org/3";

const LANGUAGE_MAP = { en: "en-US", es: "es-ES", ru: "ru-RU" };
let currentLang = "en-US";

export function setTmdbLanguage(lang) {
  currentLang = LANGUAGE_MAP[lang] || "en-US";
}

function getTmdbApiKey() {
  return (
    process.env.EXPO_PUBLIC_TMDB_API_KEY ||
    process.env.EXPO_PUBLIC_API_KEY ||
    process.env.TMDB_API_KEY ||
    process.env.API_KEY
  );
}

function toQueryString(params) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    sp.set(key, String(value));
  });
  return sp.toString();
}

async function tmdbFetch(path, params = {}) {
  const apiKey = getTmdbApiKey();
  if (!apiKey) {
    throw new Error(
      "TMDB API key missing. Set EXPO_PUBLIC_TMDB_API_KEY in your frontend env."
    );
  }

  const query = toQueryString({
    api_key: apiKey,
    language: currentLang,
    include_adult: false,
    ...params,
  });

  const url = `${TMDB_BASE_URL}${path}?${query}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    let details = "";
    try {
      const body = await res.json();
      details = body?.status_message ? ` (${body.status_message})` : "";
    } catch {
      // ignore JSON parse errors; keep a generic message
    }
    throw new Error(`TMDB request failed: ${res.status} ${res.statusText}${details}`);
  }

  const data = await res.json();
  if (data.results && Array.isArray(data.results)) {
    data.results = data.results.filter(m => !m.adult);
  }
  return data;
}

export async function fetchPopularMovies({ page = 1 } = {}) {
  return tmdbFetch("/movie/popular", { page });
}

export async function fetchTrendingMovies({ timeWindow = "day", page = 1 } = {}) {
  return tmdbFetch(`/trending/movie/${timeWindow}`, { page });
}

export async function fetchTopRatedMovies({ page = 1 } = {}) {
  return tmdbFetch("/movie/top_rated", { page });
}

export async function fetchUpcomingMovies({ page = 1 } = {}) {
  return tmdbFetch("/movie/upcoming", { page });
}

export async function fetchMovieDetails(movieId) {
  if (!movieId) throw new Error("movieId is required");
  return tmdbFetch(`/movie/${movieId}`);
}

export async function fetchMovieExternalIds(movieId) {
  if (!movieId) throw new Error("movieId is required");
  return tmdbFetch(`/movie/${movieId}/external_ids`);
}

export async function fetchMovieReleaseDates(movieId) {
  if (!movieId) throw new Error("movieId is required");
  return tmdbFetch(`/movie/${movieId}/release_dates`);
}

export async function fetchMovieCredits(movieId) {
  if (!movieId) throw new Error("movieId is required");
  return tmdbFetch(`/movie/${movieId}/credits`);
}

export async function fetchMovieWatchProviders(movieId) {
  if (!movieId) throw new Error("movieId is required");
  return tmdbFetch(`/movie/${movieId}/watch/providers`);
}

export async function fetchMovieVideos(movieId) {
  if (!movieId) throw new Error("movieId is required");
  return tmdbFetch(`/movie/${movieId}/videos`);
}

export async function fetchMovieTrailer(movieId) {
  if (!movieId) throw new Error("movieId is required");
  const data = await fetchMovieVideos(movieId);
  const trailer = data.results?.find(
    (v) => v.type === "Trailer" && v.site === "YouTube"
  );
  return trailer || null;
}

export async function fetchGenres() {
  return tmdbFetch("/genre/movie/list");
}

export async function discoverMovies({ genreId, startYear, endYear, rating, page = 1 } = {}) {
  const params = { page };
  if (genreId) params.with_genres = genreId;
  if (startYear) params["primary_release_date.gte"] = `${startYear}-01-01`;
  if (endYear) params["primary_release_date.lte"] = `${endYear}-12-31`;
  if (rating) params["vote_average.gte"] = rating;
  return tmdbFetch("/discover/movie", params);
}

export async function searchMovies(query, { page = 1 } = {}) {
  if (!query) return { results: [] };
  return tmdbFetch("/search/movie", { query, page });
}