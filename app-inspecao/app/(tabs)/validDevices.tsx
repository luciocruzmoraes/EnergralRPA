import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../../config/firebase-config';
import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'expo-router';

const KEY_PEND = 'equipamentosPendentes';

type EquipamentoPend = {
  nome: string;
  localizacao: string;
  status: string;
  criadoPor: string;
};

export default function ValidDevice() {
  const isAdmin = useAdmin();
  const router = useRouter();

  const [pendentes, setPendentes] = useState<EquipamentoPend[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAdmin === false) {
      Alert.alert('Acesso negado', 'Você não tem permissão para acessar esta página.');
      router.replace('/auth/login');
    }
  }, [isAdmin, router]);

  useEffect(() => {
    if (isAdmin) loadPendentes();
  }, [isAdmin]);

  const loadPendentes = async () => {
    setLoading(true);
    try {
      const pendStr = await AsyncStorage.getItem(KEY_PEND);
      if (pendStr) {
        setPendentes(JSON.parse(pendStr));
      } else {
        setPendentes([]);
      }
    } catch (e) {
      console.error('Erro ao carregar pendentes:', e);
    } finally {
      setLoading(false);
    }
  };

  const aprovar = async (index: number) => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Erro', 'Usuário não autenticado');
      return;
    }
    try {
      const equipamento = pendentes[index];
      await addDoc(collection(db, 'equipamentos'), {
        ...equipamento,
        criadoPor: equipamento.criadoPor,
        validadoPor: user.email,
      });

      const newPendentes = [...pendentes];
      newPendentes.splice(index, 1);
      await AsyncStorage.setItem(KEY_PEND, JSON.stringify(newPendentes));
      setPendentes(newPendentes);

      Alert.alert('Sucesso', 'Equipamento aprovado e salvo no banco.');
    } catch (e) {
      console.error('Erro ao aprovar:', e);
      Alert.alert('Erro', 'Não foi possível aprovar o equipamento.');
    }
  };

  const rejeitar = async (index: number) => {
    const newPendentes = [...pendentes];
    newPendentes.splice(index, 1);
    await AsyncStorage.setItem(KEY_PEND, JSON.stringify(newPendentes));
    setPendentes(newPendentes);
    Alert.alert('Rejeitado', 'Equipamento removido da lista de pendentes.');
  };

  if (isAdmin === null || loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007aff" />
        <Text style={styles.loadingText}>Carregando equipamentos pendentes...</Text>
      </View>
    );
  }

  if (isAdmin === false) return null;

  if (pendentes.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noPendentes}>Nenhum equipamento pendente para validação.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Equipamentos Pendentes de Validação</Text>
      {pendentes.map((equip, idx) => (
        <View key={idx} style={styles.card}>
          <Text style={styles.nome}>{equip.nome}</Text>
          <Text style={styles.info}>Localização: {equip.localizacao}</Text>
          <Text style={styles.info}>Status: {equip.status}</Text>
          <Text style={styles.info}>Criado por: {equip.criadoPor}</Text>

          <View style={styles.btnGroup}>
            <TouchableOpacity
              style={[styles.btn, styles.approveBtn]}
              onPress={() => aprovar(idx)}
            >
              <Text style={styles.btnText}>Aprovar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, styles.rejectBtn]}
              onPress={() => rejeitar(idx)}
            >
              <Text style={styles.btnText}>Rejeitar</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#000',
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    color: 'yellow',
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: Platform.OS === 'android' ? 'Roboto' : 'System',
  },
  noPendentes: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 30,
  },
  card: {
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  nome: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  info: {
    color: '#ccc',
    marginTop: 8,
    fontSize: 14,
  },
  btnGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  approveBtn: {
    backgroundColor: '#28a745',
  },
  rejectBtn: {
    backgroundColor: '#dc3545',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
