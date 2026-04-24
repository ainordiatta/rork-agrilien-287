import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
  Animated,
  Modal,
  Platform,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Star, Zap, Menu, X, Search, Bell, Plus, MoreVertical, Package, MapPin, Navigation } from 'lucide-react-native';
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import Colors from '@/constants/colors';
import { CATEGORIES } from '@/constants/categories';
import { useApp } from '@/contexts/AppContext';
import { useInventory } from '@/contexts/InventoryContext';
import { useStories } from '@/contexts/StoriesContext';
import { useNotifications } from '@/contexts/NotificationsContext';
import { useOffline } from '@/contexts/OfflineContext';
import { mockProducts, mockShops, formatPrice } from '@/mocks/data';
import { MEASUREMENT_UNITS } from '@/constants/units';
import { Product, Shop, DeliveryMethod } from '@/types';
import React from 'react';
import HeroSection from '@/components/HeroSection';
import { SkeletonGrid } from '@/components/SkeletonCard';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/contexts/I18nContext';

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width: screenWidth } = useWindowDimensions();
  // #1 Grille responsive
  const numCols = screenWidth >= 1024 ? 4 : screenWidth >= 768 ? 3 : 2;
  const isDesktop = screenWidth >= 768;
  const DRAWER_WIDTH = screenWidth * 0.75;
  const { colors } = useTheme();
  const { t } = useI18n();

  const { selectedCountry, updateCountry, user } = useApp();
  const { products, transactions } = useInventory();
  const { groupedStories, myStories } = useStories();
  const { unreadCount: notifUnreadCount } = useNotifications();
  const { isOnline } = useOffline();
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [expandedDrawerCategories, setExpandedDrawerCategories] = useState<Set<string>>(new Set());
  const [gpsActive, setGpsActive] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [isLoading, setIsLoading] = useState(true);


  const categories = useMemo(() => {
    return ['Tous', ...CATEGORIES.map(cat => cat.name)];
  }, []);
  const [showCountryModal, setShowCountryModal] = useState<boolean>(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [shopFilter, setShopFilter] = useState<'all' | 'products' | 'suppliers'>('all');
  const drawerAnimation = useRef(new Animated.Value(-DRAWER_WIDTH)).current;

  // Simulate loading
  useEffect(() => {
    const t = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  // #22 GPS — Produits près de moi
  const handleGpsToggle = useCallback(() => {
    if (gpsActive) {
      setGpsActive(false);
      setUserLocation(null);
      return;
    }
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setGpsActive(true);
        },
        () => setGpsActive(false)
      );
    }
  }, [gpsActive]);

  const getDistance = useCallback((lat: number, lng: number) => {
    if (!userLocation) return undefined;
    const R = 6371;
    const dLat = (lat - userLocation.lat) * Math.PI / 180;
    const dLon = (lng - userLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) ** 2 + Math.cos(userLocation.lat * Math.PI/180) * Math.cos(lat * Math.PI/180) * Math.sin(dLon/2) ** 2;
    return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
  }, [userLocation]);


  const isShopOwner = user?.role === 'producteur';

  const filteredProducts = useMemo(() => {
    const inventoryProducts: Product[] = products.map((invProduct) => {
      const shopInfo: Shop = user?.id
        ? {
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
          }
        : mockShops[0];

      return {
        id: invProduct.id,
        name: invProduct.name,
        description: invProduct.description,
        price: invProduct.price,
        currency: 'XOF',
        images: invProduct.images.length > 0 ? invProduct.images : ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'],
        category: invProduct.category,
        subcategory: invProduct.subcategory,
        stock: invProduct.quantity,
        shopId: user?.id || 'shop-default',
        shop: shopInfo,
        deliveryMethods: ['both' as DeliveryMethod],
        isBoosted: false,
        unit: 'unite' as const,
        pricingModel: 'fixed' as const,
        availability: 'disponible' as const,
        createdAt: invProduct.createdAt,
      };
    });

    let allProducts = [...mockProducts, ...inventoryProducts];

    let prods = isShopOwner
      ? allProducts
      : allProducts.filter((p) => p.shop.country === selectedCountry);

    if (selectedCategory !== 'Tous') {
      prods = prods.filter((p) => p.category === selectedCategory);
    }
    if (selectedSubcategory) {
      prods = prods.filter((p) => p.subcategory === selectedSubcategory);
    }
    return prods.sort((a, b) => {
      // Boostés en premier
      if (b.isBoosted !== a.isBoosted) return (b.isBoosted ? 1 : 0) - (a.isBoosted ? 1 : 0);
      // #22 Si GPS actif, tri par distance
      if (gpsActive && userLocation) {
        const distA = getDistance((a.shop as any).latitude || 14.69, (a.shop as any).longitude || -17.44) || 9999;
        const distB = getDistance((b.shop as any).latitude || 14.69, (b.shop as any).longitude || -17.44) || 9999;
        return distA - distB;
      }
      return 0;
    });
  }, [selectedCountry, selectedCategory, selectedSubcategory, products, user, isShopOwner, gpsActive, userLocation, getDistance]);


  const shopRevenue = useMemo(() => {
    const salesTransactions = transactions.filter(t => t.type === 'vente');
    return salesTransactions.reduce((sum, t) => sum + t.amount, 0);
  }, [transactions]);



  const countries = [
    { code: 'senegal' as const, name: 'Sénégal', flag: '🇸🇳' },
    { code: 'mali' as const, name: 'Mali', flag: '🇲🇱' },
  ];

  const currentCountry = countries.find(c => c.code === selectedCountry)!;

  const handleCountryChange = (countryCode: typeof selectedCountry) => {
    void updateCountry(countryCode);
    setShowCountryModal(false);
  };

  const openDrawer = () => {
    setIsDrawerOpen(true);
    Animated.spring(drawerAnimation, {
      toValue: 0,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  };

  const closeDrawer = () => {
    Animated.spring(drawerAnimation, {
      toValue: -DRAWER_WIDTH,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start(() => {
      setIsDrawerOpen(false);
    });
  };

  const handleCategorySelect = (category: string) => {
    if (selectedCategory === category && category !== 'Tous') {
      const newExpanded = new Set(expandedDrawerCategories);
      if (newExpanded.has(category)) {
        newExpanded.delete(category);
      } else {
        newExpanded.add(category);
      }
      setExpandedDrawerCategories(newExpanded);
    } else {
      setSelectedCategory(category);
      setSelectedSubcategory(null);
      if (category === 'Tous') {
        closeDrawer();
      } else {
        const categoryData = CATEGORIES.find(c => c.name === category);
        if (!categoryData || !categoryData.subcategories || categoryData.subcategories.length === 0) {
          closeDrawer();
        } else {
          const newExpanded = new Set(expandedDrawerCategories);
          newExpanded.add(category);
          setExpandedDrawerCategories(newExpanded);
        }
      }
    }
  };

  const handleSubcategorySelect = (subcategory: string) => {
    setSelectedSubcategory(subcategory);
    closeDrawer();
  };

  useEffect(() => {
    if (!isDrawerOpen) {
      drawerAnimation.setValue(-DRAWER_WIDTH);
    }
  }, [isDrawerOpen, drawerAnimation]);

  const renderProductCard = ({ item }: { item: Product }) => {
    const unitLabel = MEASUREMENT_UNITS[item.unit] || item.unit;
    
    return (
      <TouchableOpacity
        style={styles.productCard}
        onPress={() => router.push(`/product/${item.id}` as any)}
        activeOpacity={0.8}
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
          <TouchableOpacity
            style={styles.shopInfo}
            onPress={() => router.push(`/shop/${item.shop.id}` as any)}
          >
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
                    : `Dispo: ${new Date(item.estimatedAvailabilityDate || item.harvestDate!).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}`
                  }
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
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top, backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={styles.headerTop}>

          <TouchableOpacity
            style={styles.menuButton}
            onPress={openDrawer}
            activeOpacity={0.7}
          >
            <Menu size={24} color={Colors.text} />
          </TouchableOpacity>
          <Image source={require('@/assets/images/agricien-logo.jpg')} style={styles.headerLogo} />
          <View style={styles.headerRight}>
            {!isShopOwner && (
              <TouchableOpacity
                style={styles.countryButton}
                onPress={() => setShowCountryModal(true)}
                activeOpacity={0.7}
              >
                <Text style={styles.countryFlag}>{currentCountry.flag}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.notificationButton}
              activeOpacity={0.7}
              onPress={() => router.push('/notifications')}
            >
              <Bell size={24} color={Colors.text} />
              {notifUnreadCount > 0 && (
                <View style={styles.notifBadge}>
                  <Text style={styles.notifBadgeText}>{notifUnreadCount > 9 ? '9+' : notifUnreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* #2 Hero section pour les visiteurs non connectés */}
      {!user && <HeroSection />}

      {/* #8 Bannière Offline */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>{t('offline.banner')}</Text>
        </View>
      )}

      {/* #1 Grille responsive avec skeleton (#4) */}
      {isLoading ? (
        <SkeletonGrid count={numCols * 2} />
      ) : (
      <FlatList
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        key={numCols} // force re-render quand numCols change
        numColumns={numCols}
        contentContainerStyle={[
          styles.productList,
          isDesktop && { maxWidth: 1200, alignSelf: 'center' as any, width: '100%' },
        ]}
        columnWrapperStyle={numCols > 1 ? styles.productRow : undefined}
        renderItem={renderProductCard}
        ListHeaderComponent={
          <>
            {isShopOwner && (
            <View style={styles.shopDashboard}>
              <View style={styles.searchBar}>
                <Search size={20} color={Colors.magenta} />
                <Text style={styles.searchPlaceholder}>{t('home.searchPlaceholder')}</Text>
              </View>

              <View style={styles.storiesSection}>
                <Text style={styles.storiesTitle}>Story à la Une</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.storiesScrollContent}>
                  <TouchableOpacity
                    style={styles.storyAdd}
                    onPress={() => router.push('/stories/add')}
                    activeOpacity={0.7}
                  >
                    <View style={styles.storyCircle}>
                      <Plus size={32} color={Colors.surface} />
                    </View>
                    <Text style={styles.storyLabel}>Ajouter</Text>
                  </TouchableOpacity>

                  {myStories.length > 0 && (
                    <TouchableOpacity
                      style={styles.myStoryItem}
                      onPress={() => router.push(`/stories/viewer?shopId=${user?.id}` as any)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.myStoryCircle}>
                        {user?.shopPhoto ? (
                          <Image source={{ uri: user.shopPhoto }} style={styles.myStoryImage} />
                        ) : (
                          <Text style={styles.myStoryInitial}>
                            {user?.name ? user.name.charAt(0).toUpperCase() : '?'}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.storyLabel}>Mes Stories</Text>
                      <View style={styles.storyCountBadge}>
                        <Text style={styles.storyCountText}>{myStories.length}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </View>

              <Text style={styles.revenuesTitle}>Revenues</Text>
              
              <View style={styles.revenueCard}>
                <View style={styles.revenueHeader}>
                  <Text style={styles.revenueAmount}>{formatPrice(shopRevenue, 'XOF')}</Text>
                  <TouchableOpacity activeOpacity={0.7}>
                    <MoreVertical size={20} color={Colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                <Text style={styles.revenueLabel}>Vos revenus mensuels</Text>
                <TouchableOpacity 
                  style={styles.detailsButton}
                  onPress={() => router.push('/admin/reports')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.detailsButtonText}>Afficher les détails</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.filterButtons}>
                <TouchableOpacity 
                  style={[styles.filterButton, shopFilter === 'suppliers' && styles.filterButtonActive]}
                  onPress={() => setShopFilter('suppliers')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterButtonText, shopFilter === 'suppliers' && styles.filterButtonTextActive]}>
                    Fournisseurs
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.filterButton, shopFilter === 'products' && styles.filterButtonActive]}
                  onPress={() => setShopFilter('products')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterButtonText, shopFilter === 'products' && styles.filterButtonTextActive]}>
                    Produits
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.filterButton, shopFilter === 'all' && styles.filterButtonActive]}
                  onPress={() => setShopFilter('all')}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.filterButtonText, shopFilter === 'all' && styles.filterButtonTextActive]}>
                    Voir tout
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            )}
            {!isShopOwner && groupedStories.length > 0 && (
              <View style={styles.clientStoriesSection}>
                <Text style={styles.clientStoriesTitle}>Stories</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.storiesScrollContent}
                >
                  {groupedStories.map((shopStory) => (
                    <TouchableOpacity
                      key={shopStory.shopId}
                      style={styles.clientStoryItem}
                      onPress={() => router.push(`/stories/viewer?shopId=${shopStory.shopId}` as any)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.clientStoryCircle,
                          shopStory.hasUnviewed && styles.clientStoryCircleUnviewed,
                        ]}
                      >
                        {shopStory.shopPhoto ? (
                          <Image
                            source={{ uri: shopStory.shopPhoto }}
                            style={styles.clientStoryImage}
                          />
                        ) : (
                          <Text style={styles.clientStoryInitial}>
                            {shopStory.shopName.charAt(0).toUpperCase()}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.clientStoryLabel} numberOfLines={1}>
                        {shopStory.shopName}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aucun produit disponible</Text>
            <Text style={styles.emptySubtext}>
              {selectedCategory !== 'Tous'
                ? `Aucun produit dans la catégorie "${selectedCategory}"${selectedSubcategory ? ` > "${selectedSubcategory}"` : ''}`
                : 'Aucun produit disponible dans votre région pour le moment'}
            </Text>
            {selectedCategory !== 'Tous' && (
              <TouchableOpacity
                style={styles.resetFilterButton}
                onPress={() => {
                  setSelectedCategory('Tous');
                  setSelectedSubcategory(null);
                }}
              >
                <Text style={styles.resetFilterButtonText}>{t('common.buy')}</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
      )}


      <Modal
        visible={isDrawerOpen}
        transparent
        animationType="none"
        onRequestClose={closeDrawer}
      >
        <View style={styles.drawerOverlay}>
          <TouchableOpacity
            style={styles.drawerBackdrop}
            activeOpacity={1}
            onPress={closeDrawer}
          />
          <Animated.View
            style={[
              styles.drawer,
              {
                transform: [{ translateX: drawerAnimation }],
                paddingTop: insets.top,
              },
            ]}
          >
            <View style={styles.drawerHeader}>
              <Text style={styles.drawerTitle}>Catégories</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={closeDrawer}
                activeOpacity={0.7}
              >
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.drawerContent}
              showsVerticalScrollIndicator={false}
            >
              {categories.map((category) => {
                const categoryData = CATEGORIES.find(c => c.name === category);
                const hasSubcategories = categoryData && categoryData.subcategories && categoryData.subcategories.length > 0;
                const isExpanded = expandedDrawerCategories.has(category);
                const isActive = selectedCategory === category && !selectedSubcategory;

                return (
                  <View key={category}>
                    <TouchableOpacity
                      style={[
                        styles.drawerItem,
                        isActive && styles.drawerItemActive,
                      ]}
                      onPress={() => handleCategorySelect(category)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.drawerItemContent}>
                        <Text
                          style={[
                            styles.drawerItemText,
                            isActive && styles.drawerItemTextActive,
                          ]}
                        >
                          {category}
                        </Text>
                        {hasSubcategories && (
                          <View style={styles.chevronIcon}>
                            {isExpanded ? (
                              <View style={{ transform: [{ rotate: '90deg' }] }}>
                                <Text style={styles.chevronText}>›</Text>
                              </View>
                            ) : (
                              <Text style={styles.chevronText}>›</Text>
                            )}
                          </View>
                        )}
                      </View>
                      {isActive && (
                        <View style={styles.activeIndicator} />
                      )}
                    </TouchableOpacity>
                    
                    {hasSubcategories && isExpanded && (
                      <View style={styles.subcategoryList}>
                        {categoryData!.subcategories.map((subcategory) => {
                          const isSubActive = selectedCategory === category && selectedSubcategory === subcategory;
                          return (
                            <TouchableOpacity
                              key={subcategory}
                              style={[
                                styles.drawerSubItem,
                                isSubActive && styles.drawerSubItemActive,
                              ]}
                              onPress={() => handleSubcategorySelect(subcategory)}
                              activeOpacity={0.7}
                            >
                              <Text
                                style={[
                                  styles.drawerSubItemText,
                                  isSubActive && styles.drawerSubItemTextActive,
                                ]}
                              >
                                {subcategory}
                              </Text>
                              {isSubActive && (
                                <View style={styles.activeIndicatorSmall} />
                              )}
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      <Modal
        visible={showCountryModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCountryModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCountryModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choisir un pays</Text>
            <Text style={styles.modalSubtitle}>Voir les produits disponibles par pays</Text>
            
            {countries.map((country) => (
              <TouchableOpacity
                key={country.code}
                style={[
                  styles.countryOption,
                  selectedCountry === country.code && styles.countryOptionActive,
                ]}
                onPress={() => handleCountryChange(country.code)}
                activeOpacity={0.7}
              >
                <View style={styles.countryInfo}>
                  <Text style={styles.countryFlag}>{country.flag}</Text>
                  <Text style={[
                    styles.countryName,
                    selectedCountry === country.code && styles.countryNameActive,
                  ]}>
                    {country.name}
                  </Text>
                </View>
                {selectedCountry === country.code && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  headerLogo: {
    width: 220,
    height: 70,
    resizeMode: 'contain' as const,
  },
  menuButton: {
    padding: 4,
  },
  notificationButton: {
    padding: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countryButton: {
    padding: 4,
    paddingHorizontal: 8,
  },
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
  },
  drawerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: Colors.surface,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  drawerTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.text,
  },
  closeButton: {
    padding: 4,
  },
  drawerContent: {
    flex: 1,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  drawerItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  chevronIcon: {
    marginLeft: 8,
  },
  chevronText: {
    fontSize: 20,
    color: Colors.textSecondary,
    fontWeight: 'bold' as const,
  },
  drawerItemActive: {
    backgroundColor: Colors.primary + '10',
  },
  drawerItemText: {
    fontSize: 16,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  drawerItemTextActive: {
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.primary,
  },
  activeIndicator: {
    width: 4,
    height: 24,
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  activeIndicatorSmall: {
    width: 3,
    height: 18,
    backgroundColor: Colors.primary,
    borderRadius: 1.5,
  },
  subcategoryList: {
    backgroundColor: Colors.background,
  },
  drawerSubItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingLeft: 40,
    paddingRight: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  drawerSubItemActive: {
    backgroundColor: Colors.primary + '08',
  },
  drawerSubItemText: {
    fontSize: 14,
    fontWeight: '400' as const,
    color: Colors.textSecondary,
    flex: 1,
  },
  drawerSubItemTextActive: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  productList: {
    padding: 12,
  },
  productRow: {
    gap: 12,
  },
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  resetFilterButton: {
    marginTop: 20,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  resetFilterButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.background,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  countryOptionActive: {
    backgroundColor: Colors.primary + '10',
    borderColor: Colors.primary,
  },
  countryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  countryFlag: {
    fontSize: 32,
  },
  countryName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  countryNameActive: {
    color: Colors.primary,
    fontWeight: 'bold' as const,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    color: Colors.surface,
    fontSize: 14,
    fontWeight: 'bold' as const,
  },
  shopDashboard: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 25,
    marginBottom: 20,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  storiesSection: {
    marginBottom: 24,
  },
  clientStoriesSection: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  clientStoriesTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  storiesScrollContent: {
    gap: 16,
  },
  clientStoryItem: {
    alignItems: 'center',
    width: 80,
  },
  clientStoryCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  clientStoryCircleUnviewed: {
    borderWidth: 3,
    borderColor: Colors.primary,
  },
  clientStoryImage: {
    width: 68,
    height: 68,
    borderRadius: 34,
  },
  clientStoryInitial: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.primary,
  },
  clientStoryLabel: {
    fontSize: 12,
    color: Colors.text,
    textAlign: 'center',
  },
  storiesTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  storyAdd: {
    alignItems: 'center',
    marginRight: 16,
  },
  storyCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.magenta,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  storyLabel: {
    fontSize: 12,
    color: Colors.text,
  },
  myStoryItem: {
    alignItems: 'center',
    width: 80,
    position: 'relative',
  },
  myStoryCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 3,
    borderColor: Colors.primary,
    overflow: 'hidden',
  },
  myStoryImage: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  myStoryInitial: {
    fontSize: 28,
    fontWeight: 'bold' as const,
    color: Colors.primary,
  },
  storyCountBadge: {
    position: 'absolute',
    top: 0,
    right: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  storyCountText: {
    fontSize: 12,
    fontWeight: 'bold' as const,
    color: Colors.surface,
  },
  revenuesTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 12,
  },
  revenueCard: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  revenueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  revenueAmount: {
    fontSize: 32,
    fontWeight: 'bold' as const,
    color: Colors.text,
  },
  revenueLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 16,
  },
  detailsButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: 'center',
    backgroundColor: Colors.magenta,
  },
  detailsButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: '600' as const,
  },
  offlineBanner: {
    backgroundColor: Colors.error,
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 25,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  filterButtonTextActive: {
    color: Colors.surface,
  },
  notifBadge: {
    position: 'absolute',
    top: -4,
    right: -6,
    backgroundColor: Colors.error,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.surface,
  },
  notifBadgeText: {
    fontSize: 10,
    fontWeight: 'bold' as const,
    color: Colors.surface,
  },
});
