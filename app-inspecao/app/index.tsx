import React, { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase-config';

export default function IndexScreen() {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/(tabs)/survey');
      } else {
        router.replace('/auth/login');
      }
    });

    return () => unsubscribe();
  }, [router]);

  return null;
}