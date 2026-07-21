import React, { useState, useEffect, useCallback, useRef, useContext, useMemo } from "react";
import Animated, { withTiming, makeMutable } from "react-native-reanimated";
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { MovieCard } from "../components/MovieCard";
import { useNavigation } from "@react-navigation/native";
import { getPicks, subscribePicks, subscribeWatched, getWatchedPicks, getFavorites, subscribeFavorites } from "../api/picksApi";
import { useTheme } from "../theme";
import { fetchMovieDetails } from "../services/tmdb";
import { LanguageContext } from "../context/LanguageContext";

const CHIP_ICONS = {
  liked: "thumbs-up",
  pass: "thumbs-down",
  watchlater: "bookmark",
  favorites: "star",
};

const CHIPS = [
  { key: "liked", labelKey: "liked" },
  { key: "pass", labelKey: "disliked" },
  { key: "watchlater", labelKey: "watchLater" },
  { key: "favorites", labelKey: "favorites" },
];

export function LibraryScreen() {
  const { language, t } = useContext(LanguageContext);
  const { colors } = useTheme();
  const navigation = useNavigation();

  const CHIP_COLORS = {
    liked: colors.swipe.save,
    pass: colors.swipe.pass,
    watchlater: colors.swipe.saved,
    favorites: colors.favorite,
  };

  const styles = useMemo(() => StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.bg.primary,
      paddingTop: 50,
    },
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: 16,
      marginBottom: 12,
    },
    title: {
      color: colors.text.primary,
      fontSize: 28,
      fontWeight: "800",
    },
    chipsRow: {
      flexDirection: "row",
      paddingHorizontal: 16,
      marginBottom: 16,
      gap: 8,
    },
    chip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
    },
    chipContent: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    chipText: {
      fontSize: 14,
      fontWeight: "600",
    },
    centered: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
    },
    loadingText: {
      color: colors.text.tertiary,
      fontSize: 16,
    },
    errorText: {
      color: colors.accentSecondary,
      fontSize: 16,
    },
    emptyText: {
      color: colors.text.secondary,
      fontSize: 18,
      fontWeight: "600",
      marginBottom: 8,
    },
    emptySubtext: {
      color: colors.text.tertiary,
      fontSize: 14,
    },
    movieItem: {
      flex: 1,
      paddingHorizontal: 4,
      maxWidth: "50%",
    },
    listContent: {
      paddingHorizontal: 8,
      paddingBottom: 24,
    },
  }), [colors]);

  const [selectedChip, setSelectedChip] = useState("watchlater");
  const [movies, setMovies] = useState([]);
  const [counts, setCounts] = useState({ liked: 0, pass: 0, watchlater: 0, favorites: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchMovies = useCallback(async () => {
    try {
      const [[likedData, passData, watchlaterData, favsData], watchedData] = await Promise.all([
        Promise.all([getPicks({ choice: "liked" }), getPicks({ choice: "pass" }), getPicks({ isSaved: true }), getFavorites()]),
        getWatchedPicks()
      ]);
      setCounts({ liked: likedData.length, pass: passData.length, watchlater: watchlaterData.length, favorites: favsData.length });
      const choiceMap = { liked: likedData, pass: passData, watchlater: watchlaterData, favorites: favsData };
      const data = choiceMap[selectedChip];
      const watchedIds = new Set(watchedData.map(w => Number(w.tmdb_id)));
      let moviesWithWatched = data.map(item => ({
        ...item,
        watched: watchedIds.has(Number(item.tmdb_id))
      }));
      if (language !== "en") {
        const details = await Promise.allSettled(
          moviesWithWatched.map(item =>
            fetchMovieDetails(item.tmdb_id).then(d => ({ id: item.tmdb_id, title: d.title }))
          )
        );
        const titleMap = {};
        details.forEach(r => {
          if (r.status === "fulfilled") titleMap[r.value.id] = r.value.title;
        });
        moviesWithWatched = moviesWithWatched.map(item => ({
          ...item,
          title: titleMap[item.tmdb_id] || item.title,
        }));
      }
      setMovies(moviesWithWatched);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedChip, language]);

  useEffect(() => {
    setLoading(true);
    fetchMovies();
  }, [fetchMovies]);

  useEffect(() => {
    const unsubscribePicks = subscribePicks(() => {
      fetchMovies();
    });
    const unsubscribeWatched = subscribeWatched(() => {
      fetchMovies();
    });
    const unsubscribeFavs = subscribeFavorites(() => {
      fetchMovies();
    });
    return () => {
      unsubscribePicks();
      unsubscribeWatched();
      unsubscribeFavs();
    };
  }, [fetchMovies]);

  const scaleAnims = useRef({});

  const getScaleAnim = (key) => {
    if (!scaleAnims.current[key]) {
      scaleAnims.current[key] = makeMutable(1);
    }
    return scaleAnims.current[key];
  };

  const handleChipPress = (key) => {
    const prev = selectedChip;
    if (prev && scaleAnims.current[prev]) {
      scaleAnims.current[prev].value = withTiming(1, { duration: 200 });
    }
    if (key !== prev) {
      getScaleAnim(key).value = withTiming(1.08, { duration: 200 });
    }
    setSelectedChip(key);
  };

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    fetchMovies();
  };

  const getEmptyMessage = () => {
    if (selectedChip === "liked") return { title: t("library.emptyLikedTitle"), subtitle: t("library.emptyLikedSubtitle") };
    if (selectedChip === "pass") return { title: t("library.emptyPassTitle"), subtitle: t("library.emptyPassSubtitle") };
    if (selectedChip === "watchlater") return { title: t("library.emptyWatchlaterTitle"), subtitle: t("library.emptyWatchlaterSubtitle") };
    return { title: t("library.emptyFavoritesTitle"), subtitle: t("library.emptyFavoritesSubtitle") };
  };

  const emptyMsg = getEmptyMessage();

  const headerTitles = {
    liked: t("alert.liked"),
    pass: t("alert.disliked"),
    watchlater: t("alert.watchLater"),
    favorites: t("alert.favorites"),
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{headerTitles[selectedChip]}</Text>
      </View>
      <View style={styles.chipsRow}>
        {CHIPS.map(chip => {
          const isActive = selectedChip === chip.key;
          const chipColor = CHIP_COLORS[chip.key];
          return (
            <Pressable
              key={chip.key}
              onPress={() => handleChipPress(chip.key)}
            >
              <Animated.View
                style={[
                  styles.chip,
                  {
                    backgroundColor: isActive ? chipColor : colors.bg.elevated,
                    borderColor: isActive ? chipColor : "transparent",
                    borderWidth: 1,
                    transform: [{ scale: getScaleAnim(chip.key) }],
                  },
                ]}
              >
                <View style={styles.chipContent}>
                  <Feather name={CHIP_ICONS[chip.key]} size={14} color={isActive ? "#fff" : colors.text.tertiary} />
                  <Text style={[styles.chipText, { color: isActive ? "#fff" : colors.text.tertiary }]}>
                    {counts[chip.key]}
                  </Text>
                </View>
              </Animated.View>
            </Pressable>
          );
        })}
      </View>
      {loading ? (
        <View style={styles.centered}>
          <Text style={styles.loadingText}>{t("library.loading")}</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : movies.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>{emptyMsg.title}</Text>
          <Text style={styles.emptySubtext}>{emptyMsg.subtitle}</Text>
        </View>
      ) : (
        <FlatList
          data={movies}
          numColumns={2}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.text.primary}
              colors={["#fff"]}
            />
          }
          renderItem={({ item }) => (
            <View style={styles.movieItem}>
              <MovieCard
                movie={{
                  id: item.tmdb_id,
                  title: item.title,
                  poster_path: item.poster_path,
                  vote_average: item.rating,
                }}
                watched={item.watched}
                onPress={(movie) => navigation.navigate("MovieDetails", { movieId: movie.id, initialMovieData: movie })}
              />
            </View>
          )}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
}


