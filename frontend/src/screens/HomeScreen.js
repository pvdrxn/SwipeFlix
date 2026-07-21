import React, { useState, useEffect, useRef, useCallback, useContext, useMemo } from "react";
import Animated, { useSharedValue, withTiming, withRepeat, useAnimatedStyle, makeMutable, cancelAnimation, interpolate as reInterpolate } from "react-native-reanimated";
import { Pressable, StyleSheet, Text, View, FlatList, ScrollView, RefreshControl, TextInput } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "../theme";
import { MovieCard } from "../components/MovieCard";
import {
  fetchPopularMovies,
  fetchTrendingMovies,
  fetchTopRatedMovies,
  fetchUpcomingMovies,
  fetchGenres,
  searchMovies,
  discoverMovies,
  fetchMovieRecommendations,
} from "../services/tmdb";
import { getWatchedPicks, subscribeWatched, subscribePicks, getPicks } from "../api/picksApi";
import { LanguageContext } from "../context/LanguageContext";

const CATEGORIES = [
  { key: "popular", titleKey: "popular", fetchFn: fetchPopularMovies },
  { key: "trending", titleKey: "trending", fetchFn: fetchTrendingMovies },
  { key: "top_rated", titleKey: "topRated", fetchFn: fetchTopRatedMovies },
  { key: "upcoming", titleKey: "upcoming", fetchFn: fetchUpcomingMovies },
];

export function HomeScreen() {
  const { language, t } = useContext(LanguageContext);
  const { colors } = useTheme();
  const navigation = useNavigation();
  const [categoryData, setCategoryData] = useState({});
  const [watchedIds, setWatchedIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState(null);
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [minRating, setMinRating] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [recommendedMovies, setRecommendedMovies] = useState([]);
  const [recommendedFromMovie, setRecommendedFromMovie] = useState(null);

  const debounceRef = useRef(null);
  const rotation = useSharedValue(0);
  const filterAnim = useSharedValue(0);
  const scaleAnims = useRef({});

  const getScaleAnim = (id) => {
    if (!scaleAnims.current[id]) {
      scaleAnims.current[id] = makeMutable(1);
    }
    return scaleAnims.current[id];
  };

  const toggleFilters = () => {
    const expanding = !showFilters;
    setShowFilters(expanding);
    filterAnim.value = withTiming(expanding ? 100 : 0, { duration: 450 });
  };

  const fetchWatched = async () => {
    try {
      const watched = await getWatchedPicks();
      setWatchedIds(new Set(watched.map(w => Number(w.tmdb_id))));
    } catch (err) {
      console.warn("Failed to fetch watched:", err.message);
    }
  };

  const fetchRecommendations = async () => {
    try {
      const liked = await getPicks({ choice: "liked" });
      if (!liked || liked.length === 0) {
        setRecommendedMovies([]);
        setRecommendedFromMovie(null);
        return;
      }
      const lastLiked = liked[0];
      const data = await fetchMovieRecommendations(lastLiked.tmdb_id);
      if (data.results && data.results.length > 0) {
        setRecommendedMovies(data.results);
        setRecommendedFromMovie(lastLiked);
      } else {
        setRecommendedMovies([]);
        setRecommendedFromMovie(null);
      }
    } catch (err) {
      console.warn("Failed to fetch recommendations:", err.message);
      setRecommendedMovies([]);
      setRecommendedFromMovie(null);
    }
  };

  const fetchAllCategories = async () => {
    try {
      const results = await Promise.all(
        CATEGORIES.map(async (category) => {
          const data = await category.fetchFn();
          return { [category.key]: data.results || [] };
        })
      );
      const merged = Object.assign({}, ...results);
      setCategoryData(merged);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
      cancelAnimation(rotation);
      rotation.value = 0;
    }
  };

  useEffect(() => {
    fetchAllCategories();
    fetchWatched();
    fetchRecommendations();
    fetchGenres().then((data) => setGenres(data.genres || [])).catch(() => {});
  }, [language]);

  useEffect(() => {
    const unsubWatched = subscribeWatched(fetchWatched);
    const unsubPicks = subscribePicks(fetchRecommendations);
    return () => {
      unsubWatched();
      unsubPicks();
    };
  }, []);

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    setError(null);
    rotation.value = withRepeat(withTiming(1, { duration: 1000 }), -1, false);
    fetchAllCategories();
  };

  const rotationStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${reInterpolate(rotation.value, [0, 1], [0, 360])}deg` }],
  }));

  const filterPanelStyle = useAnimatedStyle(() => ({
    height: filterAnim.value,
    overflow: "hidden",
  }));

  const filterContentStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: reInterpolate(filterAnim.value, [0, 100], [-100, 0]) }],
  }));

  const doSearch = useCallback(async (q, genreId, sy, ey, rating) => {
    if (!q.trim() && !genreId && !sy && !ey && !rating) {
      setSearchResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      let results;
      if (!q.trim()) {
        const data = await discoverMovies({ genreId, startYear: sy || undefined, endYear: ey || undefined, rating: rating || undefined });
        results = data.results || [];
      } else {
        const data = await searchMovies(q.trim(), { page: 1 });
        results = data.results || [];
        if (genreId) {
          results = results.filter((m) => m.genre_ids?.includes(genreId));
        }
        if (sy) {
          results = results.filter((m) => m.release_date && m.release_date >= `${sy}-01-01`);
        }
        if (ey) {
          results = results.filter((m) => m.release_date && m.release_date <= `${ey}-12-31`);
        }
        if (rating) {
          results = results.filter((m) => m.vote_average != null && m.vote_average >= Number(rating));
        }
      }
      setSearchResults(results);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleSearch = (text) => {
    setQuery(text);
  };

  const handleGenreSelect = (genreId) => {
    const prevId = selectedGenre;
    setSelectedGenre((prev) => (genreId === prev ? null : genreId));
    if (prevId && scaleAnims.current[prevId]) {
      scaleAnims.current[prevId].value = withTiming(1, { duration: 300 });
    }
    if (genreId !== prevId) {
      getScaleAnim(genreId).value = withTiming(1.05, { duration: 300 });
    }
  };

  const clearSearch = () => {
    setQuery("");
    setSearchResults([]);
    setSearching(false);
    setSelectedGenre(null);
    setStartYear("");
    setEndYear("");
    setMinRating("");
  };

  useEffect(() => {
    const yearValid = (v) => !v || /^\d{4}$/.test(v);
    const ratingValid = (v) => !v || /^\d(\.\d)?$/.test(v);
    if (!yearValid(startYear) || !yearValid(endYear) || !ratingValid(minRating)) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(query, selectedGenre, startYear, endYear, minRating);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, selectedGenre, startYear, endYear, minRating]);

  const numColumns = 2;
  const columnPadding = 8;

  const styles = useMemo(() => StyleSheet.create({
  root: { flex: 1 },
  container: { flex: 1, backgroundColor: colors.bg.primary },
  searchContainer: {
    paddingTop: 55,
    paddingBottom: 8,
    backgroundColor: colors.bg.primary,
    zIndex: 10,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg.section,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 15,
    marginLeft: 8,
    padding: 0,
  },
  filterToggle: {
    marginLeft: 8,
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.bg.card,
    justifyContent: "center",
    alignItems: "center",
  },
  filterRow: {
    marginTop: 8,
  },
  filterContent: {
    paddingHorizontal: 12,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.bg.card,
    marginRight: 8,
    borderWidth: 1,
  },
  filterChipActive: {
    backgroundColor: colors.text.primary,
  },
  filterChipText: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: colors.bg.primary,
    fontWeight: "600",
  },
  filterInputsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingHorizontal: 12,
    gap: 6,
  },
  filterInputGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.bg.elevated,
    borderRadius: 8,
    flex: 1,
    height: 42,
    paddingHorizontal: 8,
  },
  filterInput: {
    flex: 1,
    color: colors.text.primary,
    fontSize: 14,
    padding: 0,
    paddingLeft: 4,
    textAlign: "center",
  },
  content: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: colors.text.tertiary, fontSize: 32, marginBottom: 8 },
  statusText: { color: colors.text.tertiary, fontSize: 16 },
  error: { color: colors.accentSecondary, fontSize: 16, marginBottom: 16 },
  retryButton: { backgroundColor: colors.bg.elevated, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  retryText: { color: colors.text.primary, fontSize: 16, fontWeight: "600" },
  scrollContent: { paddingTop: 8, paddingBottom: 100 },
  section: { marginBottom: 24 },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  sectionTitleBar: {
    width: 4,
    height: 18,
    borderRadius: 2,
    backgroundColor: colors.accent,
    marginRight: 8,
  },
  sectionTitle: { color: colors.text.primary, fontSize: 20, fontWeight: "700" },
  sectionList: { paddingHorizontal: 6 },
  searchResultsContent: { paddingTop: 8, paddingHorizontal: 4 },
  movieItem: { padding: 4 },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingTop: 60 },
  emptyText: { color: colors.text.tertiary, fontSize: 16 },
}), [colors]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <View style={styles.container}>
        <View style={styles.searchContainer}>
          <View style={styles.searchRow}>
            <View style={styles.searchBar}>
              <Feather name="search" size={18} color={colors.accent} />
              <TextInput
                style={styles.searchInput}
                placeholder={t("home.searchPlaceholder")}
                placeholderTextColor={colors.text.tertiary}
                value={query}
                onChangeText={handleSearch}
              />
              {query.length > 0 && (
                <Pressable onPress={clearSearch} hitSlop={8}>
                  <Feather name="x-circle" size={18} color={colors.text.tertiary} />
                </Pressable>
              )}
            </View>
            <Pressable onPress={toggleFilters} style={styles.filterToggle}>
              <Feather name="sliders" size={24} color={colors.accent} />
            </Pressable>
          </View>
          <Animated.View style={filterPanelStyle}>
          <Animated.View style={filterContentStyle}>
          {genres.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
              {genres.map((g) => {
                const active = selectedGenre === g.id;
                return (
                  <Animated.View key={g.id} style={{ transform: [{ scale: getScaleAnim(g.id) }] }}>
                  <Pressable
                    onPress={() => handleGenreSelect(g.id)}
                    style={[styles.filterChip, active && { backgroundColor: colors.genreById[g.id] || colors.text.primary }, { borderColor: colors.genreById[g.id] || colors.text.tertiary }]}
                  >
                    <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{g.name}</Text>
                  </Pressable>
                  </Animated.View>
                );
              })}
            </ScrollView>
          )}
          <View style={styles.filterInputsRow}>
              <View style={styles.filterInputGroup}>
                <Feather name="calendar" size={14} color={colors.accent} />
                <TextInput
                  style={styles.filterInput}
                  placeholder={t("home.filterFrom")}
                  placeholderTextColor={colors.text.muted}
                  value={startYear}
                  onChangeText={(v) => setStartYear(v.replace(/[^0-9]/g, ""))}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
              <View style={styles.filterInputGroup}>
                <Feather name="calendar" size={14} color={colors.accent} />
                <TextInput
                  style={styles.filterInput}
                  placeholder={t("home.filterTo")}
                  placeholderTextColor={colors.text.muted}
                  value={endYear}
                  onChangeText={(v) => setEndYear(v.replace(/[^0-9]/g, ""))}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
              <View style={styles.filterInputGroup}>
                <Feather name="star" size={14} color={colors.accent} />
                <TextInput
                  style={styles.filterInput}
                  placeholder={t("home.filterRating")}
                  placeholderTextColor={colors.text.muted}
                  value={minRating}
                  onChangeText={(v) => setMinRating(v.replace(/[^0-9.]/g, ""))}
                  keyboardType="decimal-pad"
                  maxLength={3}
                />
              </View>
            </View>
          </Animated.View>
          </Animated.View>
        </View>

        {query.length > 0 || selectedGenre || startYear || endYear || minRating ? (
          <FlatList
            data={searchResults}
            numColumns={numColumns}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={[styles.searchResultsContent, { paddingBottom: 100 }]}
            renderItem={({ item }) => (
              <View style={[styles.movieItem, { width: `${100 / numColumns}%` }]}>
                <MovieCard movie={item} watched={watchedIds.has(Number(item.id))} onPress={(movie) => navigation.navigate("MovieDetails", { movieId: movie.id, initialMovieData: movie })} />
              </View>
            )}
            ListEmptyComponent={
              searching ? null : (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>{t("home.noMoviesFound")}</Text>
                </View>
              )
            }
          />
        ) : (loading || refreshing) && !error ? (
          <View style={styles.content}>
            <Animated.Text style={[styles.loadingText, rotationStyle]}>↻</Animated.Text>
            <Text style={styles.statusText}>{refreshing ? t("home.refreshing") : t("home.loading")}</Text>
          </View>
        ) : error ? (
          <View style={styles.content}>
            <Text style={styles.error}>{t("home.error")}{error}</Text>
            <Pressable onPress={handleRefresh} style={styles.retryButton}>
              <Text style={styles.retryText}>{t("home.retry")}</Text>
            </Pressable>
          </View>
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.text.primary} colors={[colors.text.primary]} />
            }
          >
            {CATEGORIES.slice(0, 2).map((category) => (
              <View key={category.key} style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.sectionTitleBar} />
                  <Text style={styles.sectionTitle}>{t(`categories.${category.titleKey}`)}</Text>
                </View>
                <FlatList
                  data={categoryData[category.key] || []}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <MovieCard movie={item} watched={watchedIds.has(Number(item.id))} onPress={(movie) => navigation.navigate("MovieDetails", { movieId: movie.id, initialMovieData: movie })} />
                  )}
                  contentContainerStyle={styles.sectionList}
                />
              </View>
            ))}
            {recommendedFromMovie && recommendedMovies.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.sectionTitleBar} />
                  <Text style={styles.sectionTitle} numberOfLines={1}>{t("home.becauseYouLiked", { title: recommendedFromMovie.title })}</Text>
                </View>
                <FlatList
                  data={recommendedMovies}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <MovieCard movie={item} watched={watchedIds.has(Number(item.id))} onPress={(movie) => navigation.navigate("MovieDetails", { movieId: movie.id, initialMovieData: movie })} />
                  )}
                  contentContainerStyle={styles.sectionList}
                />
              </View>
            )}
            {CATEGORIES.slice(2).map((category) => (
              <View key={category.key} style={styles.section}>
                <View style={styles.sectionTitleRow}>
                  <View style={styles.sectionTitleBar} />
                  <Text style={styles.sectionTitle}>{t(`categories.${category.titleKey}`)}</Text>
                </View>
                <FlatList
                  data={categoryData[category.key] || []}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id.toString()}
                  renderItem={({ item }) => (
                    <MovieCard movie={item} watched={watchedIds.has(Number(item.id))} onPress={(movie) => navigation.navigate("MovieDetails", { movieId: movie.id, initialMovieData: movie })} />
                  )}
                  contentContainerStyle={styles.sectionList}
                />
              </View>
            ))}
          </ScrollView>
        )}
      </View>
    </GestureHandlerRootView>
  );
}
