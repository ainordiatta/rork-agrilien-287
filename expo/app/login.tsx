import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Lock, Eye, EyeOff } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { login, loginLoading } = useAuth();
  const insets = useSafeAreaInsets();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }

    if (!email.includes('@')) {
      Alert.alert('Erreur', 'Veuillez entrer un email valide');
      return;
    }

    try {
      console.log('[Login] Attempting Supabase login for:', email);
      await login({ email: email.trim(), password });
      console.log('[Login] Login successful, navigating to tabs');
      router.replace('/(tabs)');
    } catch (error: unknown) {
      console.error('[Login] Login error:', error);
      const message = error instanceof Error ? error.message : 'Une erreur est survenue';

      if (message.includes('Invalid login credentials')) {
        Alert.alert('Erreur', 'Email ou mot de passe incorrect. Vérifiez vos identifiants et réessayez.');
      } else if (message.includes('Email not confirmed')) {
        Alert.alert(
          'Email non confirmé',
          'Veuillez vérifier votre boîte email et confirmer votre adresse avant de vous connecter.'
        );
      } else if (message.includes('Aucun compte')) {
        Alert.alert('Compte introuvable', message);
      } else {
        Alert.alert('Erreur de connexion', message);
      }
    }
  };

  const handleSignUp = () => {
    router.push('/onboarding/role');
  };

  return (
    <View style={styles.container}>
      <View style={[styles.topSafeArea, { height: insets.top }]} />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Image
              source={require('@/assets/images/agricien-login-logo.jpg')}
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.title}>Hello,</Text>
            <Text style={styles.subtitle}>Merci de vous connecter avec{"\n"}vos identifiants</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <User size={24} color="#E8611A" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loginLoading}
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock size={24} color="#E8611A" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Mot de passe"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                editable={!loginLoading}
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {showPassword ? (
                  <EyeOff size={22} color="#999" />
                ) : (
                  <Eye size={22} color="#999" />
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleLogin} activeOpacity={0.9} disabled={loginLoading}>
              <LinearGradient
                colors={['#1B6B2A', '#2E8B3E', '#E8611A']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.loginButton, loginLoading && styles.loginButtonDisabled]}
              >
                {loginLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.loginButtonText}>Envoyer</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Pas encore compte ? </Text>
            <TouchableOpacity onPress={handleSignUp}>
              <Text style={styles.signUpText}>Je m&apos;inscris</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    width: 260,
    height: 110,
    marginBottom: 24,
  },
  title: {
    fontSize: 48,
    fontWeight: '700' as const,
    color: '#000',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    marginBottom: 32,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 20,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 32,
  },
  forgotPasswordText: {
    fontSize: 14,
    color: '#999',
  },
  loginButton: {
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#1B6B2A',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600' as const,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 32,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E0E0E0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 16,
    color: '#666',
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginBottom: 32,
  },
  socialButton: {
    width: 80,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#000',
  },
  socialIconPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialIconText: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
  signUpText: {
    fontSize: 14,
    color: '#E8611A',
    fontWeight: '600' as const,
  },
});
