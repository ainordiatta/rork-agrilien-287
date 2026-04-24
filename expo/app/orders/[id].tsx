import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Package, CheckCircle, Truck, Clock, XCircle, MapPin, CreditCard, Copy, FileText, Share2 } from 'lucide-react-native';
import { useMemo, useCallback, useState } from 'react';
import * as Haptics from 'expo-haptics';
import { Alert } from 'react-native';
import Colors from '@/constants/colors';
import { useOrders, OrderTimelineEvent } from '@/contexts/OrdersContext';
import { formatPrice } from '@/mocks/data';
import { OrderStatus } from '@/types';
import { generateAndDownloadPDF, shareInvoiceWhatsApp } from '@/lib/generatePdf';
import { useApp } from '@/contexts/AppContext';


const STATUS_ICONS: Record<OrderStatus, typeof Package> = {
  pending: Clock,
  confirmed: CheckCircle,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { orders, getOrderTracking } = useOrders();
  const { user } = useApp();
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const order = useMemo(() => orders.find(o => o.id === id), [orders, id]);
  const tracking = useMemo(() => id ? getOrderTracking(id) : null, [id, getOrderTracking]);

  const handleCopyCode = useCallback(async () => {
    if (tracking?.trackingCode) {
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert('Copié', `Code de suivi: ${tracking.trackingCode}`);
    }
  }, [tracking]);

  const handleDownloadPDF = useCallback(async () => {
    if (!order) return;
    setGeneratingPDF(true);
    try {
      await generateAndDownloadPDF({
        orderId: order.id,
        date: order.createdAt,
        buyerName: user?.name || 'Client AgriLien',
        items: order.items.map(item => ({
          name: item.product.name,
          quantity: item.quantity,
          price: item.product.price,
          currency: item.product.currency,
        })),
        subtotal: order.subtotal,
        deliveryFee: order.deliveryFee,
        total: order.total,
        currency: order.currency,
        paymentMethod: order.paymentMethod,
        deliveryAddress: order.deliveryAddress,
      });
    } catch (e) {
      Alert.alert('Erreur', 'Impossible de générer la facture');
    } finally {
      setGeneratingPDF(false);
    }
  }, [order, user]);

  const handleShareWhatsApp = useCallback(() => {
    if (!order) return;
    shareInvoiceWhatsApp({
      orderId: order.id,
      date: order.createdAt,
      buyerName: user?.name || 'Client AgriLien',
      items: order.items.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.product.price,
        currency: item.product.currency,
      })),
      subtotal: order.subtotal,
      deliveryFee: order.deliveryFee,
      total: order.total,
      currency: order.currency,
      paymentMethod: order.paymentMethod,
    });
  }, [order, user]);


  if (!order || !tracking) {
    return (
      <View style={styles.container}>
        <Stack.Screen options={{ title: 'Commande' }} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Commande introuvable</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: `Commande #${order.id.slice(-8).toUpperCase()}` }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.trackingCard}>
          <View style={styles.trackingHeader}>
            <Text style={styles.trackingTitle}>Suivi de commande</Text>
            <TouchableOpacity style={styles.codeBtn} onPress={handleCopyCode} activeOpacity={0.7}>
              <Text style={styles.codeText}>{tracking.trackingCode}</Text>
              <Copy size={14} color={Colors.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.timeline}>
            {tracking.timeline.map((event: OrderTimelineEvent, index: number) => {
              const IconComponent = STATUS_ICONS[event.status];
              const isLast = index === tracking.timeline.length - 1;
              const isActive = event.completed;

              return (
                <View key={event.status} style={styles.timelineItem}>
                  <View style={styles.timelineLeft}>
                    <View style={[
                      styles.timelineDot,
                      isActive && styles.timelineDotActive,
                    ]}>
                      <IconComponent size={16} color={isActive ? Colors.surface : Colors.border} />
                    </View>
                    {!isLast && (
                      <View style={[
                        styles.timelineLine,
                        isActive && styles.timelineLineActive,
                      ]} />
                    )}
                  </View>
                  <View style={[styles.timelineContent, !isLast && { paddingBottom: 24 }]}>
                    <Text style={[styles.timelineLabel, isActive && styles.timelineLabelActive]}>
                      {event.label}
                    </Text>
                    <Text style={styles.timelineDesc}>{event.description}</Text>
                    {isActive && (
                      <Text style={styles.timelineDate}>
                        {new Date(event.date).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {!!tracking.estimatedDelivery && order.status !== 'delivered' && order.status !== 'cancelled' && (
          <View style={styles.estimatedCard}>
            <Truck size={20} color={Colors.primary} />
            <View style={styles.estimatedContent}>
              <Text style={styles.estimatedLabel}>Livraison estimée</Text>
              <Text style={styles.estimatedDate}>
                {new Date(tracking.estimatedDelivery).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Articles</Text>
          {order.items.map((item, index) => (
            <View key={index} style={styles.itemRow}>
              {item.product.images?.[0] && (
                <Image source={{ uri: item.product.images[0] }} style={styles.itemImage} />
              )}
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>{item.product.name}</Text>
                <Text style={styles.itemQty}>Quantité: {item.quantity}</Text>
              </View>
              <Text style={styles.itemPrice}>
                {formatPrice(item.product.price * item.quantity, item.product.currency)}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Récapitulatif</Text>
          <View style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Sous-total</Text>
              <Text style={styles.summaryValue}>{formatPrice(order.subtotal, order.currency)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <View style={styles.deliveryLabel}>
                <Truck size={14} color={Colors.textSecondary} />
                <Text style={styles.summaryLabel}>Livraison</Text>
              </View>
              <Text style={styles.summaryValue}>
                {order.deliveryFee === 0 ? 'Gratuit' : formatPrice(order.deliveryFee, order.currency)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.summaryRow}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>{formatPrice(order.total, order.currency)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Détails</Text>
          <View style={styles.detailsCard}>
            {!!order.deliveryAddress && (
              <View style={styles.detailRow}>
                <MapPin size={16} color={Colors.textSecondary} />
                <Text style={styles.detailText}>{order.deliveryAddress}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <CreditCard size={16} color={Colors.textSecondary} />
              <Text style={styles.detailText}>
                {order.paymentMethod === 'orange_money' ? 'Orange Money'
                  : order.paymentMethod === 'wave' ? 'Wave'
                  : order.paymentMethod === 'free_money' ? 'Free Money'
                  : order.paymentMethod === 'paiement_livraison' ? 'Paiement à la livraison'
                  : order.paymentMethod === 'card' ? 'Carte bancaire'
                  : order.paymentMethod}
              </Text>
            </View>
          </View>
        </View>
        {/* #13 Boutons Facture PDF + WhatsApp */}
        <View style={styles.invoiceActions}>
          <TouchableOpacity
            style={styles.invoiceBtn}
            onPress={handleDownloadPDF}
            activeOpacity={0.8}
            disabled={generatingPDF}
          >
            <FileText size={18} color="#fff" />
            <Text style={styles.invoiceBtnText}>
              {generatingPDF ? 'Génération…' : 'Télécharger la facture'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.whatsappBtn}
            onPress={handleShareWhatsApp}
            activeOpacity={0.8}
          >
            <Share2 size={18} color="#25D366" />
            <Text style={styles.whatsappBtnText}>Partager WhatsApp</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  notFound: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  trackingCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 20,
    gap: 20,
  },
  trackingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackingTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  codeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.primary + '10',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  codeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  timeline: {
    gap: 0,
  },
  timelineItem: {
    flexDirection: 'row',
    gap: 14,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 32,
  },
  timelineDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.border + '40',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timelineDotActive: {
    backgroundColor: Colors.primary,
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: Colors.border,
    marginVertical: 4,
  },
  timelineLineActive: {
    backgroundColor: Colors.primary,
  },
  timelineContent: {
    flex: 1,
    gap: 2,
  },
  timelineLabel: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.textSecondary,
  },
  timelineLabelActive: {
    fontWeight: '700' as const,
    color: Colors.text,
  },
  timelineDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  timelineDate: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '500' as const,
    marginTop: 2,
  },
  estimatedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.primary + '08',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  estimatedContent: {
    flex: 1,
    gap: 2,
  },
  estimatedLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  estimatedDate: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    backgroundColor: Colors.border,
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  itemQty: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
  },
  deliveryLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.primary,
  },
  detailsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  detailText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  invoiceActions: {
    flexDirection: 'column',
    gap: 10,
    paddingHorizontal: 0,
    paddingBottom: 16,
  },
  invoiceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
  },
  invoiceBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  whatsappBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#fff',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#25D366',
  },
  whatsappBtnText: {
    color: '#25D366',
    fontWeight: '700',
    fontSize: 15,
  },
});
