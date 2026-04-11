import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { WifiOff, RefreshCw } from 'lucide-react-native';
import { useRef, useEffect } from 'react';
import { useOffline } from '@/contexts/OfflineContext';

const OfflineBanner = React.memo(() => {
  const { isOnline, isSyncing, lastSyncDate, forceSync } = useOffline();
  const slideAnim = useRef(new Animated.Value(-60)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOnline ? -60 : 0,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [isOnline, slideAnim]);

  if (isOnline) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <View style={styles.content}>
        <WifiOff size={16} color="#fff" />
        <View style={styles.textContainer}>
          <Text style={styles.title}>Mode hors-ligne</Text>
          {!!lastSyncDate && (
            <Text style={styles.subtitle}>
              Dernière synchro: {new Date(lastSyncDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={forceSync} style={styles.syncBtn} disabled={isSyncing} activeOpacity={0.7}>
          <RefreshCw size={16} color="#fff" />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
});

export default OfflineBanner;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#EF476F',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#fff',
  },
  subtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
  },
  syncBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
});
