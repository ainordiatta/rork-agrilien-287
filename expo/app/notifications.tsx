import { View, Text, StyleSheet, FlatList, TouchableOpacity, Animated } from 'react-native';
import { Stack } from 'expo-router';
import { Bell, Package, MessageCircle, AlertTriangle, Megaphone, Settings, CheckCheck, Trash2 } from 'lucide-react-native';
import { useCallback, useRef } from 'react';
import Colors from '@/constants/colors';
import { useNotifications, AppNotification, NotificationType } from '@/contexts/NotificationsContext';
import React from 'react';

const ICON_MAP: Record<NotificationType, { icon: typeof Bell; color: string; bg: string }> = {
  order: { icon: Package, color: '#2196F3', bg: '#E3F2FD' },
  message: { icon: MessageCircle, color: Colors.primary, bg: '#E8F5E9' },
  stock: { icon: AlertTriangle, color: '#FF9800', bg: '#FFF3E0' },
  promotion: { icon: Megaphone, color: '#9C27B0', bg: '#F3E5F5' },
  system: { icon: Settings, color: Colors.textSecondary, bg: '#F5F5F5' },
};

const NotificationItem = React.memo(({ item, onPress, onDelete }: {
  item: AppNotification;
  onPress: (id: string) => void;
  onDelete: (id: string) => void;
}) => {
  const config = ICON_MAP[item.type];
  const IconComponent = config.icon;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const handleDelete = useCallback(() => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => onDelete(item.id));
  }, [fadeAnim, item.id, onDelete]);

  const timeAgo = getTimeAgo(item.createdAt);

  return (
    <Animated.View style={{ opacity: fadeAnim }}>
      <TouchableOpacity
        style={[styles.notifItem, !item.read && styles.notifItemUnread]}
        onPress={() => onPress(item.id)}
        activeOpacity={0.7}
      >
        <View style={[styles.notifIcon, { backgroundColor: config.bg }]}>
          <IconComponent size={20} color={config.color} />
        </View>
        <View style={styles.notifContent}>
          <View style={styles.notifHeader}>
            <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]} numberOfLines={1}>
              {item.title}
            </Text>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
          <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
          <Text style={styles.notifTime}>{timeAgo}</Text>
        </View>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Trash2 size={16} color={Colors.textSecondary} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
});

function getTimeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diff < 60) return "À l'instant";
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)}j`;
  return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function NotificationsScreen() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotifications();

  const handlePress = useCallback((id: string) => {
    markAsRead(id);
  }, [markAsRead]);

  const handleDelete = useCallback((id: string) => {
    deleteNotification(id);
  }, [deleteNotification]);

  const renderItem = useCallback(({ item }: { item: AppNotification }) => (
    <NotificationItem item={item} onPress={handlePress} onDelete={handleDelete} />
  ), [handlePress, handleDelete]);

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Notifications',
          headerRight: () => unreadCount > 0 ? (
            <TouchableOpacity onPress={markAllAsRead} style={styles.headerAction}>
              <CheckCheck size={20} color={Colors.primary} />
            </TouchableOpacity>
          ) : null,
        }}
      />

      {notifications.length > 0 && (
        <View style={styles.summaryBar}>
          <Text style={styles.summaryText}>
            {unreadCount > 0 ? `${unreadCount} non lue${unreadCount > 1 ? 's' : ''}` : 'Tout est lu'}
          </Text>
          {notifications.length > 5 && (
            <TouchableOpacity onPress={clearAll}>
              <Text style={styles.clearText}>Tout supprimer</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, notifications.length === 0 && styles.listEmpty]}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Bell size={48} color={Colors.border} />
            </View>
            <Text style={styles.emptyTitle}>Aucune notification</Text>
            <Text style={styles.emptySubtitle}>
              Vous recevrez des notifications pour les commandes, messages et alertes de stock.
            </Text>
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
  headerAction: {
    paddingHorizontal: 8,
  },
  summaryBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  clearText: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: '500' as const,
  },
  list: {
    padding: 12,
    gap: 8,
  },
  listEmpty: {
    flex: 1,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  notifItemUnread: {
    backgroundColor: '#FAFFFE',
    borderColor: Colors.primary + '30',
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  notifIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifContent: {
    flex: 1,
    gap: 4,
  },
  notifHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: Colors.text,
    flex: 1,
  },
  notifTitleUnread: {
    fontWeight: '700' as const,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  notifBody: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  notifTime: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  deleteBtn: {
    padding: 4,
    marginTop: 2,
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
    lineHeight: 20,
  },
});
