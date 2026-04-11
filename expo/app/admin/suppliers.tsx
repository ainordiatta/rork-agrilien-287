import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useState } from 'react';
import { Plus, Users, Mail, Phone, Edit2, Trash2 } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useInventory } from '@/contexts/InventoryContext';

export default function SuppliersScreen() {
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useInventory();
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [phone, setPhone] = useState<string>('');
  const [address, setAddress] = useState<string>('');

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom du fournisseur est requis');
      return;
    }
    if (!email.trim() && !phone.trim()) {
      Alert.alert('Erreur', 'Veuillez fournir au moins un email ou un téléphone');
      return;
    }

    try {
      if (editingId) {
        await updateSupplier(editingId, {
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
        });
        Alert.alert('Succès', 'Fournisseur modifié avec succès');
      } else {
        await addSupplier({
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          address: address.trim(),
          products: [],
        });
        Alert.alert('Succès', 'Fournisseur ajouté avec succès');
      }
      
      resetForm();
    } catch (error) {
      console.error('Error saving supplier:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder le fournisseur');
    }
  };

  const handleEdit = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (supplier) {
      setName(supplier.name);
      setEmail(supplier.email);
      setPhone(supplier.phone);
      setAddress(supplier.address || '');
      setEditingId(supplierId);
      setShowForm(true);
    }
  };

  const handleDelete = (supplierId: string) => {
    const supplier = suppliers.find(s => s.id === supplierId);
    if (!supplier) return;

    Alert.alert(
      'Confirmer la suppression',
      `Supprimer le fournisseur "${supplier.name}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSupplier(supplierId);
              Alert.alert('Succès', 'Fournisseur supprimé');
            } catch (error) {
              console.error('Error deleting supplier:', error);
              Alert.alert('Erreur', 'Impossible de supprimer le fournisseur');
            }
          },
        },
      ]
    );
  };

  const resetForm = () => {
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setShowForm(false);
    setEditingId(null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowForm(!showForm)}
          activeOpacity={0.8}
        >
          <Plus size={20} color={Colors.surface} />
          <Text style={styles.addButtonText}>Ajouter un fournisseur</Text>
        </TouchableOpacity>
      </View>

      {showForm && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>
            {editingId ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}
          </Text>
          <View style={styles.form}>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Nom du fournisseur *"
              placeholderTextColor={Colors.textSecondary}
            />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Email"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="Téléphone"
              placeholderTextColor={Colors.textSecondary}
              keyboardType="phone-pad"
            />
            <TextInput
              style={[styles.input, styles.textArea]}
              value={address}
              onChangeText={setAddress}
              placeholder="Adresse (optionnel)"
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={2}
              textAlignVertical="top"
            />
            <View style={styles.formActions}>
              <TouchableOpacity
                style={[styles.formButton, styles.cancelButton]}
                onPress={resetForm}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.formButton, styles.saveButton]}
                onPress={handleSave}
                activeOpacity={0.8}
              >
                <Text style={styles.saveButtonText}>
                  {editingId ? 'Modifier' : 'Ajouter'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {suppliers.length === 0 ? (
          <View style={styles.emptyState}>
            <Users size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>Aucun fournisseur</Text>
            <Text style={styles.emptySubtext}>
              Ajoutez vos fournisseurs pour mieux gérer vos approvisionnements
            </Text>
          </View>
        ) : (
          suppliers.map((supplier) => (
            <View key={supplier.id} style={styles.supplierCard}>
              <View style={styles.supplierInfo}>
                <Text style={styles.supplierName}>{supplier.name}</Text>
                {!!supplier.email && (
                  <View style={styles.contactRow}>
                    <Mail size={14} color={Colors.textSecondary} />
                    <Text style={styles.contactText}>{supplier.email}</Text>
                  </View>
                )}
                {!!supplier.phone && (
                  <View style={styles.contactRow}>
                    <Phone size={14} color={Colors.textSecondary} />
                    <Text style={styles.contactText}>{supplier.phone}</Text>
                  </View>
                )}
                {!!supplier.address && (
                  <Text style={styles.addressText}>{supplier.address}</Text>
                )}
              </View>
              <View style={styles.supplierActions}>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleEdit(supplier.id)}
                  activeOpacity={0.8}
                >
                  <Edit2 size={18} color={Colors.text} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={() => handleDelete(supplier.id)}
                  activeOpacity={0.8}
                >
                  <Trash2 size={18} color={Colors.error} />
                </TouchableOpacity>
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
  header: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingVertical: 12,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
  formCard: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 16,
  },
  form: {
    gap: 12,
  },
  input: {
    backgroundColor: Colors.background,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  textArea: {
    minHeight: 60,
    paddingTop: 12,
  },
  formActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  formButton: {
    flex: 1,
    paddingVertical: 12,
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
  saveButton: {
    backgroundColor: Colors.primary,
  },
  saveButtonText: {
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
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  supplierCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  supplierInfo: {
    flex: 1,
    gap: 6,
  },
  supplierName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  contactText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  addressText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  supplierActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
  },
});
