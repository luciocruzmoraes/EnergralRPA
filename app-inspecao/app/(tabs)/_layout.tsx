// app/(tabs)/_layout.tsx
import { Tabs, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Platform, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/config/firebase-config';
import { useAdmin } from '@/hooks/useAdmin';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isAdmin = useAdmin(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      if (!user) router.replace('/auth/login');
      setIsLoading(false);
    });
    return unsubscribe;
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/auth/login');
    } catch (error) {
      console.error('Erro ao sair:', error);
    }
  };

  if (isLoading || isAdmin === null) {
    return (
      <View style={styles.center}>
        <Text>Carregando...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return (
      <View style={styles.center}>
        <Text>Redirecionando...</Text>
      </View>
    );
  }

  return (
    <>
      <View style={styles.logoutContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({ ios: { position: 'absolute' }, default: {} }),
        }}
      >
        <Tabs.Screen
          name="survey"
          options={{
            title: 'Survey',
            tabBarIcon: ({ color }) => <IconSymbol name="checkmark.circle" size={28} color={color} />,
          }}
        />
        {isAdmin && (
          <>
            <Tabs.Screen
              name="devices"
              options={{
                title: 'Devices',
                tabBarIcon: ({ color }) => <IconSymbol name="iphone" size={28} color={color} />,
              }}
            />
            <Tabs.Screen
              name="register"
              options={{
                title: 'Register User',
                tabBarIcon: ({ color }) => <IconSymbol name="person.circle" size={28} color={color} />,
              }}
            />
            <Tabs.Screen
              name="plataforms"
              options={{
                title: 'Plataformas',
                tabBarIcon: ({ color }) => <IconSymbol name="building" size={28} color={color} />,
              }}
            />
          </>
        )}
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  logoutContainer: {
    paddingTop: 40,
    paddingBottom: 10,
    alignItems: 'center',
    backgroundColor: '#007aff',
  },
  logoutButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: '#fff',
    borderRadius: 20,
  },
  logoutText: {
    color: '#007aff',
    fontWeight: 'bold',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
