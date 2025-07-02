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

export default function TabsLayout() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isAdmin = useAdmin(); // Hook para verificar se o usuário é administrador

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      if (!user) router.replace('/auth/login'); // Redireciona para o login caso o usuário não esteja autenticado
      setIsLoading(false);
    });
    return unsubscribe;
  }, [router]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/auth/login'); // Redireciona para o login após o logout
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
        {/* Renderiza as abas de admin apenas se o usuário for admin */}
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
    position: 'absolute',  // Define a posição do botão de logout
    top: 40,               // Distância do topo
    right: 10,             // Distância da borda direita
    paddingBottom: 10,
    alignItems: 'center',
    backgroundColor: '#007aff',
  },
  logoutButton: {
    paddingHorizontal: 10,  // Diminuímos o padding horizontal
    paddingVertical: 4,     // Diminuímos o padding vertical
    backgroundColor: '#fff',
    borderRadius: 20,
  },
  logoutText: {
    color: '#007aff',
    fontWeight: 'bold',
    fontSize: 12,  // Diminuímos ainda mais o tamanho da fonte
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
