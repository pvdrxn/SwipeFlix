import { http } from "./http";

const pickListeners = [];
const watchedListeners = [];
const favoriteListeners = [];

export function subscribePicks(callback) {
  pickListeners.push(callback);
  return () => {
    const idx = pickListeners.indexOf(callback);
    if (idx > -1) pickListeners.splice(idx, 1);
  };
}

export function subscribeWatched(callback) {
  watchedListeners.push(callback);
  return () => {
    const idx = watchedListeners.indexOf(callback);
    if (idx > -1) watchedListeners.splice(idx, 1);
  };
}

export function subscribeFavorites(callback) {
  favoriteListeners.push(callback);
  return () => {
    const idx = favoriteListeners.indexOf(callback);
    if (idx > -1) favoriteListeners.splice(idx, 1);
  };
}

function notifyPickListeners() {
  pickListeners.forEach(cb => cb());
}

function notifyWatchedListeners() {
  watchedListeners.forEach(cb => cb());
}

function notifyFavoriteListeners() {
  favoriteListeners.forEach(cb => cb());
}

export async function addPick({ tmdbId, title, posterPath, rating, choice, is_saved, notify = true }) {
  const payload = {
    tmdb_id: tmdbId,
    title,
  };
  if (choice != null) payload.choice = choice;
  if (is_saved != null) payload.is_saved = is_saved;
  if (posterPath) {
    payload.poster_path = posterPath.startsWith("http") ? posterPath : `https://image.tmdb.org/t/p/w500${posterPath}`;
  }
  if (rating != null && typeof rating === "number" && !isNaN(rating)) {
    payload.rating = Math.round(rating * 10) / 10;
  }
  const { data } = await http.post("/api/picks/", payload);
  if (notify) {
    notifyPickListeners();
  }
  return data;
}

export async function getPicks(filters = null) {
  const params = {};
  if (filters) {
    if (filters.choice) params.choice = filters.choice;
    if (filters.isSaved) params.is_saved = "true";
  }
  const { data } = await http.get("/api/picks/", { params });
  return data;
}

export async function toggleSave({ tmdbId, title, posterPath, rating }) {
  const payload = { tmdb_id: tmdbId, title };
  if (posterPath) {
    payload.poster_path = posterPath.startsWith("http") ? posterPath : `https://image.tmdb.org/t/p/w500${posterPath}`;
  }
  if (rating != null && typeof rating === "number" && !isNaN(rating)) {
    payload.rating = Math.round(rating * 10) / 10;
  }
  const { data } = await http.post("/api/picks/toggle_save/", payload);
  notifyPickListeners();
  return data;
}

export async function deletePick(id, { notify = true } = {}) {
  const { data } = await http.delete(`/api/picks/${id}/`);
  if (notify) {
    notifyPickListeners();
  }
  return data;
}

export async function toggleWatched(id) {
  const { data } = await http.post(`/api/picks/${id}/toggle_watched/`);
  notifyWatchedListeners();
  return data;
}

export async function getWatchedPicks() {
  const { data } = await http.get("/api/picks/watched/");
  return data;
}

export async function clearLiked() {
  const { data } = await http.post("/api/picks/clear_liked/");
  notifyPickListeners();
  return data;
}

export async function clearDisliked() {
  const { data } = await http.post("/api/picks/clear_disliked/");
  notifyPickListeners();
  return data;
}

export async function clearSaved() {
  const { data } = await http.post("/api/picks/clear_saved/");
  notifyPickListeners();
  return data;
}

export async function clearAll() {
  const { data } = await http.post("/api/picks/clear_all/");
  notifyPickListeners();
  return data;
}

export async function toggleFavorite({ tmdbId, title, posterPath, rating }) {
  const payload = { tmdb_id: tmdbId, title };
  if (posterPath) {
    payload.poster_path = posterPath.startsWith("http") ? posterPath : `https://image.tmdb.org/t/p/w500${posterPath}`;
  }
  if (rating != null && typeof rating === "number" && !isNaN(rating)) {
    payload.rating = Math.round(rating * 10) / 10;
  }
  const { data } = await http.post("/api/picks/toggle_favorite/", payload);
  notifyFavoriteListeners();
  return data;
}

export async function getFavorites() {
  const { data } = await http.get("/api/picks/favorites/");
  return data;
}

export async function clearFavorites() {
  const { data } = await http.post("/api/picks/clear_favorites/");
  notifyFavoriteListeners();
  return data;
}