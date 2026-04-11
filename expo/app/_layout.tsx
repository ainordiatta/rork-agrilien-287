import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { InventoryProvider } from "@/contexts/InventoryContext";
import { MessagesProvider } from "@/contexts/MessagesContext";
import { StoriesProvider } from "@/contexts/StoriesContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { ReviewsProvider } from "@/contexts/ReviewsContext";
import { NegotiationsProvider } from "@/contexts/NegotiationsContext";
import { InvoicesProvider } from "@/contexts/InvoicesContext";
import { NotificationsProvider } from "@/contexts/NotificationsContext";
import { OrdersProvider } from "@/contexts/OrdersContext";
import { OfflineProvider } from "@/contexts/OfflineContext";
import { trpc, trpcClient } from "@/lib/trpc";
import { ErrorBoundary } from "@/components/ErrorBoundary";

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  const { isOnboarded, isLoading, user } = useApp();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inOnboarding = segments[0] === 'onboarding';
    const inLogin = segments[0] === 'login';

    if (!isOnboarded && !inOnboarding && !inLogin) {
      router.replace('/login');
    } else if (isOnboarded && (inOnboarding || inLogin)) {
      if (user) {
        router.replace('/(tabs)');
      } else {
        router.replace('/login');
      }
    }
  }, [isOnboarded, isLoading, segments, router, user]);

  useEffect(() => {
    if (!isLoading) {
      void SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return (
    <Stack screenOptions={{ headerBackTitle: "Retour" }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="product/[id]" options={{ title: "Produit", headerShown: true }} />
      <Stack.Screen name="shop/[id]" options={{ title: "Boutique", headerShown: true }} />
      <Stack.Screen name="chat/[id]" options={{ title: "Discussion", headerShown: true }} />
      <Stack.Screen name="messages" options={{ headerShown: false }} />
      <Stack.Screen name="admin" options={{ headerShown: false }} />
      <Stack.Screen 
        name="complete-profile" 
        options={{ 
          title: "Compléter votre profil", 
          headerShown: true,
          presentation: "modal"
        }} 
      />
      <Stack.Screen name="stories/add" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="stories/viewer" options={{ headerShown: false, presentation: "fullScreenModal" }} />
      <Stack.Screen name="collection-points" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ title: "Notifications", headerShown: true }} />
      <Stack.Screen name="orders/index" options={{ title: "Mes commandes", headerShown: true }} />
      <Stack.Screen name="orders/[id]" options={{ title: "Commande", headerShown: true }} />
      <Stack.Screen name="privacy-policy" options={{ title: "Politique de confidentialité", headerShown: true }} />
      <Stack.Screen name="terms" options={{ title: "Conditions d'utilisation", headerShown: true }} />
      <Stack.Screen name="+not-found" options={{ title: "Page introuvable" }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <AuthProvider>
            <AppProvider>
              <FavoritesProvider>
              <ReviewsProvider>
                <NegotiationsProvider>
                  <InvoicesProvider>
                    <MessagesProvider>
                      <InventoryProvider>
                        <StoriesProvider>
                          <NotificationsProvider>
                            <OrdersProvider>
                              <OfflineProvider>
                                <ErrorBoundary>
                                  <RootLayoutNav />
                                </ErrorBoundary>
                              </OfflineProvider>
                            </OrdersProvider>
                          </NotificationsProvider>
                        </StoriesProvider>
                      </InventoryProvider>
                    </MessagesProvider>
                  </InvoicesProvider>
                </NegotiationsProvider>
              </ReviewsProvider>
              </FavoritesProvider>
            </AppProvider>
          </AuthProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}
