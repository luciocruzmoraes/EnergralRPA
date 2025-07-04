import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, addDoc, getDoc, doc } from 'firebase/firestore';
import NetInfo from '@react-native-community/netinfo';
import { auth, db } from '../../config/firebase-config';
import { useRouter } from 'expo-router';

const KEY_EQUIP = 'cache_equipamentos';
const KEY_PEND = 'equipamentosPendentes';

const STATUS_OPTIONS = [
  { label: 'Selecione o Status', value: '' },
  { label: 'Em Manutenção', value: 'manutencao' },
  { label: 'Operacional', value: 'ativo' },
  { label: 'Inativo', value: 'inativo' },
  { label: 'Desativado', value: 'desativado' },
  { label: 'Com Falha', value: 'com-falha' },
  { label: 'Falha Crítica', value: 'falha-critica' },
];

export default function Devices() {
  const router = useRouter();

  const [localizacoes, setLocalizacoes] = useState<string[]>([]);
  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [equipamentosFiltrados, setEquipamentosFiltrados] = useState<any[]>([]);
  const [localizacaoSelecionada, setLocalizacaoSelecionada] = useState('');
  const [nomeNovoEquipamento, setNomeNovoEquipamento] = useState('');
  const [statusNovoEquipamento, setStatusNovoEquipamento] = useState('pendente');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        Alert.alert('Erro', 'Sessão expirada. Faça login novamente.');
        router.replace('/');
      } else {
        await loadData();
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!localizacaoSelecionada) {
      setEquipamentosFiltrados([]);
      return;
    }
    const filtrados = equipamentos.filter(eq => eq.localizacao === localizacaoSelecionada);
    setEquipamentosFiltrados(filtrados);
  }, [localizacaoSelecionada, equipamentos]);

  const logout = async () => {
    try {
      await auth.signOut();
      router.replace('/');
    } catch {
      Alert.alert('Erro', 'Não foi possível sair.');
    }
  };

  const syncEquipamentosPendentes = async () => {
    const online = (await NetInfo.fetch()).isConnected ?? false;
    if (!online) return;

    try {
      const pendentesStr = await AsyncStorage.getItem(KEY_PEND);
      if (!pendentesStr) return;

      const pendentes = JSON.parse(pendentesStr);
      for (const equipamento of pendentes) {
        await addDoc(collection(db, 'equipamentos_pendentes'), equipamento);
      }

      await AsyncStorage.removeItem(KEY_PEND);
    } catch (e: any) {
      console.error('Erro ao sincronizar equipamentos pendentes:', e.message || e);
    }
  };

  const loadData = async () => {
    setLoading(true);
    const online = (await NetInfo.fetch()).isConnected ?? false;

    try {
      const snapshot = await getDocs(collection(db, 'subestacoes'));
      const locais = snapshot.docs.map(doc => doc.data().nome).filter(Boolean);
      setLocalizacoes(locais);
      await AsyncStorage.setItem('cache_subestacoes', JSON.stringify(locais));
    } catch {
      const cacheLocais = await AsyncStorage.getItem('cache_subestacoes');
      if (cacheLocais) setLocalizacoes(JSON.parse(cacheLocais));
    }

    let equipamentosFS: any[] = [];
    try {
      const snap = await getDocs(collection(db, 'equipamentos'));
      equipamentosFS = snap.docs.map(d => {
        const data = d.data();
        return {
          nome: data.nome,
          localizacao: data.localizacao,
          status: data.status || '',
          criadoPor: data.criadoPor || '',
          validadoPor: data.validadoPor || '',
          pendente: false,
        };
      }).filter(eq => eq.nome && eq.localizacao);
      await AsyncStorage.setItem(KEY_EQUIP, JSON.stringify(equipamentosFS));
    } catch {
      const cacheEquip = await AsyncStorage.getItem(KEY_EQUIP);
      if (cacheEquip) equipamentosFS = JSON.parse(cacheEquip);
    }

    let pendentes: any[] = [];
    try {
      const pendStr = await AsyncStorage.getItem(KEY_PEND);
      if (pendStr) {
        pendentes = JSON.parse(pendStr).map((e: any) => ({ ...e, pendente: true }));
      }
    } catch {}

    const todosEquipamentos = [...equipamentosFS, ...pendentes];
    setEquipamentos(todosEquipamentos);
    await syncEquipamentosPendentes();
    setLoading(false);
  };

  const cadastrarEquipamento = async () => {
    const user = auth.currentUser;

    if (!user) {
      Alert.alert('Erro', 'Sessão não carregada. Reabra o app ou faça login novamente.');
      return;
    }

    if (!nomeNovoEquipamento || !localizacaoSelecionada || !statusNovoEquipamento) {
      Alert.alert('Erro', 'Preencha todos os campos.');
      return;
    }

    const novoEquipamentoBase = {
      nome: nomeNovoEquipamento,
      localizacao: localizacaoSelecionada,
      criadoPor: user.email,
      status: statusNovoEquipamento,
      timestamp: new Date().toISOString(),
    };

    const online = (await NetInfo.fetch()).isConnected ?? false;

    try {
      let isAdmin = false;

      if (online) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          const userData = userDocSnap.exists() ? userDocSnap.data() : null;
          isAdmin = userData?.role === 'admin';
        } catch {
          isAdmin = false;
        }
      }

      if (online) {
        if (isAdmin) {
          await addDoc(collection(db, 'equipamentos'), {
            ...novoEquipamentoBase,
            validadoPor: user.email,
            status: 'validado',
          });
        } else {
          await addDoc(collection(db, 'equipamentos_pendentes'), {
            ...novoEquipamentoBase,
            status: 'pendente',
          });
        }
      } else {
        const pendentes = JSON.parse(await AsyncStorage.getItem(KEY_PEND) || '[]');
        pendentes.push({
          ...novoEquipamentoBase,
          status: 'pendente',
        });
        await AsyncStorage.setItem(KEY_PEND, JSON.stringify(pendentes));
      }

      setNomeNovoEquipamento('');
      setStatusNovoEquipamento('pendente');
      Alert.alert('Sucesso', 'Equipamento cadastrado com sucesso!');
      loadData();
    } catch (e: any) {
      console.error('Erro ao cadastrar equipamento:', e.message || e);
      Alert.alert('Erro', `Falha ao cadastrar equipamento: ${e.message || 'Erro desconhecido'}`);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007aff" />
        <Text style={{ color: 'white', marginTop: 10 }}>Carregando dados...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.title}>Gerenciamento de Equipamentos</Text>
            <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
              <Text style={styles.logoutTxt}>Sair</Text>
            </TouchableOpacity>
          </View>

          <Picker
            selectedValue={localizacaoSelecionada}
            onValueChange={setLocalizacaoSelecionada}
            style={styles.picker}
            itemStyle={Platform.OS === 'ios' ? styles.pickerItem : {}}
          >
            <Picker.Item label="Selecione a Localização" value="" />
            {localizacoes.map((loc, i) => (
              <Picker.Item key={i} label={loc} value={loc} />
            ))}
          </Picker>

          <TextInput
            value={nomeNovoEquipamento}
            onChangeText={setNomeNovoEquipamento}
            placeholder="Nome do novo equipamento"
            placeholderTextColor="#bbb"
            style={styles.textInput}
          />

          <Picker
            selectedValue={statusNovoEquipamento}
            onValueChange={setStatusNovoEquipamento}
            style={styles.picker}
            itemStyle={Platform.OS === 'ios' ? styles.pickerItem : {}}
          >
            {STATUS_OPTIONS.map((status) => (
              <Picker.Item key={status.value} label={status.label} value={status.value} />
            ))}
          </Picker>

          <TouchableOpacity style={styles.btn} onPress={cadastrarEquipamento}>
            <Text style={styles.btnTxt}>Cadastrar Equipamento</Text>
          </TouchableOpacity>

          <Text style={styles.subtitle}>Equipamentos na Localização Selecionada</Text>

          {equipamentosFiltrados.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum equipamento para esta localização.</Text>
          ) : (
            equipamentosFiltrados.map((eq, idx) => (
              <View key={idx} style={[styles.equipamentoCard, eq.pendente && styles.pendente]}>
                <Text style={styles.equipNome}>{eq.nome}</Text>
                <Text style={styles.equipStatus}>Status: {eq.status || 'Não definido'}</Text>
                <Text style={styles.equipInfo}>Criado por: {eq.criadoPor || 'Desconhecido'}</Text>
                {eq.validadoPor ? (
                  <Text style={styles.equipInfo}>Validado por: {eq.validadoPor}</Text>
                ) : eq.pendente ? (
                  <Text style={styles.pendenteInfo}>Pendente de validação</Text>
                ) : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const { width } = Dimensions.get('window');
const CARD_MAX = 480;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#1a1a1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  scroll: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 80,
  },
  card: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? CARD_MAX : '100%',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 25,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFD700',
    flex: 1,  // Adicionando flex para centralizar
    textAlign: 'center',  // Centraliza o título
  },
  logoutBtn: {
    backgroundColor: '#555',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  logoutTxt: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ADD8E6',
    marginTop: 20,
    marginBottom: 15,
    textAlign: 'center',
  },
  picker: {
    backgroundColor: '#3a3a3a',
    color: '#fff',
    height: 50,
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#555',
  },
  pickerItem: {
    color: '#fff',
  },
  textInput: {
    backgroundColor: '#3a3a3a',
    color: '#fff',
    height: 50,
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#555',
  },
  btn: {
    backgroundColor: '#1E90FF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  btnTxt: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    textTransform: 'uppercase',
  },
  emptyText: {
    color: '#bbb',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 30,
    fontStyle: 'italic',
  },
  equipamentoCard: {
    backgroundColor: '#333',
    padding: 18,
    borderRadius: 10,
    marginBottom: 15,
    borderLeftWidth: 5,
    borderLeftColor: '#1E90FF',
    elevation: 4,
  },
  pendente: {
    borderLeftColor: '#FFD700',
    backgroundColor: '#4a3a00',
  },
  equipNome: {
    fontWeight: 'bold',
    fontSize: 20,
    color: '#fff',
    marginBottom: 5,
  },
  equipStatus: {
    color: '#ccc',
    marginTop: 4,
    fontSize: 15,
  },
  equipInfo: {
    color: '#aaa',
    marginTop: 6,
    fontSize: 13,
    fontStyle: 'italic',
  },
  pendenteInfo: {
    marginTop: 8,
    fontSize: 14,
    color: '#FFD700',
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
});
