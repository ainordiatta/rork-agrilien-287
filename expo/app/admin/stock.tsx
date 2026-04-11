import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { AlertCircle, PackagePlus } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useInventory } from '@/contexts/InventoryContext';

export default function StockScreen() {
  const { products, stockAlerts, restockProduct, getStockStatus } = useInventory();
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [restockQuantity, setRestockQuantity] = useState<string>('');

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

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'out_of_stock':
        return 'Rupture de stock';
      case 'low_stock':
        return 'Stock faible';
      case 'in_stock':
        return 'En stock';
      default:
        return '';
    }
  };

  const handleRestock = async (productId: string) => {
    const quantity = Number(restockQuantity);
    if (!restockQuantity.trim() || isNaN(quantity) || quantity <= 0) {
      Alert.alert('Erreur', 'Veuillez entrer une quantité valide');
      return;
    }

    try {
      await restockProduct(productId, quantity);
      Alert.alert('Succès', 'Stock réapprovisionné avec succès');
      setSelectedProduct(null);
      setRestockQuantity('');
    } catch (error) {
      console.error('Error restocking product:', error);
      Alert.alert('Erreur', 'Impossible de réapprovisionner le stock');
    }
  };

  const sortedProducts = [...products].sort((a, b) => {
    const statusA = getStockStatus(a);
    const statusB = getStockStatus(b);
    const priority = { out_of_stock: 0, low_stock: 1, in_stock: 2 };
    return priority[statusA] - priority[statusB];
  });

  return (
    <View style={styles.container}>
      {stockAlerts.length > 0 && (
        <View style={styles.alertSection}>
          <View style={styles.alertHeader}>
            <AlertCircle size={24} color={Colors.error} />
            <Text style={styles.alertTitle}>Alertes de stock</Text>
          </View>
          <Text style={styles.alertSubtitle}>
            {stockAlerts.length} produit(s) nécessitent votre attention
          </Text>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {sortedProducts.map((product) => {
          const status = getStockStatus(product);
          const isSelected = selectedProduct === product.id;
          const needsAttention = status === 'out_of_stock' || status === 'low_stock';

          return (
            <View
              key={product.id}
              style={[
                styles.productCard,
                needsAttention && styles.productCardAlert
              ]}
            >
              <View style={styles.productInfo}>
                <View style={styles.productHeader}>
                  <View style={styles.productTitleRow}>
                    <Text style={styles.productName}>{product.name}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(status) }]}>
                        {getStatusLabel(status)}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.stockInfo}>
                  <View style={styles.stockRow}>
                    <Text style={styles.label}>Stock actuel:</Text>
                    <Text style={[styles.value, { color: getStatusColor(status) }]}>
                      {product.quantity} unités
                    </Text>
                  </View>
                  <View style={styles.stockRow}>
                    <Text style={styles.label}>Stock minimum:</Text>
                    <Text style={styles.value}>{product.minStockLevel} unités</Text>
                  </View>
                  <View style={styles.stockRow}>
                    <Text style={styles.label}>Valeur en stock:</Text>
                    <Text style={styles.value}>{formatPrice(product.price * product.quantity)}</Text>
                  </View>
                </View>

                {needsAttention && (
                  <View>
                    {!isSelected ? (
                      <TouchableOpacity
                        style={styles.restockButton}
                        onPress={() => setSelectedProduct(product.id)}
                        activeOpacity={0.8}
                      >
                        <PackagePlus size={18} color={Colors.primary} />
                        <Text style={styles.restockButtonText}>Réapprovisionner</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={styles.restockForm}>
                        <TextInput
                          style={styles.restockInput}
                          value={restockQuantity}
                          onChangeText={setRestockQuantity}
                          placeholder="Quantité"
                          placeholderTextColor={Colors.textSecondary}
                          keyboardType="numeric"
                        />
                        <View style={styles.restockActions}>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.cancelButton]}
                            onPress={() => {
                              setSelectedProduct(null);
                              setRestockQuantity('');
                            }}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.cancelButtonText}>Annuler</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.actionButton, styles.confirmButton]}
                            onPress={() => handleRestock(product.id)}
                            activeOpacity={0.8}
                          >
                            <Text style={styles.confirmButtonText}>Confirmer</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  alertSection: {
    backgroundColor: '#FFEBEE',
    padding: 16,
    gap: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.error,
  },
  alertSubtitle: {
    fontSize: 14,
    color: Colors.error,
    marginLeft: 36,
  },
  content: {
    flex: 1,
    padding: 16,
    paddingBottom: 100,
  },
  productCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  productCardAlert: {
    borderColor: '#FF9800',
    borderWidth: 2,
  },
  productInfo: {
    gap: 12,
  },
  productHeader: {
    gap: 8,
  },
  productTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  productName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  stockInfo: {
    gap: 8,
  },
  stockRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  value: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  restockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 10,
    marginTop: 8,
  },
  restockButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  restockForm: {
    gap: 12,
    marginTop: 8,
  },
  restockInput: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  restockActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
});
