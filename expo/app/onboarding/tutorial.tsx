import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useState, useRef, useCallback } from 'react';
import { ShoppingCart, Truck, MessageCircle, BarChart3, ChevronRight, ArrowRight } from 'lucide-react-native';
import Colors from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  icon: typeof ShoppingCart;
  color: string;
  bgColor: string;
  image: string;
}

const STEPS: TutorialStep[] = [
  {
    id: 'discover',
    title: 'Découvrez les produits',
    description: 'Parcourez des centaines de produits agricoles locaux : céréales, fruits, légumes, bétail et plus encore.',
    icon: ShoppingCart,
    color: Colors.primary,
    bgColor: '#E8F5E9',
    image: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=600',
  },
  {
    id: 'delivery',
    title: 'Livraison partout',
    description: 'Commandez et faites-vous livrer dans toutes les régions du Sénégal et du Mali. Points de collecte disponibles.',
    icon: Truck,
    color: '#2196F3',
    bgColor: '#E3F2FD',
    image: 'https://images.unsplash.com/photo-1592921870789-04563d55041c?w=600',
  },
  {
    id: 'negotiate',
    title: 'Négociez directement',
    description: 'Discutez directement avec les producteurs, négociez les prix et passez vos commandes en toute confiance.',
    icon: MessageCircle,
    color: '#FF9800',
    bgColor: '#FFF3E0',
    image: 'https://images.unsplash.com/photo-1560493676-04071c5f467b?w=600',
  },
  {
    id: 'manage',
    title: 'Gérez votre exploitation',
    description: 'Si vous êtes producteur, gérez votre stock, suivez vos ventes et publiez des stories pour promouvoir vos produits.',
    icon: BarChart3,
    color: '#9C27B0',
    bgColor: '#F3E5F5',
    image: 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=600',
  },
];

export default function TutorialScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const animateTransition = useCallback((nextStep: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    setTimeout(() => setCurrentStep(nextStep), 150);
  }, [fadeAnim]);

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      animateTransition(currentStep + 1);
    } else {
      router.replace('/onboarding/country');
    }
  }, [currentStep, animateTransition, router]);

  const handleSkip = useCallback(() => {
    router.replace('/onboarding/country');
  }, [router]);

  const step = STEPS[currentStep];
  const IconComponent = step.icon;
  const isLast = currentStep === STEPS.length - 1;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip} activeOpacity={0.7}>
        <Text style={styles.skipText}>Passer</Text>
      </TouchableOpacity>

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: step.image }} style={styles.stepImage} />
          <View style={styles.imageOverlay} />
          <View style={[styles.iconCircle, { backgroundColor: step.bgColor }]}>
            <IconComponent size={36} color={step.color} />
          </View>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.stepNumber}>
            {currentStep + 1}/{STEPS.length}
          </Text>
          <Text style={styles.title}>{step.title}</Text>
          <Text style={styles.description}>{step.description}</Text>
        </View>
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {STEPS.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                index === currentStep && styles.dotActive,
                index < currentStep && styles.dotCompleted,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.nextButton, isLast && styles.nextButtonLast]}
          onPress={handleNext}
          activeOpacity={0.8}
        >
          {isLast ? (
            <>
              <Text style={styles.nextButtonText}>Commencer</Text>
              <ArrowRight size={20} color={Colors.surface} />
            </>
          ) : (
            <>
              <Text style={styles.nextButtonText}>Suivant</Text>
              <ChevronRight size={20} color={Colors.surface} />
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  skipButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 10,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: Colors.textSecondary,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  imageContainer: {
    height: SCREEN_WIDTH * 0.7,
    marginHorizontal: 24,
    borderRadius: 28,
    overflow: 'hidden',
    marginBottom: 32,
    position: 'relative',
  },
  stepImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  iconCircle: {
    position: 'absolute',
    bottom: -1,
    right: 20,
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: Colors.surface,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  textContainer: {
    paddingHorizontal: 32,
    gap: 12,
  },
  stepNumber: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: Colors.primary,
    textTransform: 'uppercase' as const,
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '800' as const,
    color: Colors.text,
    lineHeight: 34,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 48,
    gap: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 28,
    backgroundColor: Colors.primary,
  },
  dotCompleted: {
    backgroundColor: Colors.primary + '50',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 18,
    borderRadius: 16,
  },
  nextButtonLast: {
    backgroundColor: Colors.secondary,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '700' as const,
    color: Colors.surface,
  },
});
