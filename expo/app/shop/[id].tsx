import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Star, MapPin, Phone, Mail } from 'lucide-react-native';
import { useMemo } from 'react';
import Colors from '@/constants/colors';
import { mockShops, mockProducts, formatPrice } from '@/mocks/data';
import { Product, Shop, Review } from '@/types';
import { useApp } from '@/contexts/AppContext';
import { useInventory } from '@/contexts/InventoryContext';
import { useReviews } from '@/contexts/ReviewsContext';

export default function ShopDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useApp();
  const { products: inventoryProducts } = useInventory();
  const { getShopReviews, getShopRating } = useReviews();

  const shopRating = useMemo(() => {
    if (!id) return { average: 0, count: 0 };
    return getShopRating(id);
  }, [id, getShopRating]);

  const shop = useMemo(() => {
    const mockShop = mockShops.find((s) => s.id === id);
    if (mockShop) return { ...mockShop, rating: shopRating.average || mockShop.rating, reviewCount: shopRating.count || mockShop.reviewCount };

    if (user?.id === id && user?.role === 'producteur') {
      return {
        id: user.id,
        name: user.shopInfo?.name || user.name,
        specialties: user.shopInfo?.specialties || user.specialties || [],
        city: user.shopInfo?.city || user.city,
        country: user.country,
        email: user.email,
        phone: user.phone,
        photo: user.shopPhoto,
        rating: shopRating.average || 0,
        reviewCount: shopRating.count || 0,
        description: '',
        createdAt: user.createdAt,
      };
    }

    return null;
  }, [id, user, shopRating]);

  const shopProducts = useMemo(() => {
    const mockProds = mockProducts.filter((p) => p.shopId === id);
    
    if (user?.id === id && user?.role === 'producteur') {
      const inventoryProds = inventoryProducts.map((invProduct) => {
        const shopInfo: Shop = {
          id: user.id,
          name: user.shopInfo?.name || user.name,
          specialties: user.shopInfo?.specialties || user.specialties || [],
          city: user.shopInfo?.city || user.city,
          country: user.country,
          email: user.email,
          phone: user.phone,
          photo: user.shopPhoto,
          rating: 4.5,
          reviewCount: 0,
          createdAt: user.createdAt,
        };

        return {
          id: invProduct.id,
          name: invProduct.name,
          description: invProduct.description,
          price: invProduct.price,
          currency: 'XOF',
          images: invProduct.images.length > 0 ? invProduct.images : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'],
          category: invProduct.category,
          subcategory: invProduct.subcategory,
          condition: 'new' as const,
          stock: invProduct.quantity,
          shopId: user.id,
          shop: shopInfo,
          deliveryMethods: ['both' as const],
          isBoosted: false,
          unit: 'unite' as const,
          pricingModel: 'fixed' as const,
          availability: 'disponible' as const,
          createdAt: invProduct.createdAt,
        };
      });
      return [...mockProds, ...inventoryProds];
    }
    
    return mockProds;
  }, [id, user, inventoryProducts]);

  const shopReviews = useMemo(() => {
    if (!id) return [];
    return getShopReviews(id);
  }, [id, getShopReviews]);

  if (!shop) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Exploitation non trouvée</Text>
      </View>
    );
  }

  const renderProductCard = ({ item }: { item: Product }) => (
    <TouchableOpacity
      style={styles.productCard}
      onPress={() => router.push(`/product/${item.id}`)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.images[0] }} style={styles.productImage} />
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.productPrice}>{formatPrice(item.price, item.currency)}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderReviewCard = ({ item }: { item: Review }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        {item.userPhoto ? (
          <Image source={{ uri: item.userPhoto }} style={styles.reviewUserPhoto} />
        ) : (
          <View style={[styles.reviewUserPhoto, styles.reviewUserPhotoPlaceholder]} />
        )}
        <View style={styles.reviewHeaderInfo}>
          <Text style={styles.reviewUserName}>{item.userName}</Text>
          <View style={styles.reviewRating}>
            {[...Array(5)].map((_, index) => (
              <Star
                key={index}
                size={14}
                color={index < item.rating ? Colors.warning : Colors.border}
                fill={index < item.rating ? Colors.warning : 'transparent'}
              />
            ))}
          </View>
        </View>
        <Text style={styles.reviewDate}>
          {new Date(item.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
        </Text>
      </View>
      {!!item.comment && (
        <Text style={styles.reviewComment}>{item.comment}</Text>
      )}
      {item.images && item.images.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewImages}>
          {item.images.map((image, index) => (
            <Image key={index} source={{ uri: image }} style={styles.reviewImage} />
          ))}
        </ScrollView>
      )}
      {item.verified && (
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>✓ Achat vérifié</Text>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        {!!shop.photo && (
          <Image source={{ uri: shop.photo }} style={styles.shopImage} />
        )}
        <View style={styles.headerContent}>
          <Text style={styles.shopName}>{shop.name}</Text>
          <View style={styles.specialtiesContainer}>
            {shop.specialties.map((specialty, index) => (
              <Text key={index} style={styles.specialtyChip}>{specialty}</Text>
            ))}
          </View>
          <View style={styles.rating}>
            <Star size={20} color={Colors.warning} fill={Colors.warning} />
            <Text style={styles.ratingText}>
              {shop.rating.toFixed(1)} ({shop.reviewCount} avis)
            </Text>
          </View>
        </View>
      </View>

      {!!shop.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>À propos</Text>
          <Text style={styles.description}>{shop.description}</Text>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <MapPin size={20} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{shop.city}</Text>
          </View>
          <View style={styles.infoRow}>
            <Phone size={20} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{shop.phone}</Text>
          </View>
          <View style={styles.infoRow}>
            <Mail size={20} color={Colors.textSecondary} />
            <Text style={styles.infoText}>{shop.email}</Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          Produits ({shopProducts.length})
        </Text>
        <FlatList
          data={shopProducts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          scrollEnabled={false}
          columnWrapperStyle={styles.productRow}
          renderItem={renderProductCard}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Aucun produit agricole disponible</Text>
          }
        />
      </View>

      {shopReviews.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Avis ({shopReviews.length})
          </Text>
          <FlatList
            data={shopReviews}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            renderItem={renderReviewCard}
            ItemSeparatorComponent={() => <View style={styles.reviewSeparator} />}
          />
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    backgroundColor: Colors.surface,
    padding: 20,
    gap: 16,
  },
  shopImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: Colors.border,
  },
  headerContent: {
    gap: 8,
  },
  shopName: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: Colors.text,
  },
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  specialtyChip: {
    fontSize: 12,
    color: Colors.surface,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ratingText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  section: {
    padding: 20,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.text,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.text,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  productRow: {
    gap: 12,
    marginBottom: 12,
  },
  productCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
  productPrice: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.primary,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    padding: 24,
  },
  reviewCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  reviewUserPhoto: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.border,
  },
  reviewUserPhotoPlaceholder: {
    backgroundColor: Colors.primary + '20',
  },
  reviewHeaderInfo: {
    flex: 1,
    gap: 4,
  },
  reviewUserName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  reviewComment: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.text,
  },
  reviewImages: {
    flexDirection: 'row',
    gap: 8,
  },
  reviewImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.border,
    marginRight: 8,
  },
  verifiedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  verifiedText: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '600' as const,
  },
  reviewSeparator: {
    height: 12,
  },
});
