import React, { useState, useEffect, useRef, useCallback, useContext } from "react";
import { View, Text, Image, StyleSheet, Dimensions, Pressable, ScrollView, Animated, PanResponder, Modal } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { fetchPopularMovies, fetchGenres, fetchMovieCredits, fetchMovieDetails } from "../services/tmdb";
import { addPick, getPicks, subscribePicks, toggleFavorite } from "../api/picksApi";
import { colors } from "../theme";
import { LanguageContext } from "../context/LanguageContext";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const SWIPE_THRESHOLD = 125;

const CARD_WIDTH = SCREEN_WIDTH - 48;
const CARD_HEIGHT = CARD_WIDTH * 1.5;

export function PickScreen() {
  const { language, t } = useContext(LanguageContext);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedCount, setSavedCount] = useState(0);
  const [passCount, setPassCount] = useState(0);
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const pageRef = useRef(1);
  const [cardIndex, setCardIndex] = useState(0);
  const cardIndexRef = useRef(0);
  const [genreMap, setGenreMap] = useState({});
  const [directors, setDirectors] = useState({});
  const [runtimes, setRuntimes] = useState({});
  const fetchedDirectors = useRef(new Set());
  const [pickedIds, setPickedIds] = useState(new Set());
  const pickedIdsRef = useRef(new Set());
  const loadMoviesRef = useRef(null);
  const loadingRef = useRef(false);
  const queuedIdsRef = useRef(new Set());
  const moviesSnapshotRef = useRef([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const expandedRef = useRef(false);
  const expandAnim = useRef(new Animated.Value(0)).current;
  const synopsisOpacity = useRef(new Animated.Value(0)).current;
  
  
  

  const borderAnim = useRef(new Animated.Value(0)).current;
  const holdScale = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY()).current;
  const starStamp = useRef({ opacity: new Animated.Value(0), scale: new Animated.Value(0) }).current;
  const isSwiping = useRef(false);
  const rightOverlayOpacity = useRef(new Animated.Value(0)).current;
  const leftOverlayOpacity = useRef(new Animated.Value(0)).current;
  const upOverlayOpacity = useRef(new Animated.Value(0)).current;

  const backCardScale = useRef(
    Animated.add(
      new Animated.Value(0.9),
      Animated.multiply(
        new Animated.Value(0.1),
        Animated.subtract(
          new Animated.Value(1),
          Animated.multiply(
            Animated.subtract(new Animated.Value(1), pan.x.interpolate({
              inputRange: [-SWIPE_THRESHOLD, 0, SWIPE_THRESHOLD],
              outputRange: [1, 0, 1],
              extrapolate: "clamp",
            })),
            Animated.subtract(new Animated.Value(1), pan.y.interpolate({
              inputRange: [-SWIPE_THRESHOLD, 0],
              outputRange: [1, 0],
              extrapolate: "clamp",
            })),
          ),
        ),
      ),
    )
  ).current;

  const loadMovies = async (reset = false, replace = false) => {
    if (!reset && !replace && loadingRef.current) return;
    try {
      loadingRef.current = true;
      setLoading(true);
      const currentPage = reset ? 1 : pageRef.current;
      const data = await fetchPopularMovies({ page: currentPage });
      pageRef.current = currentPage + 1;
      const raw = data.results || [];
      const newMovies = raw.filter(
        m => !pickedIdsRef.current.has(m.id) && !queuedIdsRef.current.has(m.id)
      );
      if (reset) {
        queuedIdsRef.current = new Set(newMovies.map(m => m.id));
      } else {
        for (const movie of newMovies) {
          queuedIdsRef.current.add(movie.id);
        }
      }
      for (const movie of newMovies) {
        if (!fetchedDirectors.current.has(movie.id)) {
          fetchedDirectors.current.add(movie.id);
          fetchMovieCredits(movie.id).then(data => {
            const director = (data.crew || []).find(p => p.job === "Director");
            if (director) {
              setDirectors(prev => ({ ...prev, [movie.id]: director.name }));
            }
          }).catch(() => {});
          fetchMovieDetails(movie.id).then(data => {
            if (data.runtime) {
              setRuntimes(prev => ({ ...prev, [movie.id]: data.runtime }));
            }
          }).catch(() => {});
        }
      }
      if (reset || replace) {
        setMovies(newMovies);
        setCardIndex(0);
        cardIndexRef.current = 0;
      } else {
        setMovies(prev => [...prev, ...newMovies]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  };
  loadMoviesRef.current = loadMovies;

  useEffect(() => {
    async function bootstrap() {
      try {
        const genreData = await fetchGenres();
        const map = {};
        (genreData.genres || []).forEach(g => { map[g.id] = g.name; });
        setGenreMap(map);
      } catch (err) {
        console.warn("Failed to load genres:", err);
      }
      try {
        const picks = await getPicks();
        const ids = new Set(picks.map(p => p.tmdb_id));
        setPickedIds(ids);
        pickedIdsRef.current = ids;
        loadMovies(true);
      } catch (err) {
        console.warn("Failed to load picks:", err);
        loadMovies(true);
      }
    }
    bootstrap();
  }, []);

  useEffect(() => {
    fetchGenres().then((data) => {
      const map = {};
      (data.genres || []).forEach(g => { map[g.id] = g.name; });
      setGenreMap(map);
    }).catch(() => {});
    if (movies.length > 0) {
      Promise.allSettled(
        movies.map(m => fetchMovieDetails(m.id).then(d => ({ id: m.id, title: d.title, overview: d.overview })))
      ).then(results => {
        const overviewMap = {};
        results.forEach(r => {
          if (r.status === "fulfilled") {
            overviewMap[r.value.id] = { title: r.value.title, overview: r.value.overview };
          }
        });
        setMovies(prev => prev.map(m => {
          const updated = overviewMap[m.id];
          return updated ? { ...m, title: updated.title, overview: updated.overview } : m;
        }));
      });
    }
  }, [language]);

  useEffect(() => {
    const unsub = subscribePicks(async () => {
      try {
        const picks = await getPicks();
        const ids = new Set(picks.map(p => p.tmdb_id));
        setPickedIds(ids);
        pickedIdsRef.current = ids;
      } catch (err) {
        console.warn("Failed to refresh picks:", err);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (movies.length > 0) {
      for (let i = 0; i < Math.min(5, movies.length); i++) {
        const posterUrl = movies[i].poster_path
          ? `https://image.tmdb.org/t/p/w500${movies[i].poster_path}`
          : null;
        if (posterUrl) Image.prefetch(posterUrl);
      }
    }
  }, [movies.length === 0]);

  useEffect(() => {
    if (cardIndex >= movies.length - 2 && !loading) {
      loadMovies();
    }
    for (let i = 0; i < 3; i++) {
      const movie = movies[cardIndex + i];
      if (movie) {
        const posterUrl = movie.poster_path
          ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
          : null;
        if (posterUrl) Image.prefetch(posterUrl);
        if (!fetchedDirectors.current.has(movie.id)) {
          fetchedDirectors.current.add(movie.id);
          fetchMovieCredits(movie.id).then(data => {
            const director = (data.crew || []).find(p => p.job === "Director");
            if (director) {
              setDirectors(prev => ({ ...prev, [movie.id]: director.name }));
            }
          }).catch(() => {});
          fetchMovieDetails(movie.id).then(data => {
            if (data.runtime) {
              setRuntimes(prev => ({ ...prev, [movie.id]: data.runtime }));
            }
          }).catch(() => {});
        }
      }
    }
  }, [cardIndex, movies.length, loading]);

  useEffect(() => {
    pan.setValue({ x: 0, y: 0 });
    if (expandedRef.current) {
      Animated.spring(synopsisOpacity, {
        toValue: 1,
        useNativeDriver: true,
        damping: 12,
        stiffness: 80,
      }).start();
    } else {
      expandAnim.setValue(0);
      synopsisOpacity.setValue(0);
      setIsExpanded(false);
      expandedRef.current = false;
    }
  }, [cardIndex]);

  useEffect(() => {
    if (cardIndex >= movies.length && movies.length > 0) {
      loadMoviesRef.current(false, true);
    }
  }, [cardIndex, movies.length]);

  const handleSwiped = useCallback(async (direction, swipedIndex) => {
    const movie = moviesSnapshotRef.current[swipedIndex];
    if (!movie) return;

    try {
      await addPick({
        tmdbId: movie.id,
        title: movie.title,
        posterPath: movie.poster_path,
        rating: movie.vote_average ?? undefined,
        ...(direction === "right" ? { choice: "liked" } : {}),
        ...(direction === "up" ? { is_saved: true } : {}),
        ...(direction === "left" ? { choice: "pass" } : {}),
      });
    } catch (err) {
      console.warn("Failed to save pick:", err);
    }

    if (direction === "right" || direction === "up") {
      setSavedCount((c) => c + 1);
    } else {
      setPassCount((c) => c + 1);
    }
    setPickedIds(prev => {
      const newSet = new Set([...prev, movie.id]);
      pickedIdsRef.current = newSet;
      return newSet;
    });
    queuedIdsRef.current.delete(movie.id);
  }, []);

  const toggleSynopsis = useCallback(() => {
    const toValue = expandedRef.current ? 0 : 1;
    expandedRef.current = !expandedRef.current;
    setIsExpanded(toValue === 1);
    Animated.spring(expandAnim, {
      toValue,
      delay: toValue === 0 ? 200 : 0,
      useNativeDriver: true,
      damping: 18,
      stiffness: 150,
    }).start();
    Animated.spring(synopsisOpacity, {
      toValue,
      delay: toValue === 1 ? 200 : 0,
      useNativeDriver: true,
      damping: 12,
      stiffness: 80,
    }).start();
  }, []);



  const doubleTapRef = useRef(null);

  const handleDoubleTap = useCallback(() => {
    const movie = moviesSnapshotRef.current[cardIndexRef.current];
    if (!movie || isSwiping.current) return;
    isSwiping.current = true;
    toggleFavorite({
      tmdbId: movie.id,
      title: movie.title,
      posterPath: movie.poster_path,
      rating: movie.vote_average ?? undefined,
    }).catch(() => {});
    setSavedCount((c) => c + 1);
    setPickedIds(prev => {
      const newSet = new Set([...prev, movie.id]);
      pickedIdsRef.current = newSet;
      return newSet;
    });
    queuedIdsRef.current.delete(movie.id);
    starStamp.opacity.setValue(1);
    starStamp.scale.setValue(0);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(borderAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.timing(holdScale, { toValue: 1.05, duration: 300, useNativeDriver: true }),
        Animated.spring(starStamp.scale, { toValue: 1, damping: 8, stiffness: 250, useNativeDriver: true }),
      ]),
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(borderAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(holdScale, { toValue: 1, duration: 150, useNativeDriver: true }),
        Animated.timing(starStamp.opacity, { toValue: 0, duration: 150, useNativeDriver: true }),
        Animated.timing(starStamp.scale, { toValue: 0.3, duration: 150, useNativeDriver: true }),
      ]),
    ]).start(() => {
      const idx = cardIndexRef.current;
      pan.setValue({ x: 0, y: 0 });
      holdScale.setValue(1);
      rightOverlayOpacity.setValue(0);
      leftOverlayOpacity.setValue(0);
      upOverlayOpacity.setValue(0);
      isSwiping.current = false;
      setMovies(prev => prev.filter((_, i) => i !== idx));
      cardIndexRef.current = idx + 1;
      setCardIndex(idx + 1);
    });
  }, [toggleFavorite]);

  const finishSwipe = useCallback((direction) => {
    const targetX = direction === "right" ? SCREEN_WIDTH * 2 : -(SCREEN_WIDTH * 2);
    const targetY = direction === "up" ? -(SCREEN_HEIGHT * 2) : 0;
    const wasExpanded = expandedRef.current;
    const idx = cardIndexRef.current;
    Animated.timing(pan, {
      toValue: { x: direction === "up" ? 0 : targetX, y: targetY },
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      isSwiping.current = false;
      rightOverlayOpacity.setValue(0);
      leftOverlayOpacity.setValue(0);
      upOverlayOpacity.setValue(0);
      handleSwiped(direction, idx);

      const nextIndex = idx + 1;
      if (wasExpanded) {
        Animated.timing(synopsisOpacity, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }).start(() => {
          cardIndexRef.current = nextIndex;
          setCardIndex(nextIndex);
        });
      } else {
        cardIndexRef.current = nextIndex;
        setCardIndex(nextIndex);
      }
    });
  }, [handleSwiped, pan]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) => !isSwiping.current && (Math.abs(g.dx) > 10 || g.dy < -10),
      onPanResponderGrant: () => {
        isSwiping.current = true;
      },
      onPanResponderMove: (_, g) => {
        pan.setValue({ x: g.dx, y: g.dy });
        const horizProgress = Math.min(Math.abs(g.dx) / SWIPE_THRESHOLD, 1);
        const horizOpacity = horizProgress * 0.5;
        const vertProgress = Math.min(Math.abs(g.dy) / SWIPE_THRESHOLD, 1);
        const vertOpacity = vertProgress * 0.5;
        if (g.dx > 0) {
          rightOverlayOpacity.setValue(horizOpacity);
          leftOverlayOpacity.setValue(0);
        } else {
          leftOverlayOpacity.setValue(horizOpacity);
          rightOverlayOpacity.setValue(0);
        }
        if (g.dy < 0) {
          upOverlayOpacity.setValue(vertOpacity);
        } else {
          upOverlayOpacity.setValue(0);
        }
      },
      onPanResponderRelease: (_, g) => {
        if (g.dx > SWIPE_THRESHOLD) {
          finishSwipe("right");
        } else if (g.dx < -SWIPE_THRESHOLD) {
          finishSwipe("left");
        } else if (g.dy < -SWIPE_THRESHOLD) {
          finishSwipe("up");
        } else {
          rightOverlayOpacity.setValue(0);
          leftOverlayOpacity.setValue(0);
          upOverlayOpacity.setValue(0);
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: true,
            damping: 15,
            stiffness: 200,
          }).start(() => {
            isSwiping.current = false;
          });
        }
      },
      onPanResponderTerminate: () => {
        rightOverlayOpacity.setValue(0);
        leftOverlayOpacity.setValue(0);
        upOverlayOpacity.setValue(0);
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
          damping: 15,
          stiffness: 200,
        }).start(() => {
          isSwiping.current = false;
        });
      },
    })
  ).current;

  const rightBorderOpacity = pan.x.interpolate({
    inputRange: [0, SWIPE_THRESHOLD * 0.5],
    outputRange: [0, 0.8],
    extrapolate: "clamp",
  });
  const leftBorderOpacity = pan.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD * 0.5, 0],
    outputRange: [0.8, 0],
    extrapolate: "clamp",
  });
  const upBorderOpacity = pan.y.interpolate({
    inputRange: [-SWIPE_THRESHOLD * 0.5, 0],
    outputRange: [0.8, 0],
    extrapolate: "clamp",
  });

  const renderCard = useCallback((movie, isCurrent) => {
    if (!movie) return null;

    return (
      <Pressable onPress={() => {
        if (doubleTapRef.current) {
          clearTimeout(doubleTapRef.current);
          doubleTapRef.current = null;
          handleDoubleTap();
        } else {
          doubleTapRef.current = setTimeout(() => {
            doubleTapRef.current = null;
            toggleSynopsis();
          }, 300);
        }
      }} style={styles.card}>
        <View style={{ flex: 1, borderRadius: 4, overflow: "hidden" }}>
          {isCurrent && (
            <>
              <Animated.View
                pointerEvents="none"
                style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  borderRadius: 4, borderWidth: 2, borderColor: colors.swipe.save,
                  opacity: rightBorderOpacity, zIndex: 10,
                }}
              />
              <Animated.View
                pointerEvents="none"
                style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  borderRadius: 4, borderWidth: 2, borderColor: colors.swipe.pass,
                  opacity: leftBorderOpacity, zIndex: 10,
                }}
              />
              <Animated.View
                pointerEvents="none"
                style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  borderRadius: 4, borderWidth: 2, borderColor: colors.swipe.saved,
                  opacity: upBorderOpacity, zIndex: 10,
                }}
              />
              <Animated.View
                pointerEvents="none"
                style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  borderRadius: 4,
                  borderWidth: 2,
                  borderColor: colors.favorite,
                  opacity: Animated.multiply(borderAnim, 0.9),
                  zIndex: 11,
                }}
              />
              
            </>
          )}
          {movie.poster_path ? (
            <Image
              source={{
                uri: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
              }}
              style={styles.cardImage}
            />
          ) : (
            <View style={[styles.cardImage, styles.cardPlaceholder]}>
              <Text style={styles.placeholderText}>{t("pick.noImage")}</Text>
            </View>
          )}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)", "rgba(0,0,0,0.7)"]}
            locations={[0, 0.22, 1]}
            style={styles.cardInfo}
          >
            <View>
              <Text style={styles.cardTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.571}>
                {movie.title}
              </Text>
              <Text style={styles.cardYear}>
                {movie.release_date?.slice(0, 4) || ""}{runtimes[movie.id] ? ` • ${runtimes[movie.id]} ${t("details.min")}` : ""}
              </Text>
            </View>
            <View style={styles.cardGenres}>
              {(movie.genre_ids || []).map(id => ({ id, name: genreMap[id] })).filter(g => g.name).map((g, i, arr) => (
                <React.Fragment key={g.id}>
                  <Text style={{ color: colors.genreById[g.id] || colors.text.primary, fontSize: 16, fontWeight: "700" }}>
                    {g.name}
                  </Text>
                  {i < arr.length - 1 && (
                    <Text style={{ color: colors.text.primary, fontSize: 16 }}> · </Text>
                  )}
                </React.Fragment>
              ))}
            </View>
            <View style={styles.cardRatingRow}>
              <Ionicons name="star" size={22} color={colors.accent} />
              <Text style={styles.cardRating}>
                {(movie.vote_average != null) ? Number(movie.vote_average).toFixed(1) : t("details.na")}
              </Text>
            </View>
          </LinearGradient>
        </View>
      </Pressable>
    );
  }, [genreMap, directors, toggleSynopsis]);

  moviesSnapshotRef.current = movies;

  if (loading && movies.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>{t("pick.loading")}</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{t("pick.error")}{error}</Text>
      </View>
    );
  }

  const noMoreMovies = cardIndex >= movies.length;
  const topCard = movies[cardIndex];
  const nextCard = movies[cardIndex + 1];

  const cardCenterX = SCREEN_WIDTH / 2;
  const cardCenterY = 25 + 30 + 14 + 20 + (CARD_HEIGHT / 2) + 25;

  const cardRotate = pan.x.interpolate({
    inputRange: [-SCREEN_WIDTH / 2, 0, SCREEN_WIDTH / 2],
    outputRange: ["-15deg", "0deg", "15deg"],
    extrapolate: "clamp",
  });

  return (
    <View style={styles.container}>
<Animated.View pointerEvents="none" style={[styles.swipeOverlay, { backgroundColor: colors.swipe.save, opacity: rightOverlayOpacity }]} />
      <Animated.View pointerEvents="none" style={[styles.swipeOverlay, { backgroundColor: colors.swipe.pass, opacity: leftOverlayOpacity }]} />
      <Animated.View pointerEvents="none" style={[styles.swipeOverlay, { backgroundColor: colors.swipe.saved, opacity: upOverlayOpacity }]} />
      <Animated.View pointerEvents="none" style={[styles.swipeOverlay, { backgroundColor: colors.favorite, opacity: Animated.multiply(borderAnim, 0.7) }]} />
      <View style={{ alignItems: "center", paddingBottom: 120 }}>
      <Pressable
        style={styles.infoButton}
        onPress={() => setInfoModalVisible(true)}
      >
        <Feather name="info" size={32} color={colors.accent} />
      </Pressable>

      {movies.length > 0 && (
        <Animated.View
          style={[styles.swiperContainer, { transform: [{ translateY: expandAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -100] }) }] }]}>
          <View style={styles.cardStack}>
            {nextCard && (
              <Animated.View
                style={[
                  styles.cardStackBack,
                  {
                    transform: [
                      { scale: backCardScale },
                    ],
                  },
                ]}
              >
                {renderCard(nextCard, false)}
              </Animated.View>
            )}
            {topCard && (
              <Animated.View
                style={[
                  styles.cardStackFront,
                  {
                    transform: [
                      { translateX: pan.x },
                      { translateY: pan.y },
                      { rotate: cardRotate },
                      { scale: holdScale },
                    ],
                  },
                ]}
                {...panResponder.panHandlers}
              >
                {renderCard(topCard, true)}
              </Animated.View>
            )}
          </View>
        </Animated.View>
      )}

      {topCard?.overview && (
        <Animated.View
          style={{
            opacity: synopsisOpacity,
            width: SCREEN_WIDTH - 60,
            paddingVertical: 20,
            borderBottomLeftRadius: 16,
            borderBottomRightRadius: 16,
            overflow: "hidden",
            backgroundColor: "transparent",
            alignSelf: "center",
            transform: [{ translateY: -135 }],
          }}
        >
          <Text style={styles.synopsisText} numberOfLines={8} adjustsFontSizeToFit minimumFontScale={0.7}>{topCard.overview}</Text>
        </Animated.View>
      )}

      <Animated.View pointerEvents="none" style={{
        position: "absolute", top: 0, left: 0, right: 0, bottom: 120,
        justifyContent: "center", alignItems: "center", zIndex: 60,
        opacity: starStamp.opacity,
        transform: [
          { scale: starStamp.scale },
          { translateY: expandAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -100] }) },
        ],
      }}>
        <Ionicons name="star" size={90} color="#FBBF24" />
      </Animated.View>

      </View>
      <Modal
        visible={infoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoModalVisible(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setInfoModalVisible(false)}>
          <View style={styles.infoModalContent}>
            <Text style={styles.infoModalTitle}>{t("pick.swipeInstructions")}</Text>
            <View style={styles.infoModalRow}>
              <Feather name="arrow-left" size={18} color={colors.swipe.pass} />
              <Text style={{ color: colors.swipe.pass, fontSize: 16, fontWeight: "600" }}>{t("pick.leftToDislike")}</Text>
            </View>
            <View style={styles.infoModalRow}>
              <Feather name="arrow-up" size={18} color={colors.swipe.saved} />
              <Text style={{ color: colors.swipe.saved, fontSize: 16, fontWeight: "600" }}>{t("pick.upToWatchLater")}</Text>
            </View>
            <View style={styles.infoModalRow}>
              <Feather name="arrow-right" size={18} color={colors.swipe.save} />
              <Text style={{ color: colors.swipe.save, fontSize: 16, fontWeight: "600" }}>{t("pick.rightToLike")}</Text>
            </View>
            <View style={styles.infoDivider} />
            <View style={styles.infoModalRow}>
              <Feather name="file-text" size={18} color={colors.text.primary} />
              <Text style={{ color: colors.text.primary, fontSize: 16 }}>{t("pick.tapForSynopsis")}</Text>
            </View>
            <View style={styles.infoModalRow}>
              <Feather name="star" size={18} color={colors.favorite} />
              <Text style={{ color: colors.favorite, fontSize: 16 }}>{t("pick.doubleTapToFavorite")}</Text>
            </View>
          </View>
        </Pressable>
      </Modal>
      {noMoreMovies && movies.length > 0 && (
        <View style={styles.doneOverlay}>
          <Text style={styles.doneText}>{t("pick.noMore")}</Text>
          <Text style={styles.pickedCount}>
            {t("pick.savedCount", { saved: savedCount, pass: passCount })}
          </Text>
          <Pressable
            onPress={() => {
              queuedIdsRef.current = new Set();
              setMovies([]);
              setCardIndex(0);
              cardIndexRef.current = 0;
              setSavedCount(0);
              setPassCount(0);
              pageRef.current = 1;
              loadMovies(true);
            }}
            style={styles.resetButton}
          >
            <Text style={styles.resetText}>{t("pick.startOver")}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  synopsisText: {
    color: colors.text.primary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
  swipeOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 0,
  },
  container: {
    flex: 1,
    backgroundColor: colors.bg.primary,
    alignItems: "center",
    paddingTop: 25,
    paddingHorizontal: 0,
  },
  title: {
    color: colors.text.primary,
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 4,
  },
  subtitle: {
    color: colors.text.tertiary,
    fontSize: 14,
    marginBottom: 24,
  },
  loadingText: {
    color: colors.text.tertiary,
    fontSize: 16,
  },
  errorText: {
    color: colors.accentSecondary,
    fontSize: 16,
  },
  swiperContainer: {
    height: CARD_HEIGHT + 40,
    width: SCREEN_WIDTH,
    alignItems: "center",
    marginTop: 132,
    zIndex: 2,
  },
  cardStack: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
  },
  cardStackBack: {
    position: "absolute",
  },
  cardStackFront: {
    position: "absolute",
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 4,
    backgroundColor: "transparent",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
    overflow: "hidden",
    borderRadius: 4,
  },
  cardPlaceholder: {
    backgroundColor: colors.bg.elevated,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 4,
  },
  placeholderText: {
    color: colors.text.tertiary,
    fontSize: 16,
  },
  cardInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingBottom: 0,
    paddingTop: 15,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
  },
  cardTitle: {
    color: colors.text.primary,
    fontSize: 28,
    fontWeight: "700",
    top: -5,
    left: -5,
  },
  cardYear: {
    color: colors.text.secondary,
    fontSize: 16,
    fontWeight: "700",
    marginLeft: 0,
    top: -5,
    right: 4,
    flexShrink: 0,
  },
  cardGenres: {
    flexDirection: "row",
    flexWrap: "wrap",
    top: -5,
    left: -3,
  },
  cardDirector: {
    color: colors.text.primary,
    fontSize: 15,
    top: -5,
    left: -3,
  },
  cardRatingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 4,
    top: -10,
    alignSelf: "flex-end",
  },
  cardRating: {
    fontSize: 26,
    fontWeight: "600",
    color: colors.accent,
  },
  doneOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg.primary,
    zIndex: 10,
  },
  doneText: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
  },
  pickedCount: {
    color: colors.text.secondary,
    fontSize: 16,
    marginBottom: 24,
  },
  resetButton: {
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  resetText: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: "600",
  },
  infoButton: {
    position: "absolute",
    top: 25,
    right: 17,
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 0,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.75)",
  },
  infoModalContent: {
    width: "80%",
    backgroundColor: "#1a1a2e",
    borderRadius: 16,
    padding: 24,
  },
  infoModalTitle: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },
  infoModalRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    marginBottom: 14,
  },
  infoDivider: {
    height: 1,
    backgroundColor: "#444",
    marginVertical: 8,
  },
});
