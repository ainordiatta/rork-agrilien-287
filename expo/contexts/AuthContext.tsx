import createContextHook from '@nkzw/create-context-hook';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase, hasValidConfig } from '@/lib/supabase';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { UserRole, Country, User, AreaUnit, ProductionMode, ProductionSeason } from '@/types';
import { isSuperAdminEmail, verifySuperAdminPassword } from '@/constants/superAdmin';

export interface SignUpData {
  email: string;
  password: string;
  role: UserRole;
  country: Country;
  name: string;
  phone: string;
  city: string;
  firstName?: string;
  lastName?: string;
  photo?: string;
  shopPhoto?: string;
  specialties?: string[];
  shopInfo?: {
    name: string;
    specialties: string[];
    city: string;
    ownerFirstName?: string;
    ownerLastName?: string;
    region?: string;
    department?: string;
    farmArea?: number;
    areaUnit?: AreaUnit;
    productionMode?: ProductionMode;
    productionSeasons?: ProductionSeason[];
    isCooperativeMember?: boolean;
    cooperativeName?: string;
  };
  clientInfo?: {
    firstName: string;
    lastName: string;
    city: string;
  };
}

export interface LoginData {
  email: string;
  password: string;
}

function mapSupabaseUserToAppUser(
  supabaseUser: SupabaseUser,
  metadata?: Record<string, unknown>
): User {
  const meta = metadata || supabaseUser.user_metadata || {};
  return {
    id: supabaseUser.id,
    role: (meta.role as UserRole) || 'acheteur',
    isSuperAdmin: (meta.isSuperAdmin as boolean) || false,
    email: supabaseUser.email || '',
    phone: (meta.phone as string) || '',
    name: (meta.name as string) || '',
    firstName: (meta.firstName as string) || undefined,
    lastName: (meta.lastName as string) || undefined,
    city: (meta.city as string) || '',
    country: (meta.country as Country) || 'senegal',
    photo: (meta.photo as string) || undefined,
    shopPhoto: (meta.shopPhoto as string) || undefined,
    specialties: (meta.specialties as string[]) || undefined,
    shopInfo: meta.shopInfo as User['shopInfo'] || undefined,
    clientInfo: meta.clientInfo as User['clientInfo'] || undefined,
    createdAt: supabaseUser.created_at || new Date().toISOString(),
  };
}

export const [AuthProvider, useAuth] = createContextHook(() => {
  const [session, setSession] = useState<Session | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [appUser, setAppUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    console.log('[Auth] Initializing auth, hasValidConfig:', hasValidConfig);

    if (!hasValidConfig) {
      console.log('[Auth] No valid Supabase config, loading fallback from AsyncStorage');
      void loadFallbackUser();
      return;
    }

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      console.log('[Auth] Initial session:', currentSession ? 'found' : 'none');
      setSession(currentSession);
      if (currentSession?.user) {
        setSupabaseUser(currentSession.user);
        setAppUser(mapSupabaseUserToAppUser(currentSession.user));
      }
      setIsLoading(false);
      setIsInitialized(true);
    }).catch((error) => {
      console.error('[Auth] Error getting initial session:', error);
      void loadFallbackUser();
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        console.log('[Auth] Auth state changed:', _event);
        setSession(newSession);
        if (newSession?.user) {
          setSupabaseUser(newSession.user);
          setAppUser(mapSupabaseUserToAppUser(newSession.user));
        } else {
          setSupabaseUser(null);
          setAppUser(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadFallbackUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('@auth/fallback_user');
      if (storedUser) {
        const trimmed = storedUser.trim();
        if (trimmed && trimmed !== 'undefined' && trimmed !== 'null' && trimmed.startsWith('{')) {
          const parsed = JSON.parse(storedUser) as User;
          setAppUser(parsed);
          setSession({ user: { id: parsed.id } } as unknown as Session);
          console.log('[Auth] Loaded fallback user:', parsed.id);
        }
      }
    } catch (error) {
      console.error('[Auth] Error loading fallback user:', error);
    } finally {
      setIsLoading(false);
      setIsInitialized(true);
    }
  };

  const saveFallbackUser = async (user: User | null) => {
    try {
      if (user) {
        await AsyncStorage.setItem('@auth/fallback_user', JSON.stringify(user));
      } else {
        await AsyncStorage.removeItem('@auth/fallback_user');
      }
    } catch (error) {
      console.error('[Auth] Error saving fallback user:', error);
    }
  };

  const signUpMutation = useMutation({
    mutationFn: async (data: SignUpData) => {
      console.log('[Auth] Signing up:', data.email);

      const displayName = data.name;

      if (!hasValidConfig) {
        console.log('[Auth] Using fallback sign up (no Supabase)');
        const fallbackUser: User = {
          id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          role: data.role,
          isSuperAdmin: false,
          email: data.email,
          phone: data.phone,
          name: displayName,
          firstName: data.firstName,
          lastName: data.lastName,
          city: data.city,
          country: data.country,
          photo: data.photo,
          shopPhoto: data.shopPhoto,
          specialties: data.specialties,
          shopInfo: data.shopInfo as User['shopInfo'],
          clientInfo: data.clientInfo as User['clientInfo'],
          createdAt: new Date().toISOString(),
        };
        setAppUser(fallbackUser);
        setSession({ user: { id: fallbackUser.id } } as unknown as Session);
        await saveFallbackUser(fallbackUser);
        return { user: fallbackUser };
      }

      const metadata: Record<string, unknown> = {
        role: data.role,
        name: data.name,
        phone: data.phone,
        city: data.city,
        country: data.country,
        firstName: data.firstName,
        lastName: data.lastName,
        photo: data.photo,
        shopPhoto: data.shopPhoto,
        specialties: data.specialties,
        shopInfo: data.shopInfo,
        clientInfo: data.clientInfo,
      };

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        console.error('[Auth] Sign up error:', error.message);
        throw error;
      }

      if (!authData.user) {
        throw new Error('Inscription échouée. Veuillez réessayer.');
      }

      console.log('[Auth] Sign up successful:', authData.user.id);
      return authData;
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginData) => {
      console.log('[Auth] Logging in:', data.email);

      if (isSuperAdminEmail(data.email)) {
        console.log('[Auth] Super admin login attempt');
        if (!verifySuperAdminPassword(data.password)) {
          throw new Error('Email ou mot de passe incorrect');
        }
        const superAdminUser: User = {
          id: 'super-admin-001',
          role: 'admin',
          isSuperAdmin: true,
          email: data.email.trim().toLowerCase(),
          phone: '+221 77 000 0000',
          name: 'Super Admin',
          firstName: 'Super',
          lastName: 'Admin',
          city: 'Dakar',
          country: 'senegal',
          createdAt: new Date().toISOString(),
        };
        setAppUser(superAdminUser);
        setSession({ user: { id: superAdminUser.id } } as unknown as Session);
        await saveFallbackUser(superAdminUser);
        console.log('[Auth] Super admin login successful');
        return { user: superAdminUser };
      }

      if (!hasValidConfig) {
        console.log('[Auth] Using fallback login (no Supabase)');
        const storedUser = await AsyncStorage.getItem('@auth/fallback_user');
        if (storedUser) {
          try {
            const parsed = JSON.parse(storedUser) as User;
            if (parsed.email === data.email) {
              setAppUser(parsed);
              setSession({ user: { id: parsed.id } } as unknown as Session);
              return { user: parsed };
            }
          } catch {
            console.error('[Auth] Error parsing fallback user');
          }
        }
        throw new Error('Aucun compte trouvé avec cet email. Veuillez d\'abord créer un compte.');
      }

      const { data: authData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (error) {
        console.error('[Auth] Login error:', error.message);
        throw error;
      }

      console.log('[Auth] Login successful:', authData.user.id);
      return authData;
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log('[Auth] Logging out');

      if (!hasValidConfig) {
        setAppUser(null);
        setSession(null);
        setSupabaseUser(null);
        await saveFallbackUser(null);
        console.log('[Auth] Fallback logout successful');
        return;
      }

      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('[Auth] Logout error:', error.message);
        throw error;
      }
      console.log('[Auth] Logout successful');
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (updates: Partial<User>) => {
      console.log('[Auth] Updating profile');

      if (!hasValidConfig) {
        const updatedUser = { ...appUser, ...updates } as User;
        setAppUser(updatedUser);
        await saveFallbackUser(updatedUser);
        console.log('[Auth] Fallback profile updated');
        return { user: updatedUser };
      }

      const { data, error } = await supabase.auth.updateUser({
        data: updates,
      });

      if (error) {
        console.error('[Auth] Update profile error:', error.message);
        throw error;
      }

      if (data.user) {
        const updatedAppUser = mapSupabaseUserToAppUser(data.user);
        setAppUser(updatedAppUser);
      }

      console.log('[Auth] Profile updated');
      return data;
    },
  });

  const signUp = useCallback(async (data: SignUpData) => {
    return signUpMutation.mutateAsync(data);
  }, [signUpMutation]);

  const login = useCallback(async (data: LoginData) => {
    return loginMutation.mutateAsync(data);
  }, [loginMutation]);

  const logout = useCallback(async () => {
    return logoutMutation.mutateAsync();
  }, [logoutMutation]);

  const updateProfile = useCallback(async (updates: Partial<User>) => {
    return updateProfileMutation.mutateAsync(updates);
  }, [updateProfileMutation]);

  const isAuthenticated = !!session && !!appUser;

  return useMemo(() => ({
    session,
    supabaseUser,
    user: appUser,
    isLoading,
    isInitialized,
    isAuthenticated,
    signUp,
    login,
    logout,
    updateProfile,
    signUpLoading: signUpMutation.isPending,
    loginLoading: loginMutation.isPending,
    logoutLoading: logoutMutation.isPending,
    updateProfileLoading: updateProfileMutation.isPending,
    signUpError: signUpMutation.error,
    loginError: loginMutation.error,
  }), [
    session,
    supabaseUser,
    appUser,
    isLoading,
    isInitialized,
    isAuthenticated,
    signUp,
    login,
    logout,
    updateProfile,
    signUpMutation.isPending,
    loginMutation.isPending,
    logoutMutation.isPending,
    updateProfileMutation.isPending,
    signUpMutation.error,
    loginMutation.error,
  ]);
});
