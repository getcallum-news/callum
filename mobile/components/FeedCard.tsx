import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as WebBrowser from "expo-web-browser";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../hooks/useTheme";
import {
  CategoryColors,
  CategoryLabels,
  Radius,
  Spacing,
} from "../constants/theme";
import { isArticleSaved, saveArticle, removeArticle } from "../lib/storage";
import { timeAgo } from "../lib/utils";
import type { Article } from "../types/article";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Use the article's real og:image, falling back to a seeded placeholder
function getArticleImage(article: Article): string {
  if (article.image_url) {
    return article.image_url;
  }
  // Deterministic fallback for articles without og:image
  const seed = Math.abs(
    article.id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  );
  return `https://picsum.photos/seed/${seed}/${Math.round(SCREEN_WIDTH * 2)}/600`;
}

// Category-specific gradient overlays
const CATEGORY_GRADIENTS: Record<string, [string, string, string]> = {
  research: ["transparent", "rgba(90,50,180,0.4)", "rgba(13,13,13,0.98)"],
  industry: ["transparent", "rgba(30,70,160,0.4)", "rgba(13,13,13,0.98)"],
  tools: ["transparent", "rgba(20,100,90,0.4)", "rgba(13,13,13,0.98)"],
  safety: ["transparent", "rgba(160,90,20,0.4)", "rgba(13,13,13,0.98)"],
};

const DEFAULT_GRADIENT: [string, string, string] = [
  "transparent",
  "rgba(40,40,40,0.5)",
  "rgba(13,13,13,0.98)",
];

// Category icons
const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  research: "flask",
  industry: "business",
  tools: "construct",
  safety: "shield-checkmark",
};

interface FeedCardProps {
  article: Article;
  cardHeight: number;
}

export default function FeedCard({ article, cardHeight }: FeedCardProps) {
  const { colors, isDark } = useTheme();
  const [saved, setSaved] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const cat = article.category || "";
  const catColor = CategoryColors[cat]?.primary || colors.textSecondary;
  const catBg = CategoryColors[cat]?.bg || "transparent";
  const gradientColors = CATEGORY_GRADIENTS[cat] || DEFAULT_GRADIENT;
  const catIcon = CATEGORY_ICONS[cat] || "newspaper";

  // Entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const categorySlide = useRef(new Animated.Value(-20)).current;
  const bookmarkScale = useRef(new Animated.Value(1)).current;
  const glowPulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    isArticleSaved(article.id).then(setSaved);
  }, [article.id]);

  // Run entrance animations
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    categorySlide.setValue(-20);

    Animated.stagger(100, [
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        damping: 15,
        stiffness: 120,
        useNativeDriver: true,
      }),
      Animated.spring(categorySlide, {
        toValue: 0,
        damping: 12,
        stiffness: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Glow pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, {
          toValue: 0.7,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(glowPulse, {
          toValue: 0.4,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [article.id]);

  const handleReadArticle = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await WebBrowser.openBrowserAsync(article.url, {
      presentationStyle: WebBrowser.WebBrowserPresentationStyle.AUTOMATIC,
      controlsColor: catColor,
    });
  }, [article.url, catColor]);

  const handleShare = useCallback(async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share({
      title: article.title,
      message: `${article.title}\n\n${article.url}`,
      url: article.url,
    });
  }, [article.title, article.url]);

  const handleBookmark = useCallback(async () => {
    // Bounce animation
    Animated.sequence([
      Animated.spring(bookmarkScale, {
        toValue: 1.4,
        damping: 4,
        stiffness: 300,
        useNativeDriver: true,
      }),
      Animated.spring(bookmarkScale, {
        toValue: 1,
        damping: 6,
        stiffness: 200,
        useNativeDriver: true,
      }),
    ]).start();

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (saved) {
      await removeArticle(article.id);
      setSaved(false);
    } else {
      await saveArticle(article);
      setSaved(true);
    }
  }, [saved, article, bookmarkScale]);

  const imageHeight = cardHeight * 0.42;

  return (
    <View style={[styles.container, { height: cardHeight }]}>
      {/* Hero image area */}
      <View style={[styles.imageContainer, { height: imageHeight }]}>
        {/* Placeholder */}
        {!imageLoaded && (
          <View
            style={[
              styles.imagePlaceholder,
              { height: imageHeight, backgroundColor: isDark ? "#1a1a1a" : "#e0dcd4" },
            ]}
          />
        )}

        <Image
          source={{ uri: getArticleImage(article) }}
          style={[styles.heroImage, { height: imageHeight }]}
          onLoad={() => setImageLoaded(true)}
          resizeMode="cover"
        />

        {/* Category-tinted gradient overlay */}
        <LinearGradient
          colors={gradientColors}
          locations={[0, 0.5, 1]}
          style={[styles.imageGradient, { height: imageHeight }]}
        />

        {/* Floating category glow */}
        <Animated.View
          style={[
            styles.categoryGlow,
            { backgroundColor: catColor, opacity: glowPulse },
          ]}
        />

        {/* Top bar: source + time */}
        <Animated.View style={[styles.topBar, { opacity: fadeAnim }]}>
          {article.source && (
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceBadgeText}>{article.source}</Text>
            </View>
          )}
          {article.published_at && (
            <View style={styles.timeBadge}>
              <Ionicons name="time-outline" size={11} color="rgba(255,255,255,0.7)" />
              <Text style={styles.timeBadgeText}>
                {timeAgo(article.published_at)}
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Category icon floating */}
        <Animated.View
          style={[
            styles.floatingCategoryIcon,
            {
              backgroundColor: catColor,
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <Ionicons name={catIcon} size={18} color="#0D0D0D" />
        </Animated.View>
      </View>

      {/* Content area */}
      <Animated.View
        style={[
          styles.content,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Category tag */}
        {cat && CategoryLabels[cat] && (
          <Animated.View
            style={[
              styles.categoryRow,
              { transform: [{ translateX: categorySlide }] },
            ]}
          >
            <View style={[styles.categoryTag, { backgroundColor: catBg, borderColor: catColor }]}>
              <View style={[styles.categoryDot, { backgroundColor: catColor }]} />
              <Text style={[styles.categoryText, { color: catColor }]}>
                {CategoryLabels[cat]}
              </Text>
            </View>
            {/* Relevance indicator */}
            <View style={styles.relevanceRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <View
                  key={i}
                  style={[
                    styles.relevanceDot,
                    {
                      backgroundColor:
                        i <= Math.round((article.relevance_score || 0) * 5)
                          ? catColor
                          : isDark
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(0,0,0,0.1)",
                    },
                  ]}
                />
              ))}
              <Text style={[styles.relevanceLabel, { color: colors.textSecondary }]}>
                relevance
              </Text>
            </View>
          </Animated.View>
        )}

        {/* Headline */}
        <Text style={[styles.headline, { color: colors.text }]} numberOfLines={3}>
          {article.title}
        </Text>

        {/* Summary */}
        {article.summary && (
          <Text
            style={[styles.summary, { color: colors.textSecondary }]}
            numberOfLines={3}
          >
            {article.summary}
          </Text>
        )}

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* Action buttons */}
        <View style={styles.actions}>
          {/* Read Full Article */}
          <TouchableOpacity
            onPress={handleReadArticle}
            activeOpacity={0.8}
            style={[styles.readButton, { backgroundColor: catColor }]}
          >
            <Ionicons name="open-outline" size={16} color="#0D0D0D" />
            <Text style={styles.readButtonText}>Read Article</Text>
            <Ionicons name="arrow-forward" size={14} color="#0D0D0D" />
          </TouchableOpacity>

          {/* Share */}
          <TouchableOpacity
            onPress={handleShare}
            activeOpacity={0.7}
            style={[
              styles.iconButton,
              {
                backgroundColor: isDark
                  ? "rgba(255,255,255,0.08)"
                  : "rgba(0,0,0,0.06)",
                borderColor: isDark
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(0,0,0,0.06)",
              },
            ]}
          >
            <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Bookmark with bounce */}
          <Animated.View style={{ transform: [{ scale: bookmarkScale }] }}>
            <TouchableOpacity
              onPress={handleBookmark}
              activeOpacity={0.7}
              style={[
                styles.iconButton,
                {
                  backgroundColor: saved
                    ? catColor
                    : isDark
                    ? "rgba(255,255,255,0.08)"
                    : "rgba(0,0,0,0.06)",
                  borderColor: saved
                    ? catColor
                    : isDark
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.06)",
                },
              ]}
            >
              <Ionicons
                name={saved ? "bookmark" : "bookmark-outline"}
                size={20}
                color={saved ? "#0D0D0D" : colors.textSecondary}
              />
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.View>

      {/* Bottom swipe indicator */}
      <View style={styles.swipeHint}>
        <View style={[styles.swipeLine, { backgroundColor: colors.textSecondary }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_WIDTH,
  },
  // ── Hero Image ──
  imageContainer: {
    width: "100%",
    overflow: "hidden",
    position: "relative",
  },
  imagePlaceholder: {
    position: "absolute",
    width: "100%",
    zIndex: 0,
  },
  heroImage: {
    width: "100%",
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  categoryGlow: {
    position: "absolute",
    bottom: -30,
    left: SCREEN_WIDTH * 0.3,
    width: SCREEN_WIDTH * 0.4,
    height: 60,
    borderRadius: 30,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 40,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  topBar: {
    position: "absolute",
    top: Platform.OS === "ios" ? 8 : 12,
    left: 16,
    right: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sourceBadge: {
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
  },
  sourceBadgeText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  timeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 0.5,
    borderColor: "rgba(255,255,255,0.1)",
  },
  timeBadgeText: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  floatingCategoryIcon: {
    position: "absolute",
    bottom: -20,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  // ── Content ──
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
  },
  categoryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  categoryTag: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  categoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  relevanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  relevanceDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  relevanceLabel: {
    fontSize: 9,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginLeft: 4,
    opacity: 0.5,
  },
  headline: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 28,
    lineHeight: 35,
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
  },
  summary: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    lineHeight: 22,
    marginBottom: Spacing.base,
  },
  spacer: {
    flex: 1,
  },
  // ── Actions ──
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: Spacing.base,
  },
  readButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: Radius.xl || 24,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  readButtonText: {
    color: "#0D0D0D",
    fontSize: 13,
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  iconButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  // ── Swipe Hint ──
  swipeHint: {
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 6 : 10,
  },
  swipeLine: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.15,
  },
});
