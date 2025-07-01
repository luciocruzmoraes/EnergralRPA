import React from 'react';
import { Stack } from 'expo-router';
import useSyncInspecoes from '../hooks/useSyncInspecoes';

export default function Layout() {
  useSyncInspecoes(); // Sincroniza automaticamente

  return <Stack screenOptions={{ headerShown: false }} />;
}
