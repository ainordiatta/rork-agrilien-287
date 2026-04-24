import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, useWindowDimensions } from 'react-native';
import Colors from '@/constants/colors';

function SkeletonBox({ width, height, borderRadius = 8, style }: {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: object;
}) {
  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmer]);

  const opacity = shimmer.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.75] });

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: Colors.primary + '30', opacity },
        style,
      ]}
    />
  );
}

export default function SkeletonCard() {
  const { width: screenWidth } = useWindowDimensions();
  const numCols = screenWidth >= 1024 ? 4 : screenWidth >= 768 ? 3 : 2;
  const gap = 12;
  const padding = 12;
  const cardWidth = (screenWidth - padding * 2 - gap * (numCols - 1)) / numCols;

  return (
    <View style={[styles.card, { width: cardWidth, marginBottom: gap }]}>
      <SkeletonBox width="100%" height={cardWidth} borderRadius={0} />
      <View style={styles.info}>
        <SkeletonBox width="85%" height={14} />
        <SkeletonBox width="60%" height={12} style={{ marginTop: 6 }} />
        <SkeletonBox width="50%" height={18} style={{ marginTop: 8 }} />
        <SkeletonBox width="40%" height={20} borderRadius={10} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

export function SkeletonGrid({ count = 6 }: { count?: number }) {
  const { width: screenWidth } = useWindowDimensions();
  const numCols = screenWidth >= 1024 ? 4 : screenWidth >= 768 ? 3 : 2;
  const gap = 12;

  return (
    <View style={[styles.grid, { gap }]}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
  },
  info: {
    padding: 12,
    gap: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
  },
});
