import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image } from 'react-native';
import { Plus, Search, MoreVertical, AlertCircle } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState, useMemo } from 'react';
import Colors from '@/constants/colors';
import { useInventory } from '@/contexts/InventoryContext';

export default function InventoryScreen() {
  const router = useRouter();
  const { products, stockAlerts, totalValue, getStockStatus } = useInventory();
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return products;
    const query = searchQuery.toLowerCase();
    return products.filter(
      p => p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)
    );
  }, [products, searchQuery]);

  const formatPrice = (price: number) => {
    return `${price.toLocaleString('fr-FR')} FCFA`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'out_of_stock':
        return Colors.error;
      case 'low_stock':
        return '#FF9800';
      case 'in_stock':
        return '#4CAF50';
      default:
        return Colors.textSecondary;
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{products.length}</Text>
            <Text style={styles.statLabel}>Produits</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{formatPrice(totalValue)}</Text>
            <Text style={styles.statLabel}>Valeur totale</Text>
          </View>
        </View>

        {stockAlerts.length > 0 && (
          <View style={styles.alertBanner}>
            <AlertCircle size={20} color={Colors.error} />
            <Text style={styles.alertText}>
              {stockAlerts.length} produit(s) en alerte de stock
            </Text>
          </View>
        )}

        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Search size={20} color={Colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Rechercher un produit..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.textSecondary}
            />
          </View>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push('/admin/add-product')}
            activeOpacity={0.8}
          >
            <Plus size={24} color={Colors.surface} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {filteredProducts.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Aucun produit trouvé' : 'Aucun produit dans l\'inventaire'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/admin/add-product')}
                activeOpacity={0.8}
              >
                <Plus size={20} color={Colors.primary} />
                <Text style={styles.emptyButtonText}>Ajouter un produit</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          filteredProducts.map((product) => {
            const status = getStockStatus(product);
            return (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                activeOpacity={0.8}
                onPress={() => router.push(`/admin/edit-product/${product.id}`)}
              >
                <View style={styles.productRow}>
                  {product.images && product.images.length > 0 && (
                    <Image
                      source={{ uri: product.images[0] }}
                      style={styles.productThumbnail}
                    />
                  )}
                  <View style={styles.productInfo}>
                    <View style={styles.productHeader}>
                      <Text style={styles.productName}>{product.name}</Text>
                      <TouchableOpacity style={styles.moreButton} activeOpacity={0.8}>
                        <MoreVertical size={20} color={Colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.productCategory}>{product.category}</Text>
                    <View style={styles.productDetails}>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Quantité:</Text>
                        <Text style={[styles.detailValue, { color: getStatusColor(status) }]}>
                          {product.quantity}
                        </Text>
                      </View>
                      <View style={styles.detailItem}>
                        <Text style={styles.detailLabel}>Prix:</Text>
                        <Text style={styles.detailValue}>{formatPrice(product.price)}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    backgroundColor: Colors.surface,
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
  },
  alertText: {
    flex: 1,
    fontSize: 14,
    color: Colors.error,
    fontWeight: '600' as const,
  },
  searchRow: {
    flexDirection: 'row',
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.background,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: Colors.text,
  },
  addButton: {
    backgroundColor: Colors.primary,
    width: 48,
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  productCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  productRow: {
    flexDirection: 'row',
    gap: 12,
  },
  productThumbnail: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.background,
  },
  productInfo: {
    flex: 1,
    gap: 8,
  },
  productHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  moreButton: {
    padding: 4,
  },
  productCategory: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  productDetails: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 8,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
});
