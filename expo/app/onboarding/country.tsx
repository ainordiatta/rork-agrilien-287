import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useApp } from '@/contexts/AppContext';
import Colors from '@/constants/colors';
import { Country } from '@/types';

const countries = [
  { id: 'senegal' as Country, name: 'Sénégal', flag: '🇸🇳', color: '#1B6B2A' },
  { id: 'mali' as Country, name: 'Mali', flag: '🇲🇱', color: '#E8611A' },
];

export default function CountrySelectionScreen() {
  const router = useRouter();
  const { updateCountry } = useApp();
  const insets = useSafeAreaInsets();

  const handleCountrySelect = async (country: Country) => {
    await updateCountry(country);
    router.push('/onboarding/role');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#1B6B2A', '#2E8B3E', '#E8611A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, { paddingTop: insets.top }]}
      >
        <View style={styles.content}>
          <Image
            source={require('@/assets/images/agricien-login-logo.jpg')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.title}>Bienvenue sur</Text>
          <Text style={styles.appName}>AgriLien</Text>
          <Text style={styles.subtitle}>Votre marketplace agricole en Afrique de l&apos;Ouest</Text>

          <View style={styles.countriesContainer}>
            {countries.map((country) => (
              <TouchableOpacity
                key={country.id}
                style={styles.countryCard}
                onPress={() => handleCountrySelect(country.id)}
                activeOpacity={0.8}
              >
                <View style={styles.countryContent}>
                  <Text style={styles.flag}>{country.flag}</Text>
                  <Text style={styles.countryName}>{country.name}</Text>
                </View>
                <View style={[styles.colorBar, { backgroundColor: country.color }]} />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.footer}>Sélectionnez votre pays pour commencer</Text>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logo: {
    width: 260,
    height: 110,
    marginBottom: 16,
    tintColor: '#fff',
  },
  title: {
    fontSize: 24,
    color: '#fff',
    marginBottom: 8,
  },
  appName: {
    fontSize: 48,
    fontWeight: 'bold' as const,
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
    marginBottom: 48,
    textAlign: 'center',
  },
  countriesContainer: {
    width: '100%',
    gap: 16,
  },
  countryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  countryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  flag: {
    fontSize: 48,
  },
  countryName: {
    fontSize: 20,
    fontWeight: '600' as const,
    color: Colors.text,
    flex: 1,
  },
  colorBar: {
    height: 4,
    width: '100%',
  },
  footer: {
    marginTop: 32,
    fontSize: 14,
    color: '#fff',
    opacity: 0.8,
    textAlign: 'center',
  },
});
