import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { db, auth } from '../../config/firebase-config';
import { Picker } from '@react-native-picker/picker';
import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import NetInfo from '@react-native-community/netinfo';

type EquipamentoPend = {
  nome: string;
  localizacao: string;
  status: string;
};

const PEND_KEY = 'equipamentosPendentes';
const LOCALIZACOES_KEY = 'localizacoes';

export default function CadastrarEquipamento() {
  const [nomeEquipamento, setNomeEquipamento] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [status, setStatus] = useState('');
  const [localizacoes, setLocalizacoes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = useAdmin();
  const router = useRouter();

  /* ================================
     REDIRECIONAMENTO E CARREGAMENTO
  ================================== */
  useEffect(() => {
    if (isAdmin === false) router.replace('/(tabs)/survey');
  }, [isAdmin, router]);

  useEffect(() => {
    if (isAdmin !== true) return;

    const loadLocais = async () => {
      const online = (await NetInfo.fetch()).isConnected;
      if (online) await fetchLocalizacoesFromFirebase();
      else await fetchLocalizacoesFromStorage();
    };
    loadLocais();
  }, [isAdmin]);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected) syncPendingEquipamentos();
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const bootSync = async () => {
      if ((await NetInfo.fetch()).isConnected) syncPendingEquipamentos();
    };
    bootSync();
  }, []);

  /* =============== FIREBASE / STORAGE =============== */
  const fetchLocalizacoesFromFirebase = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'subestacoes'));
      const locais = snapshot.docs.map(doc => doc.data().nome);
      setLocalizacoes(locais);
      await AsyncStorage.setItem(LOCALIZACOES_KEY, JSON.stringify(locais));
    } catch (e) {
      console.error('Firestore localizações:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchLocalizacoesFromStorage = async () => {
    try {
      const stored = await AsyncStorage.getItem(LOCALIZACOES_KEY);
      if (stored) setLocalizacoes(JSON.parse(stored));
    } catch (e) {
      console.error('AsyncStorage localizações:', e);
    } finally {
      setLoading(false);
    }
  };

  const savePendingEquipamento = async (equip: EquipamentoPend) => {
    const pendentes: EquipamentoPend[] = JSON.parse(
      (await AsyncStorage.getItem(PEND_KEY)) || '[]'
    );
    pendentes.push(equip);
    await AsyncStorage.setItem(PEND_KEY, JSON.stringify(pendentes));
  };

  const syncPendingEquipamentos = useCallback(async () => {
    try {
      const pendStr = await AsyncStorage.getItem(PEND_KEY);
      if (!pendStr) return;

      const pendentes: EquipamentoPend[] = JSON.parse(pendStr);
      if (!pendentes.length) return;

      for (const equip of pendentes) {
        await addDoc(collection(db, 'equipamentos'), equip);
      }

      await AsyncStorage.removeItem(PEND_KEY);
      Alert.alert('Sincronizado', 'Dados pendentes enviados com sucesso!');
    } catch (e) {
      console.error('Sync pendentes:', e);
    }
  }, []);

  /* =============== SUBMISSÃO DO FORM =============== */
  const handleRegisterEquipamento = async () => {
    if (!nomeEquipamento || !localizacao || !status) {
      Alert.alert('Atenção', 'Por favor, preencha todos os campos!');
      return;
    }

    const equipamento: EquipamentoPend = { nome: nomeEquipamento, localizacao, status };
    const online = (await NetInfo.fetch()).isConnected;

    if (online) {
      try {
        await addDoc(collection(db, 'equipamentos'), equipamento);
        Alert.alert('Sucesso', 'Equipamento registrado com sucesso!');
      } catch (e) {
        console.error('Firestore addDoc:', e);
        await savePendingEquipamento(equipamento);
        Alert.alert(
          'Offline',
          'Não foi possível enviar agora. O equipamento será sincronizado depois.'
        );
      }
    } else {
      await savePendingEquipamento(equipamento);
      Alert.alert(
        'Offline',
        'Sem conexão. Equipamento salvo localmente e será enviado quando reconectar.'
      );
    }

    setNomeEquipamento('');
    setLocalizacao('');
    setStatus('');
  };

  /* ===================== LOGOUT ===================== */
  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace('/'); // ajuste a rota conforme a sua navegação
    } catch (e) {
      Alert.alert('Erro ao sair', 'Não foi possível desconectar.');
      console.error(e);
    }
  };

  /* =============== RENDER =========================== */
  if (isAdmin === null) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }
  if (isAdmin === false) return <View />;

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        {/* Botão Sair DENTRO do card */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Cadastrar Equipamento</Text>

        <TextInput
          style={styles.input}
          placeholder="Nome do Equipamento"
          value={nomeEquipamento}
          onChangeText={setNomeEquipamento}
          placeholderTextColor="#aaa"
        />

        <Text style={styles.label}>Localização:</Text>
        {loading ? (
          <Text style={styles.loadingText}>Carregando localizações...</Text>
        ) : (
          <Picker
            selectedValue={localizacao}
            onValueChange={setLocalizacao}
            style={styles.picker}
          >
            <Picker.Item label="Selecione a Localização" value="" />
            {localizacoes.map((loc, idx) => (
              <Picker.Item key={idx} label={loc} value={loc} />
            ))}
          </Picker>
        )}

        <Text style={styles.label}>Status:</Text>
        <Picker
          selectedValue={status}
          onValueChange={setStatus}
          style={styles.picker}
        >
          <Picker.Item label="Selecione o Status" value="" />
          <Picker.Item label="Ativo" value="Ativo" />
          <Picker.Item label="Inativo" value="Inativo" />
          <Picker.Item label="Em Manutenção" value="Em Manutenção" />
        </Picker>

        <TouchableOpacity style={styles.button} onPress={handleRegisterEquipamento}>
          <Text style={styles.buttonText}>Registrar Equipamento</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

/* ===================== STYLES ===================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  form: {
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  /* botão dentro do card */
  logoutButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#555',
    borderRadius: 6,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  title: {
    color: 'yellow',
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'android' ? 'Roboto' : 'System',
    textAlign: 'center',
  },
  label: {
    color: 'white',
    fontSize: 16,
    marginBottom: 5,
    alignSelf: 'flex-start',
  },
  input: {
    width: '100%',
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    color: 'white',
    backgroundColor: '#444',
  },
  picker: {
    width: '100%',
    height: 50,
    backgroundColor: '#444',
    color: 'white',
    borderRadius: 8,
    marginBottom: 15,
    paddingHorizontal: 10,
  },
  button: {
    padding: 15,
    backgroundColor: '#007aff',
    borderRadius: 8,
    marginTop: 20,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});
