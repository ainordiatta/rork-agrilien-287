import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { useState } from 'react';
import { Plus, FolderTree, Edit2, Trash2, X, ChevronDown, ChevronRight, ShieldAlert } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useInventory } from '@/contexts/InventoryContext';
import { useApp } from '@/contexts/AppContext';

export default function CategoriesScreen() {
  const { categories, addCategory, updateCategory, deleteCategory } = useInventory();
  const { user } = useApp();
  const isSuperAdmin = user?.isSuperAdmin === true;
  const [showForm, setShowForm] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [subcategories, setSubcategories] = useState<string[]>([]);
  const [newSubcategory, setNewSubcategory] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Le nom de la catégorie est requis');
      return;
    }

    try {
      if (editingId) {
        await updateCategory(editingId, {
          name: name.trim(),
          description: description.trim(),
          subcategories: subcategories,
        });
        Alert.alert('Succès', 'Catégorie modifiée avec succès');
      } else {
        await addCategory({
          name: name.trim(),
          description: description.trim(),
          subcategories: subcategories,
        });
        Alert.alert('Succès', 'Catégorie ajoutée avec succès');
      }
      
      setName('');
      setDescription('');
      setSubcategories([]);
      setNewSubcategory('');
      setShowForm(false);
      setEditingId(null);
    } catch (error) {
      console.error('Error saving category:', error);
      Alert.alert('Erreur', 'Impossible de sauvegarder la catégorie');
    }
  };

  const handleEdit = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      setName(category.name);
      setDescription(category.description || '');
      setSubcategories(category.subcategories || []);
      setNewSubcategory('');
      setEditingId(categoryId);
      setShowForm(true);
    }
  };

  const handleDelete = (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    Alert.alert(
      'Confirmer la suppression',
      `Supprimer la catégorie "${category.name}" ?${category.productCount > 0 ? `\n\n${category.productCount} produit(s) sont dans cette catégorie.` : ''}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(categoryId);
              Alert.alert('Succès', 'Catégorie supprimée');
            } catch (error) {
              console.error('Error deleting category:', error);
              Alert.alert('Erreur', 'Impossible de supprimer la catégorie');
            }
          },
        },
      ]
    );
  };

  const handleCancel = () => {
    setName('');
    setDescription('');
    setSubcategories([]);
    setNewSubcategory('');
    setShowForm(false);
    setEditingId(null);
  };

  const handleAddSubcategory = () => {
    if (!newSubcategory.trim()) return;
    if (subcategories.includes(newSubcategory.trim())) {
      Alert.alert('Erreur', 'Cette sous-catégorie existe déjà');
      return;
    }
    setSubcategories([...subcategories, newSubcategory.trim()]);
    setNewSubcategory('');
  };

  const handleRemoveSubcategory = (index: number) => {
    setSubcategories(subcategories.filter((_, i) => i !== index));
  };

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {isSuperAdmin ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => {
              setName('');
              setDescription('');
              setSubcategories([]);
              setNewSubcategory('');
              setEditingId(null);
              setShowForm(true);
            }}
            activeOpacity={0.8}
          >
            <Plus size={20} color={Colors.surface} />
            <Text style={styles.addButtonText}>Ajouter une catégorie</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.restrictedBanner}>
            <ShieldAlert size={18} color={Colors.textSecondary} />
            <Text style={styles.restrictedText}>Seuls les super admins peuvent gérer les catégories</Text>
          </View>
        )}
      </View>

      <Modal
        visible={showForm}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCancel}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingId ? 'Modifier la catégorie' : 'Nouvelle catégorie'}
              </Text>
              <TouchableOpacity onPress={handleCancel} activeOpacity={0.8}>
                <X size={24} color={Colors.text} />
              </TouchableOpacity>
            </View>
            
            <ScrollView 
              style={styles.modalBody} 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.form}>
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Nom de la catégorie *</Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="Ex: Cuisine et maison"
                    placeholderTextColor={Colors.textSecondary}
                    autoFocus={true}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Description (optionnel)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={description}
                    onChangeText={setDescription}
                    placeholder="Description de la catégorie"
                    placeholderTextColor={Colors.textSecondary}
                    multiline
                    numberOfLines={3}
                    textAlignVertical="top"
                  />
                </View>

                <View style={styles.subcategorySection}>
                  <Text style={styles.subcategoryTitle}>Sous-catégories</Text>
                  
                  {subcategories.length > 0 && (
                    <View style={styles.subcategoryList}>
                      {subcategories.map((sub, index) => (
                        <View key={index} style={styles.subcategoryItem}>
                          <Text style={styles.subcategoryText}>{sub}</Text>
                          <TouchableOpacity
                            onPress={() => handleRemoveSubcategory(index)}
                            activeOpacity={0.8}
                          >
                            <X size={18} color={Colors.error} />
                          </TouchableOpacity>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={styles.addSubcategoryContainer}>
                    <TextInput
                      style={[styles.input, styles.subcategoryInput]}
                      value={newSubcategory}
                      onChangeText={setNewSubcategory}
                      placeholder="Ex: Petit électroménager"
                      placeholderTextColor={Colors.textSecondary}
                      onSubmitEditing={handleAddSubcategory}
                      returnKeyType="done"
                    />
                    <TouchableOpacity
                      style={styles.addSubcategoryButton}
                      onPress={handleAddSubcategory}
                      activeOpacity={0.8}
                    >
                      <Plus size={20} color={Colors.surface} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={[styles.formButton, styles.cancelButton]}
                onPress={handleCancel}
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
        </KeyboardAvoidingView>
      </Modal>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {categories.length === 0 ? (
          <View style={styles.emptyState}>
            <FolderTree size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyText}>Aucune catégorie</Text>
            <Text style={styles.emptySubtext}>
              Créez des catégories pour organiser vos produits
            </Text>
          </View>
        ) : (
          categories.map((category) => {
            const isExpanded = expandedCategories.has(category.id);
            return (
              <View key={category.id} style={styles.categoryCard}>
                <View style={styles.categoryMain}>
                  <TouchableOpacity
                    style={styles.categoryHeader}
                    onPress={() => toggleExpanded(category.id)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.categoryTitleRow}>
                      <FolderTree size={20} color={Colors.primary} />
                      <Text style={styles.categoryName}>{category.name}</Text>
                      {category.subcategories && category.subcategories.length > 0 && (
                        <View style={styles.subcategoryBadge}>
                          <Text style={styles.subcategoryBadgeText}>
                            {category.subcategories.length}
                          </Text>
                        </View>
                      )}
                    </View>
                    {category.subcategories && category.subcategories.length > 0 && (
                      isExpanded ? (
                        <ChevronDown size={20} color={Colors.textSecondary} />
                      ) : (
                        <ChevronRight size={20} color={Colors.textSecondary} />
                      )
                    )}
                  </TouchableOpacity>
                  
                  <View style={styles.categoryInfo}>
                    {!!category.description && (
                      <Text style={styles.categoryDescription}>{category.description}</Text>
                    )}
                    <Text style={styles.productCount}>
                      {category.productCount} produit{category.productCount > 1 ? 's' : ''}
                    </Text>
                  </View>

                  {isExpanded && category.subcategories && category.subcategories.length > 0 && (
                    <View style={styles.subcategoriesExpanded}>
                      {category.subcategories.map((sub, index) => (
                        <View key={index} style={styles.subcategoryExpandedItem}>
                          <Text style={styles.subcategoryExpandedText}>{sub}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {isSuperAdmin && (
                  <View style={styles.categoryActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEdit(category.id)}
                      activeOpacity={0.8}
                    >
                      <Edit2 size={18} color={Colors.text} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleDelete(category.id)}
                      activeOpacity={0.8}
                    >
                      <Trash2 size={18} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
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
  restrictedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FFF3E0',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  restrictedText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500' as const,
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  modalBody: {
    maxHeight: 400,
  },
  form: {
    padding: 20,
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
    minHeight: 80,
    paddingTop: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  subcategorySection: {
    marginBottom: 16,
  },
  subcategoryTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
  },
  subcategoryList: {
    marginTop: 8,
    marginBottom: 8,
  },
  subcategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  subcategoryText: {
    fontSize: 14,
    color: Colors.text,
    flex: 1,
  },
  addSubcategoryContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  subcategoryInput: {
    flex: 1,
  },
  addSubcategoryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
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
  },
  categoryCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  categoryMain: {
    flex: 1,
    gap: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  subcategoryBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  subcategoryBadgeText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: Colors.surface,
  },
  categoryInfo: {
    gap: 4,
  },
  categoryDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  productCount: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600' as const,
  },
  subcategoriesExpanded: {
    marginTop: 8,
    gap: 6,
    paddingLeft: 28,
  },
  subcategoryExpandedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subcategoryExpandedText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  categoryActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  actionButton: {
    padding: 8,
  },
});
