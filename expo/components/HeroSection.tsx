import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';

export default function HeroSection() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  return (
    <View style={[styles.hero, isDesktop && styles.heroDesktop]}>
      {/* Gradient overlay */}
      <View style={styles.overlay} />

      <Animated.View
        style={[
          styles.content,
          isDesktop && styles.contentDesktop,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* Badge */}
        <View style={styles.badge}>
          <Text style={styles.badgeText}>🌾 Marketplace agricole</Text>
        </View>

        <Text style={[styles.title, isDesktop && styles.titleDesktop]}>
          Achetez directement{'\n'}aux producteurs
        </Text>

        <Text style={[styles.subtitle, isDesktop && styles.subtitleDesktop]}>
          Mil, arachide, bétail, fruits & légumes…{'\n'}
          Produits frais du Sénégal et du Mali, sans intermédiaire.
        </Text>

        {/* Stats */}
        <View style={styles.stats}>
          {[
            { value: '500+', label: 'Producteurs' },
            { value: '2 000+', label: 'Produits' },
            { value: '2 pays', label: 'Sénégal · Mali' },
          ].map((stat) => (
            <View key={stat.label} style={styles.statItem}>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* CTAs */}
        <View style={styles.ctas}>
          <TouchableOpacity
            style={styles.ctaPrimary}
            onPress={() => router.push('/onboarding/register' as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaPrimaryText}>S'inscrire gratuitement</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ctaSecondary}
            onPress={() => router.push('/login' as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.ctaSecondaryText}>Se connecter</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Decorative circles */}
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />
      <View style={[styles.circle, styles.circle3]} />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    backgroundColor: Colors.primary,
    minHeight: 380,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
  },
  heroDesktop: {
    minHeight: 460,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.18)',
  },
  content: {
    padding: 28,
    zIndex: 2,
  },
  contentDesktop: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
    paddingVertical: 48,
  },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  badgeText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 38,
    marginBottom: 12,
  },
  titleDesktop: {
    fontSize: 40,
    lineHeight: 50,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 22,
    marginBottom: 24,
  },
  subtitleDesktop: {
    fontSize: 17,
    lineHeight: 26,
  },
  stats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 28,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFD23F',
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
    textAlign: 'center',
  },
  ctas: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  ctaPrimary: {
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 50,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaPrimaryText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 15,
  },
  ctaSecondary: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  ctaSecondaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  // Decorative circles
  circle: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  circle1: { width: 220, height: 220, top: -60, right: -60 },
  circle2: { width: 140, height: 140, bottom: -40, left: 20 },
  circle3: { width: 80, height: 80, top: 40, left: '60%' },
});
