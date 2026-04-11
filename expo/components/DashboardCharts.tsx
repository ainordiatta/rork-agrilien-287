import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react-native';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ChartDataPoint {
  label: string;
  value: number;
}

interface MiniBarChartProps {
  data: ChartDataPoint[];
  color?: string;
  height?: number;
}

export const MiniBarChart = React.memo(({ data, color = Colors.primary, height = 120 }: MiniBarChartProps) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  const animValues = useRef(data.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = data.map((item, index) =>
      Animated.timing(animValues[index], {
        toValue: item.value / maxValue,
        duration: 600 + index * 100,
        useNativeDriver: false,
      })
    );
    Animated.stagger(80, animations).start();
  }, [data, maxValue, animValues]);

  if (data.length === 0) {
    return (
      <View style={[styles.chartEmpty, { height }]}>
        <Text style={styles.chartEmptyText}>Aucune donnée</Text>
      </View>
    );
  }

  return (
    <View style={[styles.barChartContainer, { height }]}>
      <View style={styles.barChartBars}>
        {data.map((item, index) => {
          const barHeight = animValues[index].interpolate({
            inputRange: [0, 1],
            outputRange: [4, height - 30],
          });
          return (
            <View key={index} style={styles.barWrapper}>
              <View style={styles.barTrack}>
                <Animated.View
                  style={[
                    styles.bar,
                    {
                      height: barHeight,
                      backgroundColor: color,
                      opacity: 0.7 + (item.value / maxValue) * 0.3,
                    },
                  ]}
                />
              </View>
              <Text style={styles.barLabel} numberOfLines={1}>{item.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
});

interface TrendIndicatorProps {
  current: number;
  previous: number;
  suffix?: string;
}

export const TrendIndicator = React.memo(({ current, previous, suffix = '' }: TrendIndicatorProps) => {
  const diff = previous > 0 ? ((current - previous) / previous) * 100 : 0;
  const isPositive = diff > 0;
  const isNeutral = diff === 0;

  return (
    <View style={[
      styles.trendBadge,
      isPositive ? styles.trendPositive : isNeutral ? styles.trendNeutral : styles.trendNegative,
    ]}>
      {isPositive ? (
        <TrendingUp size={12} color={Colors.success} />
      ) : isNeutral ? (
        <Minus size={12} color={Colors.textSecondary} />
      ) : (
        <TrendingDown size={12} color={Colors.error} />
      )}
      <Text style={[
        styles.trendText,
        isPositive ? styles.trendTextPositive : isNeutral ? styles.trendTextNeutral : styles.trendTextNegative,
      ]}>
        {isPositive ? '+' : ''}{diff.toFixed(1)}%{suffix}
      </Text>
    </View>
  );
});

interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface SimpleDonutProps {
  segments: DonutSegment[];
  size?: number;
}

export const SimpleDonut = React.memo(({ segments, size = 140 }: SimpleDonutProps) => {
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  if (total === 0) {
    return (
      <View style={[styles.donutContainer, { width: size, height: size }]}>
        <Text style={styles.chartEmptyText}>Aucune donnée</Text>
      </View>
    );
  }

  let currentAngle = 0;

  return (
    <View style={styles.donutWrapper}>
      <View style={[styles.donutContainer, { width: size, height: size }]}>
        {segments.map((segment, index) => {
          const percentage = (segment.value / total) * 100;
          const angle = (segment.value / total) * 360;
          const rotation = currentAngle;
          currentAngle += angle;

          return (
            <View
              key={index}
              style={[
                styles.donutSegment,
                {
                  width: size,
                  height: size,
                  borderRadius: size / 2,
                  borderWidth: size * 0.15,
                  borderColor: 'transparent',
                  borderTopColor: segment.color,
                  borderRightColor: percentage > 25 ? segment.color : 'transparent',
                  borderBottomColor: percentage > 50 ? segment.color : 'transparent',
                  borderLeftColor: percentage > 75 ? segment.color : 'transparent',
                  transform: [{ rotate: `${rotation}deg` }],
                },
              ]}
            />
          );
        })}
        <View style={[styles.donutCenter, { width: size * 0.6, height: size * 0.6, borderRadius: size * 0.3 }]}>
          <Text style={styles.donutTotal}>{total.toLocaleString('fr-FR')}</Text>
          <Text style={styles.donutTotalLabel}>FCFA</Text>
        </View>
      </View>
      <View style={styles.donutLegend}>
        {segments.map((segment, index) => (
          <View key={index} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: segment.color }]} />
            <Text style={styles.legendLabel} numberOfLines={1}>{segment.label}</Text>
            <Text style={styles.legendValue}>{((segment.value / total) * 100).toFixed(0)}%</Text>
          </View>
        ))}
      </View>
    </View>
  );
});

interface StatCardProps {
  title: string;
  value: string;
  icon: React.ReactNode;
  bgColor: string;
  trend?: { current: number; previous: number };
}

export const StatCard = React.memo(({ title, value, icon, bgColor, trend }: StatCardProps) => {
  return (
    <View style={[styles.statCard, { backgroundColor: bgColor }]}>
      <View style={styles.statCardHeader}>
        {icon}
        {trend && <TrendIndicator current={trend.current} previous={trend.previous} />}
      </View>
      <Text style={styles.statCardValue}>{value}</Text>
      <Text style={styles.statCardTitle}>{title}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  chartEmpty: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
  },
  chartEmptyText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  barChartContainer: {
    width: '100%',
  },
  barChartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    flex: 1,
    paddingHorizontal: 4,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  barTrack: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    width: '100%',
  },
  bar: {
    width: '60%',
    maxWidth: 32,
    borderRadius: 6,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  trendPositive: {
    backgroundColor: Colors.success + '15',
  },
  trendNeutral: {
    backgroundColor: Colors.border + '40',
  },
  trendNegative: {
    backgroundColor: Colors.error + '15',
  },
  trendText: {
    fontSize: 11,
    fontWeight: '600' as const,
  },
  trendTextPositive: {
    color: Colors.success,
  },
  trendTextNeutral: {
    color: Colors.textSecondary,
  },
  trendTextNegative: {
    color: Colors.error,
  },
  donutWrapper: {
    alignItems: 'center',
    gap: 16,
  },
  donutContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  donutSegment: {
    position: 'absolute',
  },
  donutCenter: {
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
  },
  donutTotal: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  donutTotalLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  donutLegend: {
    gap: 6,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    flex: 1,
    fontSize: 12,
    color: Colors.text,
  },
  legendValue: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  statCard: {
    flex: 1,
    minWidth: (SCREEN_WIDTH - 52) / 2,
    padding: 16,
    borderRadius: 16,
    gap: 8,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statCardValue: {
    fontSize: 20,
    fontWeight: '800' as const,
    color: Colors.text,
  },
  statCardTitle: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
});
