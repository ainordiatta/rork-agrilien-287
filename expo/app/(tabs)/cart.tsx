import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ScrollView, Modal } from 'react-native';
import { Minus, Plus, Trash2, MapPin, ChevronDown, Truck, CreditCard } from 'lucide-react-native';
import { useState, useMemo } from 'react';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';
import { formatPrice } from '@/mocks/data';
import { calculateDeliveryFee, DELIVERY_FEES_SENEGAL, DELIVERY_FEES_MALI } from '@/constants/deliveryFees';
import { PaymentMethod } from '@/types';

export default function CartScreen() {
  const { cart, cartTotal, updateCartItemQuantity, removeFromCart, selectedCountry } = useApp();
  const [selectedRegion, setSelectedRegion] = useState<string>('');
  const [showRegionModal, setShowRegionModal] = useState<boolean>(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('orange_money');
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);

  const deliveryFees = selectedCountry === 'senegal' ? DELIVERY_FEES_SENEGAL : DELIVERY_FEES_MALI;
  const regions = useMemo(() => deliveryFees.map((f) => f.region), [deliveryFees]);

  const deliveryFee = useMemo(() => {
    if (!selectedRegion) return 0;
    return calculateDeliveryFee(selectedRegion, selectedCountry, cartTotal);
  }, [selectedRegion, selectedCountry, cartTotal]);

  const total = cartTotal + deliveryFee;

  const paymentMethods: { value: PaymentMethod; label: string }[] = [
    { value: 'orange_money', label: 'Orange Money' },
    { value: 'wave', label: 'Wave' },
    { value: 'free_money', label: 'Free Money' },
    { value: 'paiement_livraison', label: 'Paiement à la livraison' },
    { value: 'card', label: 'Carte bancaire' },
  ];

  if (cart.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Mon Panier</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Votre panier est vide</Text>
          <Text style={styles.emptySubtext}>Ajoutez des produits agricoles pour commencer</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mon Panier</Text>
        <Text style={styles.itemCount}>{cart.length} article{cart.length > 1 ? 's' : ''}</Text>
      </View>

      <FlatList
        data={cart}
        keyExtractor={(item) => item.product.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.cartItem}>
            <Image source={{ uri: item.product.images[0] }} style={styles.productImage} />
            <View style={styles.productInfo}>
              <Text style={styles.productName} numberOfLines={2}>
                {item.product.name}
              </Text>
              <Text style={styles.shopName}>{item.product.shop.name}</Text>
              <Text style={styles.price}>{formatPrice(item.product.price, item.product.currency)}</Text>
            </View>
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => removeFromCart(item.product.id)}
              >
                <Trash2 size={20} color={Colors.error} />
              </TouchableOpacity>
              <View style={styles.quantityContainer}>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateCartItemQuantity(item.product.id, item.quantity - 1)}
                >
                  <Minus size={16} color={Colors.text} />
                </TouchableOpacity>
                <Text style={styles.quantity}>{item.quantity}</Text>
                <TouchableOpacity
                  style={styles.quantityButton}
                  onPress={() => updateCartItemQuantity(item.product.id, item.quantity + 1)}
                >
                  <Plus size={16} color={Colors.text} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      />

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.regionSelector}
          onPress={() => setShowRegionModal(true)}
        >
          <MapPin size={20} color={Colors.primary} />
          <Text style={styles.regionSelectorText}>
            {selectedRegion || 'Sélectionner une région'}
          </Text>
          <ChevronDown size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.paymentSelector}
          onPress={() => setShowPaymentModal(true)}
        >
          <CreditCard size={20} color={Colors.primary} />
          <Text style={styles.paymentSelectorText}>
            {paymentMethods.find((m) => m.value === paymentMethod)?.label}
          </Text>
          <ChevronDown size={20} color={Colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Sous-total</Text>
            <Text style={styles.summaryValue}>{formatPrice(cartTotal, 'XOF')}</Text>
          </View>
          <View style={styles.summaryRow}>
            <View style={styles.deliveryFeeLabel}>
              <Truck size={16} color={Colors.textSecondary} />
              <Text style={styles.summaryLabel}>Frais de livraison</Text>
            </View>
            <Text style={styles.summaryValue}>
              {selectedRegion
                ? deliveryFee === 0
                  ? 'Gratuit'
                  : formatPrice(deliveryFee, 'XOF')
                : '-'}
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalAmount}>{formatPrice(total, 'XOF')}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.checkoutButton, !selectedRegion && styles.checkoutButtonDisabled]}
          activeOpacity={0.8}
          disabled={!selectedRegion}
        >
          <Text style={styles.checkoutButtonText}>Commander</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showRegionModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowRegionModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Sélectionner une région</Text>
            <ScrollView>
              {regions.map((region) => (
                <TouchableOpacity
                  key={region}
                  style={[
                    styles.modalOption,
                    selectedRegion === region && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setSelectedRegion(region);
                    setShowRegionModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      selectedRegion === region && styles.modalOptionTextSelected,
                    ]}
                  >
                    {region}
                  </Text>
                  {selectedRegion === region && (
                    <View style={styles.checkmark} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowRegionModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Mode de paiement</Text>
            <ScrollView>
              {paymentMethods.map((method) => (
                <TouchableOpacity
                  key={method.value}
                  style={[
                    styles.modalOption,
                    paymentMethod === method.value && styles.modalOptionSelected,
                  ]}
                  onPress={() => {
                    setPaymentMethod(method.value);
                    setShowPaymentModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.modalOptionText,
                      paymentMethod === method.value && styles.modalOptionTextSelected,
                    ]}
                  >
                    {method.label}
                  </Text>
                  {paymentMethod === method.value && (
                    <View style={styles.checkmark} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowPaymentModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Annuler</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    padding: 20,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.text,
  },
  itemCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.border,
  },
  productInfo: {
    flex: 1,
    gap: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  shopName: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  price: {
    fontSize: 14,
    fontWeight: 'bold' as const,
    color: Colors.primary,
  },
  actions: {
    gap: 8,
    alignItems: 'flex-end',
  },
  deleteButton: {
    padding: 4,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 8,
    overflow: 'hidden',
  },
  quantityButton: {
    padding: 8,
    backgroundColor: Colors.surface,
  },
  quantity: {
    paddingHorizontal: 12,
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  footer: {
    padding: 20,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 12,
  },
  regionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.background,
    borderRadius: 12,
    gap: 12,
  },
  regionSelectorText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  paymentSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.background,
    borderRadius: 12,
    gap: 12,
  },
  paymentSelectorText: {
    flex: 1,
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  summaryContainer: {
    gap: 8,
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 15,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  deliveryFeeLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: Colors.primary,
  },
  checkoutButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 8,
  },
  checkoutButtonDisabled: {
    backgroundColor: Colors.border,
    opacity: 0.5,
  },
  checkoutButtonText: {
    color: Colors.surface,
    fontSize: 16,
    fontWeight: 'bold' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '70%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.text,
    marginBottom: 20,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: Colors.background,
  },
  modalOptionSelected: {
    backgroundColor: Colors.primary,
  },
  modalOptionText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500' as const,
  },
  modalOptionTextSelected: {
    color: Colors.surface,
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.surface,
  },
  modalCloseButton: {
    marginTop: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.background,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '600' as const,
  },
});
