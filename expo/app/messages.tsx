import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { MessageCircle } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useMessages } from '@/contexts/MessagesContext';
import { Conversation } from '@/types';
import { formatPrice } from '@/mocks/data';

export default function MessagesScreen() {
  const router = useRouter();
  const { conversations } = useMessages();

  const renderConversation = ({ item }: { item: Conversation }) => {
    return (
      <TouchableOpacity
        style={styles.conversationCard}
        onPress={() => router.push(`/chat/${item.id}` as any)}
        activeOpacity={0.8}
      >
        <Image source={{ uri: item.productImage }} style={styles.productImage} />
        <View style={styles.conversationContent}>
          <View style={styles.conversationHeader}>
            <Text style={styles.productName} numberOfLines={1}>
              {item.productName}
            </Text>
            {item.unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadText}>{item.unreadCount}</Text>
              </View>
            )}
          </View>
          <Text style={styles.sellerName} numberOfLines={1}>
            {item.sellerName}
          </Text>
          <Text style={styles.price}>
            {formatPrice(item.productPrice, item.currency)}
          </Text>
          {!!item.lastMessage && (
            <Text style={styles.lastMessage} numberOfLines={1}>
              {item.lastMessage}
            </Text>
          )}
          {!!item.lastMessageAt && (
            <Text style={styles.timestamp}>
              {new Date(item.lastMessageAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Messages', headerShown: true }} />
      <View style={styles.container}>
        {conversations.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MessageCircle size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>Aucune conversation</Text>
            <Text style={styles.emptyText}>
              Contactez un producteur depuis la page d&apos;un produit agricole
            </Text>
          </View>
        ) : (
          <FlatList
            data={conversations}
            renderItem={renderConversation}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
    color: Colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  conversationCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  productImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.border,
  },
  conversationContent: {
    flex: 1,
    gap: 4,
  },
  conversationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  productName: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold' as const,
    color: Colors.text,
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadText: {
    fontSize: 12,
    fontWeight: 'bold' as const,
    color: Colors.surface,
  },
  sellerName: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  price: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: Colors.primary,
  },
  lastMessage: {
    fontSize: 13,
    color: Colors.text,
    marginTop: 4,
  },
  timestamp: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
});
