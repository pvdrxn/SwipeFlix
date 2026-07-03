import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, StyleSheet, FlatList, RefreshControl, Pressable, Animated } from "react-native";
import { MovieCard } from "../components/MovieCard";
import { useNavigation } from "@react-navigation/native";
import { getPicks, subscribePicks, subscribeWatched, getWatchedPicks } from "../api/picksApi";
import { colors } from "../theme";

const CHIP_COLORS = {
  liked: colors.swipe.save,
  pass: colors.swipe.pass,
  saved: colors.swipe.saved,
};

const CHIPS = [
  { key: "liked", label: "Liked" },
  { key: "pass", label: "Disliked" },
  { key: "saved", label: "Saved" },
];

export function LibraryScreen() {
  const navigation = useNavigation();
  const [selectedChip, setSelectedChip] = useState("saved");
  const [movies, setMovies] = useState([]);
  const [counts, setCounts] = useState({ liked: 0, pass: 0, saved: 0 });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchMovies = useCallback(async () => {
    try {
      const [[likedData, passData, savedData], watchedData] = await Promise.all([
        Promise.all([getPicks({ choice: "liked" }), getPicks({ choice: "pass" }), getPicks({ isSaved: true })]),
        getWatchedPicks()
      ]);
      setCounts({ liked: likedData.length, pass: passData.length, saved: savedData.length });
      const choiceMap = { liked: likedData, pass: passData, saved: savedData };
      const data = choiceMap[selectedChip];
      const watchedIds = new Set(watchedData.map(w => Number(w.tmdb_id)));
      const moviesWithWatched = data.map(item => ({
        ...item,
        watched: watchedIds.has(Number(item.tmdb_id))
      }));
      setMovies(moviesWithWatched);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedChip]);

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
    return () => {
      unsubscribePicks();
      unsubscribeWatched();
    };
  }, [fetchMovies]);

  const scaleAnims = useRef({});

  const getScaleAnim = (key) => {
    if (!scaleAnims.current[key]) {
      scaleAnims.current[key] = new Animated.Value(1);
    }
    return scaleAnims.current[key];
  };

  const handleChipPress = (key) => {
    const prev = selectedChip;
    if (prev && scaleAnims.current[prev]) {
      Animated.timing(scaleAnims.current[prev], {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    if (key !== prev) {
      Animated.timing(getScaleAnim(key), {
        toValue: 1.08,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
    setSelectedChip(key);
  };

  const handleRefresh = () => {
    if (refreshing) return;
    setRefreshing(true);
    fetchMovies();
  };

  const getEmptyMessage = () => {
    if (selectedChip === "liked") return { title: "No liked movies", subtitle: "Like movies from Movie Details" };
    if (selectedChip === "pass") return { title: "No disliked movies", subtitle: "Dislike movies from the Pick tab" };
    return { title: "No saved movies", subtitle: "Save movies from the Pick tab" };
  };

  const emptyMsg = getEmptyMessage();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Library</Text>
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
                <Text style={[styles.chipText, { color: isActive ? "#fff" : colors.text.tertiary }]}>
                  {chip.label} ({counts[chip.key]})
                </Text>
              </Animated.View>
            </Pressable>
          );
        })}
      </View>
      {loading ? (
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Loading...</Text>
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

const styles = StyleSheet.create({
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
});
