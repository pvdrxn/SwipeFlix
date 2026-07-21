import React, { useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import { useTheme } from "../theme";


const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

export function MovieCard({ movie, onPress, watched = false, director }) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const cardWidth = (width - 32) / 2 - 20;

  const posterUri = movie.poster_path
    ? `${IMAGE_BASE_URL}${movie.poster_path}`
    : null;

  const rating = (movie.vote_average != null)
    ? Number(movie.vote_average).toFixed(1)
    : "N/A";

  const year = movie.release_date
    ? movie.release_date.slice(0, 4)
    : null;

  const styles = useMemo(() => StyleSheet.create({
    container: {
      marginLeft: 6,
      marginRight: 6,
      marginBottom: 4,
    },
    posterContainer: {
      position: "relative",
    },
    poster: {
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.border,
    },
    posterPlaceholder: {
      borderRadius: 4,
      backgroundColor: colors.bg.elevated,
      justifyContent: "center",
      alignItems: "center",
    },
    placeholderText: {
      color: colors.text.tertiary,
      fontSize: 12,
    },
    watchedBadge: {
      position: "absolute",
      bottom: 4,
      right: 4,
      backgroundColor: colors.bg.overlay,
      paddingHorizontal: 6,
      paddingVertical: 3,
      borderRadius: 2,
    },
    meta: {
      marginTop: 6,
      gap: 2,
    },
    title: {
      color: colors.text.primary,
      fontSize: 13,
      fontWeight: "600",
      lineHeight: 18,
    },
    metaRow: {
      flexDirection: "row",
      alignItems: "center",
    },
    ratingValue: {
      color: colors.text.primary,
      fontSize: 12,
      fontWeight: "600",
      marginLeft: 3,
    },
    bullet: {
      color: colors.text.tertiary,
      fontSize: 12,
    },
    year: {
      color: colors.text.tertiary,
      fontSize: 12,
    },
    director: {
      color: colors.text.muted,
      fontSize: 11,
      marginTop: 2,
    },
  }), [colors]);

  return (
    <Pressable onPress={() => onPress?.(movie)} style={styles.container}>
      <View style={[styles.posterContainer, { width: cardWidth }]}>
        {posterUri ? (
          <Image source={{ uri: posterUri }} style={[styles.poster, { width: cardWidth, height: cardWidth * 1.5 }]} />
        ) : (
          <View style={[styles.posterPlaceholder, { width: cardWidth, height: cardWidth * 1.5 }]}>
            <Text style={styles.placeholderText}>No Image</Text>
          </View>
        )}
        {watched ? (
          <View style={styles.watchedBadge}>
            <Feather name="eye" size={16} color={colors.accent} />
          </View>
        ) : null}
      </View>
      <View style={[styles.meta, { width: cardWidth }]}>
        <Text style={styles.title} numberOfLines={2}>{movie.title}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="star" size={14} color={colors.accent} />
              <Text style={[styles.ratingValue, (movie.vote_average || 0) >= 8 && { color: colors.accent }]}>{rating}</Text>
          {year ? (
            <>
              <Text style={styles.bullet}>  •  </Text>
              <Text style={styles.year}>{year}</Text>
            </>
          ) : null}
        </View>
        {director ? (
          <Text style={styles.director} numberOfLines={1}>Dir. {director}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}