import React, { useState, useEffect, useCallback, useRef } from "react";
import { View, Text, Image, StyleSheet, ScrollView, Pressable, Dimensions, Animated } from "react-native";
import * as WebBrowser from "expo-web-browser";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { fetchMovieDetails, fetchMovieCredits, fetchMovieWatchProviders, fetchMovieTrailer, fetchMovieReleaseDates } from "../services/tmdb";
import { addPick, deletePick, getPicks, subscribePicks, subscribeWatched, getWatchedPicks, toggleWatched, toggleSave } from "../api/picksApi";
import { colors } from "../theme";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

export function MovieDetailsScreen({ route, navigation }) {
  const { movieId, initialMovieData } = route.params;
  const [movie, setMovie] = useState(initialMovieData || null);
  const [credits, setCredits] = useState(null);
  const [watchProviders, setWatchProviders] = useState(null);
  const [trailer, setTrailer] = useState(null);
  const [releaseDates, setReleaseDates] = useState(null);
  const [loading, setLoading] = useState(!initialMovieData);

  const handlePlayTrailer = async () => {
    if (trailer?.key) {
      await WebBrowser.openBrowserAsync(`https://www.youtube.com/watch?v=${trailer.key}`);
    }
  };

  const [error, setError] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likedId, setLikedId] = useState(null);
  const [isWatched, setIsWatched] = useState(false);
  const [isPassed, setIsPassed] = useState(false);
  const favScale = useRef(new Animated.Value(1)).current;
  const likeScale = useRef(new Animated.Value(1)).current;
  const passScale = useRef(new Animated.Value(1)).current;
  const watchScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Promise.all([
      fetchMovieDetails(movieId),
      fetchMovieCredits(movieId),
      fetchMovieWatchProviders(movieId),
      fetchMovieTrailer(movieId),
      fetchMovieReleaseDates(movieId),
    ])
      .then(([details, creditsData, providersData, trailerData, releaseData]) => {
        setMovie(details);
        setCredits(creditsData);
        setWatchProviders(providersData);
        setTrailer(trailerData);
        setReleaseDates(releaseData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [movieId]);

  const checkFavorite = useCallback(async () => {
    try {
      const picks = await getPicks({ isSaved: true });
      const found = picks.find(p => p.tmdb_id === movieId);
      if (found) {
        setIsFavorite(true);
        setFavoriteId(found.id);
      } else {
        setIsFavorite(false);
        setFavoriteId(null);
      }
    } catch (err) {
      console.warn("Failed to check favorite:", err.message);
    }
  }, [movieId]);

  const checkWatched = useCallback(async () => {
    try {
      const watched = await getWatchedPicks();
      const found = watched.find(p => Number(p.tmdb_id) === Number(movieId));
      setIsWatched(!!found);
    } catch (err) {
      console.warn("Failed to check watched:", err.message);
    }
  }, [movieId]);

  const checkLiked = useCallback(async () => {
    try {
      const picks = await getPicks({ choice: "liked" });
      const found = picks.find(p => p.tmdb_id === movieId);
      setIsLiked(!!found);
      setLikedId(found ? found.id : null);
    } catch (err) {
      console.warn("Failed to check liked:", err.message);
    }
  }, [movieId]);

  const checkPassed = useCallback(async () => {
    try {
      const picks = await getPicks({ choice: "pass" });
      const found = picks.find(p => p.tmdb_id === movieId);
      setIsPassed(!!found);
    } catch (err) {
      console.warn("Failed to check passed:", err.message);
    }
  }, [movieId]);

  useEffect(() => {
    checkFavorite();
    checkLiked();
    checkWatched();
    checkPassed();
  }, [checkFavorite, checkLiked, checkWatched, checkPassed]);

  useEffect(() => {
    const unsubscribePicks = subscribePicks(() => {
      checkFavorite();
      checkLiked();
      checkPassed();
    });
    return unsubscribePicks;
  }, [checkFavorite, checkLiked, checkPassed]);

  useEffect(() => {
    const unsubscribeWatched = subscribeWatched(() => {
      checkWatched();
    });
    return unsubscribeWatched;
  }, [checkWatched]);

  const handleToggleFavorite = async () => {
    if (!movie) return;
    const previousState = isFavorite;
    setIsFavorite(!isFavorite);
    try {
      await toggleSave({
        tmdbId: movie.id,
        title: movie.title,
        posterPath: movie.poster_path,
        rating: movie.vote_average ?? undefined,
      });
      checkFavorite();
    } catch (err) {
      setIsFavorite(previousState);
      console.warn("Failed to toggle favorite:", err.message);
    }
  };

  const handleToggleLike = async () => {
    if (!movie) return;
    const previousState = isLiked;
    const previousId = likedId;
    setIsLiked(!isLiked);
    try {
      if (isLiked) {
        if (likedId) {
          await deletePick(likedId, { notify: true });
        }
      } else {
        await addPick({
          tmdbId: movie.id,
          title: movie.title,
          posterPath: movie.poster_path,
          rating: movie.vote_average ?? undefined,
          choice: "liked",
          notify: true,
        });
      }
      checkLiked();
      checkFavorite();
      checkPassed();
    } catch (err) {
      setIsLiked(previousState);
      setLikedId(previousId);
      console.warn("Failed to toggle like:", err.message);
    }
  };

  const handleToggleWatched = async () => {
    const previousState = isWatched;
    setIsWatched(!isWatched);
    try {
      const allPicks = await getPicks();
      const existing = allPicks.find(p => Number(p.tmdb_id) === Number(movieId));
      if (existing) {
        await toggleWatched(existing.id);
      } else if (movie) {
        const data = await addPick({
          tmdbId: movie.id,
          title: movie.title,
          posterPath: movie.poster_path,
          rating: movie.vote_average ?? undefined,
          notify: true,
        });
        await toggleWatched(data.id);
      }
      checkWatched();
    } catch (err) {
      setIsWatched(previousState);
      console.warn("Failed to toggle watched:", err.message);
    }
  };

  const handleTogglePassed = async () => {
    if (!movie) return;
    const previousState = isPassed;
    setIsPassed(!isPassed);
    try {
      if (isPassed) {
        const picks = await getPicks({ choice: "pass" });
        const found = picks.find(p => p.tmdb_id === movieId);
        if (found) {
          await deletePick(found.id, { notify: true });
        }
      } else {
        await addPick({
          tmdbId: movie.id,
          title: movie.title,
          posterPath: movie.poster_path,
          rating: movie.vote_average ?? undefined,
          choice: "pass",
          notify: true,
        });
      }
      checkPassed();
      checkFavorite();
      checkLiked();
    } catch (err) {
      setIsPassed(previousState);
      console.warn("Failed to toggle passed:", err.message);
    }
  };

  const getAdditionalRatings = () => {
    if (!releaseDates?.results) return null;
    const usRelease = releaseDates.results.find(r => r.iso_3166_1 === "US");
    if (!usRelease?.release_dates?.length) return null;
    const certification = usRelease.release_dates.find(d => d.certification);
    if (!certification?.certification) return null;
    return certification.certification;
  };

  const getRatings = () => {
    if (!releaseDates?.results) return [];
    const ratings = [];
    const seen = new Set();
    const usRelease = releaseDates.results.find(r => r.iso_3166_1 === "US");
    if (usRelease?.release_dates) {
      usRelease.release_dates.forEach(date => {
        if (date.certification && !seen.has(date.certification)) {
          seen.add(date.certification);
          ratings.push({ source: "US", value: date.certification });
        }
      });
    }
    return ratings;
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.centerContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : !movie ? (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
        </View>
      ) : (
        <>
          <ScrollView style={styles.scrollView}>
        {movie.backdrop_path ? (
          <View style={styles.backdropContainer}>
            <Image
              source={{ uri: `https://image.tmdb.org/t/p/w780${movie.backdrop_path}` }}
              style={styles.backdropImage}
            />
            <View style={styles.backdropOverlay} />
            <View style={styles.backdropContent}>
              {trailer && (
                <Pressable onPress={handlePlayTrailer}>
                  <Feather name="play" size={36} color="#fff" />
                </Pressable>
              )}
            </View>
            <LinearGradient
              colors={["transparent", colors.bg.primary]}
              style={styles.backdropBottomFade}
              pointerEvents="none"
            />
          </View>
        ) : (
          <View style={styles.topBarPlaceholder} />
        )}
        <View style={styles.header}>
          <View>
            {movie.poster_path ? (
              <Image
                source={{ uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}` }}
                style={styles.poster}
              />
            ) : (
              <View style={[styles.poster, styles.posterPlaceholder]}>
                <Text style={styles.posterInitials}>
                  {movie.title.split(" ").map(n => n[0]).join("").slice(0, 2)}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.headerInfo}>
            <View style={styles.titleRow}>
              <Text style={styles.title}>{movie.title}</Text>
            </View>
            <View style={styles.ratingRow}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                <Ionicons name="star" size={18} color={colors.accent} />
                <Text style={styles.rating}>{(movie.vote_average != null) ? Number(movie.vote_average).toFixed(1) : "N/A"}</Text>
              </View>
              {(() => {
                const ratings = getRatings();
                if (ratings.length === 0) return null;
                return (
                  <View style={styles.ratingsContainer}>
                    {ratings.map((r, i) => (
                      <View key={i} style={styles.ratingBadge}>
                        <Text style={styles.ratingBadgeText}>{r.source} {r.value}</Text>
                      </View>
                    ))}
                  </View>
                );
              })()}
            </View>
            <Text style={styles.meta}>
              {movie.release_date?.split("-")[0] || "N/A"} • {movie.runtime ?? "—"} min
            </Text>
            {(() => {
              const director = credits?.crew?.find((person) => person.job === "Director");
              if (!director) return null;
              return <Text style={styles.metaDir}>Dir. {director.name}</Text>;
            })()}
            <View style={styles.genresRow}>
              {(movie.genres || []).map((g, i) => (
                <React.Fragment key={g.id}>
                  {i > 0 && <Text style={styles.genreSeparator}> · </Text>}
                  <Text style={[styles.genreText, { color: colors.genre[g.name] || colors.text.tertiary }]}>{g.name}</Text>
                </React.Fragment>
              ))}
            </View>
          </View>
        </View>

        {movie.tagline ? (
          <View style={[styles.section, { paddingBottom: 0 }]}>
            <Text style={styles.tagline}>{movie.tagline}</Text>
          </View>
        ) : null}

        <View style={[styles.section, { paddingTop: 0 }]}>
          <Text style={styles.synopsis}>
            {movie.overview || "No synopsis available."}
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { textAlign: "center" }]}>Cast</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.castScroll}>
            {(credits?.cast?.slice(0, 10) || []).map((actor) => (
              <View key={actor.id} style={styles.castItem}>
                {actor.profile_path ? (
                  <Image
                    source={{ uri: `https://image.tmdb.org/t/p/w185${actor.profile_path}` }}
                    style={styles.castImage}
                  />
                ) : (
                  <View style={[styles.castImage, styles.castPlaceholder]}>
                    <Text style={styles.castInitials}>
                      {actor.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
                    </Text>
                  </View>
                )}
                <Text style={styles.castName} numberOfLines={2}>
                  {actor.name}
                </Text>
                <Text style={styles.castCharacter} numberOfLines={1}>
                  {actor.character}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {watchProviders?.results && Object.keys(watchProviders.results).length > 0 && (() => {
            const region = Object.keys(watchProviders.results)[0];
            const providerData = watchProviders.results[region];
            const providers = providerData?.flatrate || providerData?.rent || providerData?.buy || [];
            if (providers.length === 0) return null;
            return (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Where to Watch</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.providerScroll}>
                  {providers.map((provider) => (
                    <View key={provider.provider_id} style={styles.providerItem}>
                      {provider.logo_path && (
                        <Image
                          source={{ uri: `https://image.tmdb.org/t/p/w92${provider.logo_path}` }}
                          style={styles.providerLogo}
                        />
                      )}
                      <Text style={styles.providerName}>{provider.provider_name}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            );
          })()}
      </ScrollView>
      <View style={styles.stickyHeader}>
        <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
          <Feather name="chevron-down" size={24} color={colors.text.primary} />
        </Pressable>
        <View style={styles.stickyActions}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Pressable onPressIn={() => Animated.spring(watchScale, { toValue: 0.8, useNativeDriver: true, damping: 10, stiffness: 200 }).start()} onPressOut={() => Animated.spring(watchScale, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 200 }).start()} onPress={handleToggleWatched}>
              <Animated.View style={{ transform: [{ scale: watchScale }] }}>
              <Feather
                name="eye"
                size={24}
                color={isWatched ? colors.rating : "#fff"}
              />
              </Animated.View>
            </Pressable>
            <Pressable onPressIn={() => Animated.spring(favScale, { toValue: 0.8, useNativeDriver: true, damping: 10, stiffness: 200 }).start()} onPressOut={() => Animated.spring(favScale, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 200 }).start()} onPress={handleToggleFavorite} style={{ marginLeft: 16 }}>
              <Animated.View style={{ transform: [{ scale: favScale }] }}>
              <Feather
                name="bookmark"
                size={24}
                color={isFavorite ? colors.swipe.save : "#fff"}
              />
              </Animated.View>
            </Pressable>
          </View>
          <Pressable onPressIn={() => Animated.spring(likeScale, { toValue: 0.8, useNativeDriver: true, damping: 10, stiffness: 200 }).start()} onPressOut={() => Animated.spring(likeScale, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 200 }).start()} onPress={handleToggleLike} style={{ marginTop: 14 }}>
            <Animated.View style={{ transform: [{ scale: likeScale }] }}>
            <Feather
              name="thumbs-up"
              size={24}
                color={isLiked ? colors.swipe.saved : "#fff"}
            />
            </Animated.View>
          </Pressable>
          <Pressable onPressIn={() => Animated.spring(passScale, { toValue: 0.8, useNativeDriver: true, damping: 10, stiffness: 200 }).start()} onPressOut={() => Animated.spring(passScale, { toValue: 1, useNativeDriver: true, damping: 10, stiffness: 200 }).start()} onPress={handleTogglePassed} style={{ marginTop: 14 }}>
            <Animated.View style={{ transform: [{ scale: passScale }] }}>
            <Feather
              name="thumbs-down"
              size={24}
              color={isPassed ? colors.swipe.pass : "#fff"}
            />
            </Animated.View>
          </Pressable>
        </View>
      </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
  },
  scrollView: {
    flex: 1,
  },
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 35,
    paddingHorizontal: 10,
    zIndex: 10,
  },
  stickyActions: {
    flexDirection: "column",
    alignItems: "flex-end",
  },
  topBarPlaceholder: {
    height: 90,
  },
  backButton: {
    width: 45,
    height: 45,
    borderRadius: 45,
    justifyContent: "center",
    alignItems: "center",
    marginTop: -10,
  },
  header: {
    flexDirection: "row",
    padding: 16,
    paddingTop: 0,
    marginTop: 0,
  },
  poster: {
    width: 120,
    height: 180,
    borderRadius: 8,
  },
  posterPlaceholder: {
    backgroundColor: colors.bg.elevated,
    justifyContent: "center",
    alignItems: "center",
  },
  posterInitials: {
    color: colors.text.tertiary,
    fontSize: 32,
    fontWeight: "700",
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  title: {
    color: colors.text.primary,
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 4,
    flexShrink: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 4,
  },
  rating: {
    color: colors.accent,
    fontSize: 18,
    fontWeight: "600",
  },
  meta: {
    color: colors.text.secondary,
    fontSize: 14,
    marginBottom: 10,
  },
  metaDir: {
    color: colors.text.tertiary,
    fontSize: 13,
    marginBottom: 10,
  },
  genresRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  genreText: {
    fontSize: 14,
    fontWeight: "600",
  },
  genreSeparator: {
    color: colors.text.tertiary,
    fontSize: 12,
  },
  ratingsContainer: {
    flexDirection: "row",
    marginLeft: 8,
    alignSelf: "center",
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  ratingBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginRight: 6,
    marginTop: 4,
  },
  ratingBadgeText: {
    color: colors.text.primary,
    fontSize: 11,
    fontWeight: "600",
  },
  section: {
    padding: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
  },
  backdropContainer: {
    position: "relative",
    width: "100%",
    height: 280,
  },
  backdropImage: {
    width: "100%",
    height: "100%",
  },
  backdropOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  backdropBottomFade: {
    position: "absolute",
    bottom: -1,
    left: 0,
    right: 0,
    height: 120,
  },
  backdropContent: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  tagline: {
    color: colors.text.tertiary,
    fontSize: 15,
    fontStyle: "italic",
    lineHeight: 22,
  },
  synopsis: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 22,
  },
  castScroll: {
    flexDirection: "row",
  },
  castItem: {
    width: 90,
    marginRight: 12,
    alignItems: "center",
  },
  castImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.bg.elevated,
  },
  castPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  castInitials: {
    color: colors.text.tertiary,
    fontSize: 24,
    fontWeight: "600",
  },
  castName: {
    color: colors.text.primary,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 6,
    textAlign: "center",
  },
  castCharacter: {
    color: colors.text.tertiary,
    fontSize: 10,
    textAlign: "center",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: colors.text.tertiary,
    fontSize: 16,
    textAlign: "center",
  },
  errorText: {
    color: colors.accentSecondary,
    fontSize: 16,
    textAlign: "center",
  },
  providerScroll: {
    flexDirection: "row",
  },
  providerItem: {
    alignItems: "center",
    marginRight: 16,
    width: 70,
  },
  providerLogo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: colors.bg.elevated,
  },
  providerName: {
    color: colors.text.secondary,
    fontSize: 10,
    textAlign: "center",
    marginTop: 4,
  },
  noProvidersText: {
    color: colors.text.tertiary,
    fontSize: 14,
    fontStyle: "italic",
  },
});