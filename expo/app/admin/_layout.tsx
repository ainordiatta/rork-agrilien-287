import { Tabs, useRouter } from 'expo-router';
import { Package, ListChecks, History, Users, BarChart3, FolderTree, UserCircle, UsersRound, LayoutDashboard } from 'lucide-react-native';
import React from 'react';
import { TouchableOpacity } from 'react-native';
import Colors from '@/constants/colors';

export default function AdminLayout() {
  const router = useRouter();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        headerShown: true,
        headerStyle: {
          backgroundColor: Colors.surface,
        },
        headerTintColor: Colors.text,
        headerRight: () => (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/profile')}
            style={{ marginRight: 16 }}
            activeOpacity={0.8}
          >
            <UserCircle color={Colors.primary} size={24} />
          </TouchableOpacity>
        ),
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600' as const,
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Tableau de bord',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inventaire',
          tabBarIcon: ({ color, size }) => <Package color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="stock"
        options={{
          title: 'Stock',
          tabBarIcon: ({ color, size }) => <ListChecks color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="categories"
        options={{
          title: 'Catégories',
          tabBarIcon: ({ color, size }) => <FolderTree color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          tabBarIcon: ({ color, size }) => <History color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="suppliers"
        options={{
          title: 'Fournisseurs',
          tabBarIcon: ({ color, size }) => <Users color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="reports"
        options={{
          title: 'Rapports',
          tabBarIcon: ({ color, size }) => <BarChart3 color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="accounts"
        options={{
          title: 'Comptes',
          tabBarIcon: ({ color, size }) => <UsersRound color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          href: null,
          headerShown: false,
          title: 'Statistiques',
        }}
      />
      <Tabs.Screen
        name="add-product"
        options={{
          href: null,
          headerShown: true,
          title: 'Ajouter un produit',
        }}
      />
      <Tabs.Screen
        name="edit-product/[id]"
        options={{
          href: null,
          headerShown: true,
          title: 'Modifier le produit',
        }}
      />
    </Tabs>
  );
}
