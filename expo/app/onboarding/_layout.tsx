import { Stack } from 'expo-router';
import Colors from '@/constants/colors';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ 
      headerShown: true,
      headerBackTitle: 'Retour',
      headerStyle: {
        backgroundColor: Colors.surface,
      },
      headerTintColor: Colors.primary,
      headerShadowVisible: false,
    }}>
      <Stack.Screen 
        name="tutorial" 
        options={{ 
          headerShown: false,
          title: 'Tutoriel' 
        }} 
      />
      <Stack.Screen 
        name="country" 
        options={{ 
          headerShown: false,
          title: 'Sélection du pays' 
        }} 
      />
      <Stack.Screen 
        name="role" 
        options={{ 
          title: 'Choix du profil',
          headerBackVisible: true,
        }} 
      />
      <Stack.Screen 
        name="register" 
        options={{ 
          title: 'Inscription',
          headerBackVisible: true,
        }} 
      />
    </Stack>
  );
}
