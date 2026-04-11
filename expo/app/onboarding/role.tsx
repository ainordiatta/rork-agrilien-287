import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Store, ShoppingBag, ArrowLeft } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import Colors from '@/constants/colors';
import { UserRole } from '@/types';

const roles = [
  {
    id: 'acheteur' as UserRole,
    title: 'Acheteur',
    description: 'Je veux acheter des produits agricoles',
    icon: ShoppingBag,
    color: Colors.secondary,
    bgColor: '#FFF3ED',
  },
  {
    id: 'producteur' as UserRole,
    title: 'Producteur/Éleveur',
    description: 'Je veux vendre mes produits agricoles',
    icon: Store,
    color: Colors.primary,
    bgColor: '#EDF7EF',
  },
];

export default function RoleSelectionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleRoleSelect = (role: UserRole) => {
    router.push(`/onboarding/register?role=${role}`);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.topSafeArea, { height: insets.top }]} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={24} color={Colors.text} />
        </TouchableOpacity>

        <View style={styles.content}>
          <Image
            source={require('@/assets/images/agricien-login-logo.jpg')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Qui êtes-vous ?</Text>
          <Text style={styles.subtitle}>Choisissez votre profil pour continuer</Text>

          <View style={styles.rolesContainer}>
            {roles.map((role) => {
              const IconComponent = role.icon;
              return (
                <TouchableOpacity
                  key={role.id}
                  style={styles.roleCard}
                  onPress={() => handleRoleSelect(role.id)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.iconContainer, { backgroundColor: role.bgColor }]}>
                    <IconComponent size={48} color={role.color} />
                  </View>
                  <View style={styles.roleTextContainer}>
                    <Text style={styles.roleTitle}>{role.title}</Text>
                    <Text style={styles.roleDescription}>{role.description}</Text>
                  </View>
                  <LinearGradient
                    colors={['#1B6B2A', '#2E8B3E', '#E8611A']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.roleBar}
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  topSafeArea: {
    backgroundColor: '#fff',
  },
  backButton: {
    marginLeft: 24,
    marginTop: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  logo: {
    width: 260,
    height: 110,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 48,
    textAlign: 'center',
  },
  rolesContainer: {
    width: '100%',
    gap: 20,
  },
  roleCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  roleTextContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    flexDirection: 'column',
    alignItems: 'center',
  },
  roleTitle: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: Colors.text,
    marginBottom: 6,
  },
  roleDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  roleBar: {
    height: 4,
    width: '100%',
  },
});
