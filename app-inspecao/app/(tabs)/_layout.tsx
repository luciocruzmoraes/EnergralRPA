import { Tabs, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Platform,
  Text,
  TouchableOpacity,
  View,
  StyleSheet,
} from 'react-native';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { auth } from '@/config/firebase-config';
import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
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
            tabBarIcon: ({ color }) => (
              <IconSymbol name="checkmark.circle" size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="register"
          options={{
            title: 'Cadastro de Usuário',
            tabBarIcon: ({ color }) => (
              <IconSymbol name="person.circle" size={28} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="plataforms"
          options={{
            title: 'Plataformas',
            tabBarIcon: ({ color }) => (
              <IconSymbol name="building" size={28} color={color} />
            ),
          }}
        />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  logoutContainer: {
    position: 'absolute',
    top: 40,
    right: 10,
    paddingBottom: 10,
    alignItems: 'center',
    backgroundColor: '#007aff',
    zIndex: 10,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
