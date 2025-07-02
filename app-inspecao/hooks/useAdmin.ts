import { useState, useEffect } from 'react';
import { auth, db } from '@/config/firebase-config'; // Importar auth e db do seu Firebase
import { doc, getDoc } from 'firebase/firestore';
import { Alert } from 'react-native';

export function useAdmin(navigateIfNotAdmin = true) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    const checkUserRole = async () => {
      const user = auth.currentUser;

      if (!user) {
        setIsAdmin(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));

        if (userDoc.exists()) {
          const userData = userDoc.data();
          if (userData?.role === 'admin') {
            setIsAdmin(true);
          } else {
            if (navigateIfNotAdmin) {
              Alert.alert('Acesso negado', 'Você precisa ser administrador para acessar esta página.');
            }
            setIsAdmin(false);
          }
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        console.error('Erro ao verificar o role do usuário:', error);
        setIsAdmin(false);
      }
    };

    checkUserRole();
  }, []);

  return isAdmin;
}
