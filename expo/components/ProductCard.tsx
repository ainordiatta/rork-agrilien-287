import React, { useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Linking, Platform } from 'react-native';
import { Star, Zap, Package, Share2 } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { Product } from '@/types';
import { formatPrice } from '@/mocks/data';
import { MEASUREMENT_UNITS } from '@/constants/units';

interface ProductCardProps {
  item: Product;
  distanceKm?: number; // #22 Produits près de moi
}

// #7 Partage WhatsApp
function shareOnWhatsApp(item: Product) {
  const text = encodeURIComponent(
    `🌾 *${item.name}* — ${formatPrice(item.price, item.currency)}\n` +
    `Vendeur : ${item.shop.name} (⭐ ${item.shop.rating.toFixed(1)})\n` +
    `Disponible sur AgriLien 👉 https://dist-xi-six-80.vercel.app`
  );
  const url = Platform.OS === 'web'
    ? `https://wa.me/?text=${text}`
    : `whatsapp://send?text=${text}`;
  void Linking.openURL(url);
}

const ProductCard = React.memo(({ item, distanceKm }: ProductCardProps) => {
  const router = useRouter();
  const unitLabel = MEASUREMENT_UNITS[item.unit] || item.unit;

  // #5 Micro-animations
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const shareAnim = useRef(new Animated.Value(1)).current;

  const handlePress = useCallback(() => {
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 80, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 200, friction: 6, useNativeDriver: true }),
    ]).start();
    router.push(`/product/${item.id}` as any);
  }, [router, item.id, scaleAnim]);

  const handleShopPress = useCallback(() => {
    router.push(`/shop/${item.shop.id}` as any);
  }, [router, item.shop.id]);

  const handleWhatsApp = useCallback(() => {
    Animated.sequence([
      Animated.spring(shareAnim, { toValue: 1.25, tension: 300, friction: 5, useNativeDriver: true }),
      Animated.spring(shareAnim, { toValue: 1, tension: 200, friction: 6, useNativeDriver: true }),
    ]).start();
    shareOnWhatsApp(item);
  }, [item, shareAnim]);

  return (
    <Animated.View style={[styles.productCard, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9} style={styles.cardTouchable}>
        {item.isBoosted && (
          <View style={styles.boostedBadge}>
            <Zap size={12} color={Colors.warning} fill={Colors.warning} />
            <Text style={styles.boostedText}>Sponsorisé</Text>
          </View>
        )}

        {/* #7 Bouton WhatsApp */}
        <Animated.View style={[styles.whatsappButton, { transform: [{ scale: shareAnim }] }]}>
          <TouchableOpacity onPress={handleWhatsApp} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <View style={styles.whatsappIcon}>
              <Share2 size={13} color="#fff" />
            </View>
          </TouchableOpacity>
        </Animated.View>

        <Image source={{ uri: item.images[0] }} style={styles.productImage} />

        {/* #22 Badge distance */}
        {distanceKm !== undefined && (
          <View style={styles.distanceBadge}>
            <Text style={styles.distanceText}>📍 {distanceKm < 1 ? '<1' : distanceKm} km</Text>
          </View>
        )}

        <View style={styles.productInfo}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>

          <TouchableOpacity style={styles.shopInfo} onPress={handleShopPress}>
            <Text style={styles.shopName} numberOfLines={1}>{item.shop.name}</Text>
            <View style={styles.rating}>
              <Star size={12} color={Colors.warning} fill={Colors.warning} />
              <Text style={styles.ratingText}>{item.shop.rating.toFixed(1)}</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.priceRow}>
            <Text style={styles.price}>{formatPrice(item.price, item.currency)}</Text>
            <View style={styles.unitBadge}>
              <Package size={10} color={Colors.primary} />
              <Text style={styles.unitText}>/{unitLabel}</Text>
            </View>
          </View>

          <View style={styles.tags}>
            {(item.estimatedAvailabilityDate || item.harvestDate) && (
              <View style={[styles.tag, styles.availabilityTag]}>
                <Text style={styles.tagText}>
                  {item.availability === 'prochaine_recolte'
                    ? `Récolte: ${new Date(item.harvestDate || item.estimatedAvailabilityDate!).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
                    : `Dispo: ${new Date(item.estimatedAvailabilityDate || item.harvestDate!).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`}
                </Text>
              </View>
            )}
            {!item.estimatedAvailabilityDate && !item.harvestDate && item.availability === 'disponible' && (
              <View style={[styles.tag, styles.availableNowTag]}>
                <Text style={styles.tagText}>Disponible</Text>
              </View>
            )}
            {item.stock < 10 && item.stock > 0 && (
              <View style={[styles.tag, styles.lowStockTag]}>
                <Text style={styles.tagText}>Stock limité</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default ProductCard;

const styles = StyleSheet.create({
  productCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  cardTouchable: {
    flex: 1,
  },
  boostedBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 2,
  },
  boostedText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.warning,
  },
  whatsappButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 3,
  },
  whatsappIcon: {
    backgroundColor: '#25D366',
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  productImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.border,
  },
  distanceBadge: {
    position: 'absolute',
    bottom: 85,
    left: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  distanceText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  productInfo: {
    padding: 12,
    gap: 6,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    minHeight: 36,
  },
  shopInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  shopName: {
    fontSize: 12,
    color: Colors.textSecondary,
    flex: 1,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.text,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  unitBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primary + '15',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unitText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.primary,
  },
  tags: {
    flexDirection: 'row',
    gap: 6,
    flexWrap: 'wrap',
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  availabilityTag: { backgroundColor: Colors.primary + '20' },
  availableNowTag: { backgroundColor: Colors.success + '20' },
  lowStockTag: { backgroundColor: Colors.error + '20' },
  tagText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.text,
  },
});
