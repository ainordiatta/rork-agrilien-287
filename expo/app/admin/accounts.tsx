import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { useState, useMemo } from 'react';
import { Search, UserPlus, MoreVertical, Mail, Phone, MapPin, Shield, Trash2, Edit, X } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { User, UserRole } from '@/types';

export default function AccountsScreen() {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterRole, setFilterRole] = useState<UserRole | 'all'>('all');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [mockUsers] = useState<User[]>([]);

  const filteredUsers = useMemo(() => {
    let filtered = mockUsers;
    
    if (filterRole !== 'all') {
      filtered = filtered.filter(u => u.role === filterRole);
    }
    
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        u => u.name.toLowerCase().includes(query) || 
             u.email.toLowerCase().includes(query) ||
             u.phone.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  }, [mockUsers, filterRole, searchQuery]);

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return { bg: '#E3F2FD', text: '#2196F3' };
      case 'producteur':
        return { bg: '#FFF3E0', text: '#FF9800' };
      case 'acheteur':
        return { bg: '#E8F5E9', text: '#4CAF50' };
      default:
        return { bg: Colors.background, text: Colors.textSecondary };
    }
  };

  const getRoleLabel = (role: UserRole) => {
    const labels: Record<UserRole, string> = {
      admin: 'Administrateur',
      producteur: 'Producteur/Éleveur',
      acheteur: 'Acheteur',
    };
    return labels[role];
  };

  const handleDeleteUser = (user: User) => {
    Alert.alert(
      'Supprimer le compte',
      `Êtes-vous sûr de vouloir supprimer le compte de ${user.name}?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => {
            alert('Fonctionnalité de suppression à implémenter');
          },
        },
      ]
    );
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const renderUserCard = (user: User) => {
    const roleColors = getRoleBadgeColor(user.role);
    
    return (
      <View key={user.id} style={styles.userCard}>
        <View style={styles.userHeader}>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{user.name}</Text>
            <View style={[styles.roleBadge, { backgroundColor: roleColors.bg }]}>
              <Shield size={12} color={roleColors.text} />
              <Text style={[styles.roleText, { color: roleColors.text }]}>
                {getRoleLabel(user.role)}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.moreButton}
            onPress={() => {
              setSelectedUser(user);
            }}
            activeOpacity={0.8}
          >
            <MoreVertical size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.userDetails}>
          <View style={styles.detailRow}>
            <Mail size={14} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{user.email}</Text>
          </View>
          <View style={styles.detailRow}>
            <Phone size={14} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{user.phone}</Text>
          </View>
          <View style={styles.detailRow}>
            <MapPin size={14} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{user.city}</Text>
          </View>
        </View>

        {selectedUser?.id === user.id && (
          <View style={styles.actionsMenu}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEditUser(user)}
              activeOpacity={0.8}
            >
              <Edit size={16} color={Colors.primary} />
              <Text style={styles.actionText}>Modifier</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, { borderTopWidth: 1, borderTopColor: Colors.border }]}
              onPress={() => handleDeleteUser(user)}
              activeOpacity={0.8}
            >
              <Trash2 size={16} color={Colors.error} />
              <Text style={[styles.actionText, { color: Colors.error }]}>Supprimer</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Search size={20} color={Colors.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Rechercher un utilisateur..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.textSecondary}
          />
        </View>

        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterChip, filterRole === 'all' && styles.filterChipActive]}
            onPress={() => setFilterRole('all')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, filterRole === 'all' && styles.filterChipTextActive]}>
              Tous ({mockUsers.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterRole === 'admin' && styles.filterChipActive]}
            onPress={() => setFilterRole('admin')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, filterRole === 'admin' && styles.filterChipTextActive]}>
              Admins ({mockUsers.filter(u => u.role === 'admin').length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterRole === 'producteur' && styles.filterChipActive]}
            onPress={() => setFilterRole('producteur')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, filterRole === 'producteur' && styles.filterChipTextActive]}>
              Producteurs ({mockUsers.filter(u => u.role === 'producteur').length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterChip, filterRole === 'acheteur' && styles.filterChipActive]}
            onPress={() => setFilterRole('acheteur')}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, filterRole === 'acheteur' && styles.filterChipTextActive]}>
              Acheteurs ({mockUsers.filter(u => u.role === 'acheteur').length})
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.addButton}
          onPress={() => alert('Ajouter un utilisateur - Fonctionnalité à venir')}
          activeOpacity={0.8}
        >
          <UserPlus size={20} color={Colors.surface} />
          <Text style={styles.addButtonText}>Ajouter un utilisateur</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'Aucun utilisateur trouvé' : 'Aucun utilisateur'}
            </Text>
            <Text style={styles.emptySubtext}>
              Les comptes utilisateurs apparaîtront ici
            </Text>
          </View>
        ) : (
          filteredUsers.map(renderUserCard)
        )}
      </ScrollView>

      <Modal
        visible={showModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Modifier l&apos;utilisateur</Text>
              <TouchableOpacity onPress={() => setShowModal(false)} activeOpacity={0.8}>
                <X size={24} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.modalText}>
              Fonctionnalité de modification à implémenter
            </Text>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowModal(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.modalButtonText}>Fermer</Text>
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
    backgroundColor: Colors.surface,
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchContainer: {
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
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.surface,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.surface,
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
  userCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
    gap: 6,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleText: {
    fontSize: 11,
    fontWeight: '700' as const,
  },
  moreButton: {
    padding: 4,
  },
  userDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  actionsMenu: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 12,
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.primary,
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
    padding: 20,
    width: '100%',
    maxWidth: 400,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: Colors.text,
  },
  modalText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  modalButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
});
