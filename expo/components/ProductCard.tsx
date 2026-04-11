import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Star, Zap, Package } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { Product } from '@/types';
import { formatPrice } from '@/mocks/data';
import { MEASUREMENT_UNITS } from '@/constants/units';

interface ProductCardProps {
  item: Product;
}

const ProductCard = React.memo(({ item }: ProductCardProps) => {
  const router = useRouter();
  const unitLabel = MEASUREMENT_UNITS[item.unit] || item.unit;

  const handlePress = useCallback(() => {
    router.push(`/product/${item.id}` as any);
  }, [router, item.id]);

  const handleShopPress = useCallback(() => {
    router.push(`/shop/${item.shop.id}` as any);
  }, [router, item.shop.id]);

  return (
    <TouchableOpacity
      style={styles.productCard}
      onPress={handlePress}
      activeOpacity={0.8}
      testID={`product-card-${item.id}`}
    >
      {item.isBoosted && (
        <View style={styles.boostedBadge}>
          <Zap size={12} color={Colors.warning} fill={Colors.warning} />
          <Text style={styles.boostedText}>Sponsorisé</Text>
        </View>
      )}
      <Image source={{ uri: item.images[0] }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <TouchableOpacity style={styles.shopInfo} onPress={handleShopPress}>
          <Text style={styles.shopName} numberOfLines={1}>
            {item.shop.name}
          </Text>
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
  boostedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 1,
  },
  boostedText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.warning,
  },
  productImage: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.border,
  },
  productInfo: {
    padding: 12,
    gap: 6,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600' as const,
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
    fontWeight: '600' as const,
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
    fontWeight: 'bold' as const,
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
    fontWeight: '600' as const,
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
  availabilityTag: {
    backgroundColor: Colors.primary + '20',
  },
  availableNowTag: {
    backgroundColor: Colors.success + '20',
  },
  lowStockTag: {
    backgroundColor: Colors.error + '20',
  },
  tagText: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: Colors.text,
  },
});
