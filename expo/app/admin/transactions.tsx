import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ArrowDownCircle, ArrowUpCircle, RefreshCw, Package } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useInventory } from '@/contexts/InventoryContext';
import { TransactionType } from '@/types';

export default function TransactionsScreen() {
  const { transactions } = useInventory();

  const formatPrice = (price: number) => {
    return `${price.toLocaleString('fr-FR')} FCFA`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case 'vente':
        return <ArrowUpCircle size={20} color="#4CAF50" />;
      case 'achat':
        return <ArrowDownCircle size={20} color="#2196F3" />;
      case 'reapprovisionnement':
        return <Package size={20} color="#FF9800" />;
      case 'transfert':
        return <RefreshCw size={20} color={Colors.textSecondary} />;
    }
  };

  const getTransactionLabel = (type: TransactionType) => {
    const labels = {
      vente: 'Vente',
      achat: 'Achat',
      reapprovisionnement: 'Réappro.',
      transfert: 'Transfert',
    };
    return labels[type];
  };

  const getTransactionColor = (type: TransactionType) => {
    switch (type) {
      case 'vente':
        return '#4CAF50';
      case 'achat':
        return '#2196F3';
      case 'reapprovisionnement':
        return '#FF9800';
      case 'transfert':
        return Colors.textSecondary;
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Aucune transaction</Text>
            <Text style={styles.emptySubtext}>
              Les transactions apparaîtront ici
            </Text>
          </View>
        ) : (
          transactions.map((transaction) => (
            <View key={transaction.id} style={styles.transactionCard}>
              <View style={styles.iconContainer}>
                {getTransactionIcon(transaction.type)}
              </View>
              <View style={styles.transactionInfo}>
                <View style={styles.transactionHeader}>
                  <Text style={styles.productName}>{transaction.productName}</Text>
                  <Text style={styles.amount}>{formatPrice(transaction.amount)}</Text>
                </View>
                <View style={styles.transactionDetails}>
                  <View style={[
                    styles.typeBadge,
                    { backgroundColor: getTransactionColor(transaction.type) + '20' }
                  ]}>
                    <Text style={[
                      styles.typeText,
                      { color: getTransactionColor(transaction.type) }
                    ]}>
                      {getTransactionLabel(transaction.type)}
                    </Text>
                  </View>
                  <Text style={styles.quantity}>
                    {transaction.type === 'vente' ? '-' : '+'}{transaction.quantity} unités
                  </Text>
                </View>
                <Text style={styles.date}>{formatDate(transaction.date)}</Text>
                {!!transaction.notes && (
                  <Text style={styles.notes}>{transaction.notes}</Text>
                )}
              </View>
            </View>
          ))
        )}
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
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 8,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  transactionCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionInfo: {
    flex: 1,
    gap: 6,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  productName: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  amount: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  transactionDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  quantity: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  date: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  notes: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic' as const,
  },
});
