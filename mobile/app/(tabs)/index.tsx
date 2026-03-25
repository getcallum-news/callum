import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "../../hooks/useTheme";
import { fetchArticles } from "../../lib/api";
import FeedCard from "../../components/FeedCard";
import { Spacing } from "../../constants/theme";
import type { Article } from "../../types/article";

const TAB_BAR_HEIGHT = Platform.OS === "ios" ? 88 : 64;
const SCREEN_HEIGHT = Dimensions.get("window").height;

export default function FeedScreen() {
  const { colors, isDark } = useTheme();
  const [articles, setArticles] = useState<Article[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const SAFE_AREA_TOP = Platform.OS === "ios" ? 50 : 30;
  const cardHeight = SCREEN_HEIGHT - TAB_BAR_HEIGHT - SAFE_AREA_TOP;

  // Loading pulse animation
  const loadingPulse = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(loadingPulse, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(loadingPulse, {
          toValue: 0.6,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  const loadArticles = useCallback(
    async (p: number, refresh = false) => {
      try {
        const data = await fetchArticles({ page: p, limit: 15 });
        if (refresh) {
          setArticles(data.articles);
        } else {
          setArticles((prev) => {
            const existingIds = new Set(prev.map((a) => a.id));
            const newArticles = data.articles.filter(
              (a) => !existingIds.has(a.id)
            );
            return [...prev, ...newArticles];
          });
        }
        setHasMore(p < data.pages);
      } catch (err) {
        console.error("Failed to fetch articles:", err);
      }
    },
    []
  );

  useEffect(() => {
    setLoading(true);
    loadArticles(1, true).finally(() => setLoading(false));
  }, [loadArticles]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    setPage(1);
    await loadArticles(1, true);
    setRefreshing(false);
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, [loadArticles]);

  const handleEndReached = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    setPage(nextPage);
    await loadArticles(nextPage);
    setLoadingMore(false);
  }, [page, loadingMore, hasMore, loadArticles]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const renderItem = useCallback(
    ({ item }: { item: Article }) => (
      <FeedCard article={item} cardHeight={cardHeight} />
    ),
    [cardHeight]
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: cardHeight,
      offset: cardHeight * index,
      index,
    }),
    [cardHeight]
  );

  if (loading && articles.length === 0) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.loadingContainer}>
          <Animated.Text
            style={[
              styles.loadingLogo,
              { color: colors.text, opacity: loadingPulse },
            ]}
          >
            Callum
          </Animated.Text>
          <View style={styles.loadingDots}>
            {[0, 1, 2].map((i) => (
              <View
                key={i}
                style={[
                  styles.loadingDot,
                  { backgroundColor: colors.textSecondary },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Curating your AI briefing...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top"]}
    >
      {/* Progress counter - floating */}
      <View style={styles.progressOverlay}>
        <LinearGradient
          colors={[
            isDark ? "rgba(13,13,13,0.9)" : "rgba(240,236,228,0.9)",
            isDark ? "rgba(13,13,13,0)" : "rgba(240,236,228,0)",
          ]}
          style={styles.progressGradient}
        >
          <View style={styles.progressContent}>
            <Text style={[styles.progressLogo, { color: colors.text }]}>
              Callum
            </Text>
            <View style={styles.progressCounter}>
              <Text style={[styles.progressNumber, { color: colors.text }]}>
                {currentIndex + 1}
              </Text>
              <Text
                style={[styles.progressSlash, { color: colors.textSecondary }]}
              >
                /
              </Text>
              <Text
                style={[styles.progressTotal, { color: colors.textSecondary }]}
              >
                {articles.length}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <FlatList
        ref={flatListRef}
        data={articles}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        pagingEnabled
        snapToInterval={cardHeight}
        snapToAlignment="start"
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.text}
            colors={[colors.text]}
          />
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={[styles.footer, { height: cardHeight }]}>
              <ActivityIndicator size="small" color={colors.textSecondary} />
              <Text
                style={[styles.footerText, { color: colors.textSecondary }]}
              >
                Loading more stories...
              </Text>
            </View>
          ) : !hasMore ? (
            <View style={[styles.footer, { height: cardHeight }]}>
              <View style={styles.footerContent}>
                <Text style={styles.footerEmoji}>✨</Text>
                <Text style={[styles.footerTitle, { color: colors.text }]}>
                  All caught up!
                </Text>
                <Text
                  style={[styles.footerText, { color: colors.textSecondary }]}
                >
                  You've seen all the latest AI news.{"\n"}Pull down to
                  refresh.
                </Text>
              </View>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // ── Loading ──
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
  },
  loadingLogo: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 42,
    letterSpacing: 3,
    textAlign: "center",
  },
  loadingDots: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  loadingText: {
    fontSize: 13,
    letterSpacing: 1,
    textTransform: "uppercase",
    textAlign: "center",
  },
  // ── Progress overlay ──
  progressOverlay: {
    position: "absolute",
    top: Platform.OS === "ios" ? 50 : 30,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  progressGradient: {
    paddingHorizontal: Spacing.xl,
    paddingTop: 4,
    paddingBottom: 20,
  },
  progressContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  progressLogo: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 20,
    letterSpacing: 1,
  },
  progressCounter: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  progressNumber: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 18,
  },
  progressSlash: {
    fontSize: 14,
    marginHorizontal: 2,
    opacity: 0.4,
  },
  progressTotal: {
    fontSize: 14,
    opacity: 0.5,
  },
  // ── Footer ──
  footer: {
    alignItems: "center",
    justifyContent: "center",
  },
  footerContent: {
    alignItems: "center",
    gap: Spacing.sm,
  },
  footerEmoji: {
    fontSize: 56,
    marginBottom: Spacing.sm,
  },
  footerTitle: {
    fontFamily: "CormorantGaramond_700Bold",
    fontSize: 28,
  },
  footerText: {
    fontSize: 14,
    letterSpacing: 0.3,
    textAlign: "center",
    lineHeight: 22,
  },
});
