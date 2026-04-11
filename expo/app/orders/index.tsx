import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Package, ChevronRight, Clock, CheckCircle, Truck, XCircle } from 'lucide-react-native';
import { useCallback } from 'react';
import React from 'react';
import Colors from '@/constants/colors';
import { useOrders } from '@/contexts/OrdersContext';
import { Order, OrderStatus } from '@/types';
import { formatPrice } from '@/mocks/data';

const STATUS_CONFIG: Record<OrderStatus, { label: string; color: string; icon: typeof Package }> = {
  pending: { label: 'En attente', color: '#FF9800', icon: Clock },
  confirmed: { label: 'Confirmée', color: '#2196F3', icon: CheckCircle },
  shipped: { label: 'En livraison', color: Colors.primary, icon: Truck },
  delivered: { label: 'Livrée', color: Colors.success, icon: CheckCircle },
  cancelled: { label: 'Annulée', color: Colors.error, icon: XCircle },
};

const OrderItem = React.memo(({ order, onPress }: { order: Order; onPress: (id: string) => void }) => {
  const config = STATUS_CONFIG[order.status];
  const IconComponent = config.icon;
  const firstImage = order.items[0]?.product?.images?.[0];
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <TouchableOpacity style={styles.orderCard} onPress={() => onPress(order.id)} activeOpacity={0.7}>
      <View style={styles.orderHeader}>
        <View style={styles.orderIdRow}>
          <Text style={styles.orderId}>#{order.id.slice(-8).toUpperCase()}</Text>
          <View style={[styles.statusBadge, { backgroundColor: config.color + '15' }]}>
            <IconComponent size={14} color={config.color} />
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
          </View>
        </View>
        <Text style={styles.orderDate}>
          {new Date(order.createdAt).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
      </View>

      <View style={styles.orderContent}>
        {!!firstImage && (
          <Image source={{ uri: firstImage }} style={styles.orderImage} />
        )}
        <View style={styles.orderInfo}>
          <Text style={styles.orderItems}>{itemCount} article{itemCount > 1 ? 's' : ''}</Text>
          <Text style={styles.orderTotal}>{formatPrice(order.total, order.currency)}</Text>
        </View>
        <ChevronRight size={20} color={Colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
});

export default function OrdersScreen() {
  const router = useRouter();
  const { myOrders } = useOrders();

  const handlePress = useCallback((orderId: string) => {
    router.push(`/orders/${orderId}` as any);
  }, [router]);

  const renderItem = useCallback(({ item }: { item: Order }) => (
    <OrderItem order={item} onPress={handlePress} />
  ), [handlePress]);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Mes commandes' }} />
      <FlatList
        data={myOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, myOrders.length === 0 && styles.listEmpty]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Package size={48} color={Colors.border} />
            </View>
            <Text style={styles.emptyTitle}>Aucune commande</Text>
            <Text style={styles.emptySubtitle}>Vos commandes apparaîtront ici.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  listEmpty: {
    flex: 1,
  },
  orderCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  orderHeader: {
    gap: 4,
  },
  orderIdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderId: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600' as const,
  },
  orderDate: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  orderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  orderImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    backgroundColor: Colors.border,
  },
  orderInfo: {
    flex: 1,
    gap: 2,
  },
  orderItems: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  orderTotal: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.border + '40',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
