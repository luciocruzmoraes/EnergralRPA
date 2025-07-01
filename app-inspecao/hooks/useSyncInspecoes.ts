import { useEffect } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth, db } from '../config/firebase-config';
import { addDoc, collection } from 'firebase/firestore';

export default function useSyncInspecoes() {
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      if (state.isConnected && auth.currentUser) {
        try {
          const data = await AsyncStorage.getItem('inspecoes');
          const inspecoes = data ? JSON.parse(data) : [];

          if (inspecoes.length > 0) {
            for (const inspecao of inspecoes) {
              await addDoc(collection(db, 'inspecoes'), inspecao);
            }
            await AsyncStorage.removeItem('inspecoes');
            console.log('✅ Inspeções sincronizadas com sucesso');
          }
        } catch (err) {
          console.log('Erro ao sincronizar inspeções:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);
}
