import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Crown, Zap, BarChart3, Tag, ChevronLeft, CreditCard, Smartphone } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { useApp } from '@/contexts/AppContext';

export default function PremiumScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, updateUser } = useApp();
  
  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'orange' | 'wave' | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const features = [
    {
      icon: <Zap size={24} color={Colors.surface} />,
      title: 'IA Illimitée',
      description: 'Générez autant de fiches produits que vous le souhaitez automatiquement via l\'intelligence artificielle.',
      bgColor: '#FF9800'
    },
    {
      icon: <Crown size={24} color={Colors.surface} />,
      title: 'Visibilité Maximum',
      description: 'Vos produits apparaissent en premier dans les recherches avec le badge "Sponsorisé".',
      bgColor: '#FFD700'
    },
    {
      icon: <BarChart3 size={24} color={Colors.surface} />,
      title: 'Données du Marché',
      description: 'Accédez à l\'historique complet des prix et optimisez vos marges intelligemment.',
      bgColor: '#4CAF50'
    },
    {
      icon: <Tag size={24} color={Colors.surface} />,
      title: 'Zéro Commission',
      description: 'Vous gardez 100% de vos revenus. Aucune commission sur vos ventes.',
      bgColor: '#2196F3'
    }
  ];

  const handleSubscribe = () => {
    if (!user) {
      Alert.alert('Connexion', 'Veuillez vous connecter pour vous abonner');
      return;
    }
    setPaymentModalVisible(true);
  };

  const processPayment = () => {
    if (!phoneNumber || phoneNumber.length < 8) {
      Alert.alert('Erreur', 'Veuillez saisir un numéro de téléphone valide');
      return;
    }
    
    setIsProcessing(true);
    // Simulate mobile money API delay
    setTimeout(() => {
      setIsProcessing(false);
      setPaymentModalVisible(false);
      
      if (user) {
        updateUser({ ...user, isPremium: true });
        Alert.alert(
          'Félicitations ! 🎉', 
          'Votre compte est désormais Premium. Profitez de tous vos nouveaux avantages.',
          [{ text: 'OK', onPress: () => router.back() }]
        );
      }
    }, 3000);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} activeOpacity={0.8}>
          <ChevronLeft size={24} color={Colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AgriLien Premium</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroSection}>
          <View style={styles.crownContainer}>
            <Crown size={48} color="#FFD700" />
          </View>
          <Text style={styles.heroTitle}>Devenez un Vendeur d'Élite</Text>
          <Text style={styles.heroSubtitle}>
            Débloquez la puissance de l'IA et boostez vos ventes pour seulement <Text style={styles.priceHighlight}>5 000 FCFA / mois</Text>.
          </Text>
        </View>

        <View style={styles.featuresList}>
          {features.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={[styles.featureIconContainer, { backgroundColor: feature.bgColor }]}>
                {feature.icon}
              </View>
              <View style={styles.featureTextContainer}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.subscribeButton} onPress={handleSubscribe} activeOpacity={0.8}>
          <Text style={styles.subscribeButtonText}>
            {user?.isPremium ? 'Gérer mon abonnement' : 'S\'abonner (5 000 FCFA)'}
          </Text>
        </TouchableOpacity>
        {!user?.isPremium && (
          <Text style={styles.footerHint}>Sans engagement. Annulez à tout moment.</Text>
        )}
      </View>

      <Modal
        visible={paymentModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => !isProcessing && setPaymentModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {isProcessing ? (
              <View style={styles.processingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.processingTitle}>En attente de validation</Text>
                <Text style={styles.processingText}>
                  Veuillez confirmer le paiement de 5 000 FCFA sur votre téléphone via {selectedMethod === 'orange' ? 'Orange Money' : 'Wave'}...
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.modalTitle}>Choisir le moyen de paiement</Text>
                
                <View style={styles.paymentMethods}>
                  <TouchableOpacity 
                    style={[styles.paymentMethodBtn, selectedMethod === 'orange' && styles.paymentMethodActive, { borderColor: '#FF6600' }]} 
                    onPress={() => setSelectedMethod('orange')}
                    activeOpacity={0.8}
                  >
                    <Smartphone size={24} color="#FF6600" />
                    <Text style={styles.paymentMethodText}>Orange Money</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.paymentMethodBtn, selectedMethod === 'wave' && styles.paymentMethodActive, { borderColor: '#1CA3F3' }]} 
                    onPress={() => setSelectedMethod('wave')}
                    activeOpacity={0.8}
                  >
                    <Smartphone size={24} color="#1CA3F3" />
                    <Text style={styles.paymentMethodText}>Wave</Text>
                  </TouchableOpacity>
                </View>

                {selectedMethod && (
                  <View style={styles.phoneInputContainer}>
                    <Text style={styles.inputLabel}>Numéro de compte {selectedMethod === 'orange' ? 'OM' : 'Wave'}</Text>
                    {/* Simulated input for the mock since we don't import TextInput here for brevity, we'll just use a styled View to act as the form */}
                    <TouchableOpacity style={styles.fakeInput} onPress={() => setPhoneNumber('771234567')}>
                      <Text style={{ color: phoneNumber ? Colors.text : Colors.textSecondary }}>
                        {phoneNumber || 'Appuyez pour remplir: 77 123 45 67'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                <View style={styles.modalActions}>
                  <TouchableOpacity 
                    style={styles.cancelBtn} 
                    onPress={() => setPaymentModalVisible(false)}
                  >
                    <Text style={styles.cancelBtnText}>Annuler</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.confirmBtn, (!selectedMethod || !phoneNumber) && styles.disabledBtn]} 
                    onPress={processPayment}
                    disabled={!selectedMethod || !phoneNumber}
                  >
                    <Text style={styles.confirmBtnText}>Payer</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroSection: {
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#1E293B',
  },
  crownContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  heroTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.surface,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 24,
  },
  priceHighlight: {
    color: '#FFD700',
    fontWeight: 'bold',
  },
  featuresList: {
    padding: 16,
    gap: 16,
    marginTop: -20,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    alignItems: 'center',
  },
  featureIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.surface,
    padding: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  subscribeButton: {
    backgroundColor: '#FFD700',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  subscribeButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footerHint: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: 12,
    marginTop: 8,
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
    minHeight: 300,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    marginBottom: 24,
    textAlign: 'center',
  },
  paymentMethods: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  paymentMethodBtn: {
    flex: 1,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  paymentMethodActive: {
    backgroundColor: '#F8FAFC',
  },
  paymentMethodText: {
    fontWeight: '600',
    color: Colors.text,
  },
  phoneInputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  fakeInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 16,
    backgroundColor: '#F8FAFC',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 16,
  },
  cancelBtn: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  confirmBtn: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: Colors.primary,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  confirmBtnText: {
    fontWeight: '600',
    color: Colors.surface,
  },
  processingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  processingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.text,
    marginTop: 24,
    marginBottom: 8,
  },
  processingText: {
    textAlign: 'center',
    color: Colors.textSecondary,
    lineHeight: 24,
  }
});
