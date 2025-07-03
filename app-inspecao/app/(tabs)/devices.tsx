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
  Dimensions
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import NetInfo from '@react-native-community/netinfo';
import { auth, db } from '../../config/firebase-config';
import { useRouter } from 'expo-router';

const KEY_EQUIP = 'cache_equipamentos';
const KEY_PEND = 'equipamentosPendentes';

export default function Devices() {
  const router = useRouter();

  const [localizacoes, setLocalizacoes] = useState<string[]>([]);
  const [equipamentos, setEquipamentos] = useState<any[]>([]);
  const [equipamentosFiltrados, setEquipamentosFiltrados] = useState<any[]>([]);
  const [localizacaoSelecionada, setLocalizacaoSelecionada] = useState('');
  const [nomeNovoEquipamento, setNomeNovoEquipamento] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

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
      console.log('Pendentes sincronizados com sucesso!');
    } catch (e) {
      console.error('Erro ao sincronizar equipamentos pendentes:', e);
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
    } catch (e) {
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
    } catch (e) {
      const cacheEquip = await AsyncStorage.getItem(KEY_EQUIP);
      if (cacheEquip) equipamentosFS = JSON.parse(cacheEquip);
    }

    let pendentes: any[] = [];
    try {
      const pendStr = await AsyncStorage.getItem(KEY_PEND);
      if (pendStr) {
        pendentes = JSON.parse(pendStr).map((e: any) => ({ ...e, pendente: true }));
      }
    } catch (e) {}

    const todosEquipamentos = [...equipamentosFS, ...pendentes];
    setEquipamentos(todosEquipamentos);

    await syncEquipamentosPendentes();

    setLoading(false);
  };

  useEffect(() => {
    if (!localizacaoSelecionada) {
      setEquipamentosFiltrados([]);
      return;
    }
    const filtrados = equipamentos.filter(eq => eq.localizacao === localizacaoSelecionada);
    setEquipamentosFiltrados(filtrados);
  }, [localizacaoSelecionada, equipamentos]);

  const cadastrarEquipamento = async () => {
    const user = auth.currentUser;
    if (!user) return Alert.alert('Erro', 'Usuário não autenticado.');

    if (!nomeNovoEquipamento || !localizacaoSelecionada)
      return Alert.alert('Erro', 'Preencha todos os campos.');

    const novoEquipamento = {
      nome: nomeNovoEquipamento,
      localizacao: localizacaoSelecionada,
      criadoPor: user.email,
    };

    const online = (await NetInfo.fetch()).isConnected ?? false;

    try {
      const userDoc = await getDocs(collection(db, 'users'));
      const userData = userDoc.docs.find(d => d.id === user.uid)?.data();
      const isAdmin = userData?.role === 'admin';

      if (online && isAdmin) {
        await addDoc(collection(db, 'equipamentos'), {
          ...novoEquipamento,
          validadoPor: user.email,
        });
      } else {
        if (online) {
          await addDoc(collection(db, 'equipamentos_pendentes'), novoEquipamento);
        } else {
          const prev = JSON.parse(await AsyncStorage.getItem(KEY_PEND) || '[]');
          prev.push(novoEquipamento);
          await AsyncStorage.setItem(KEY_PEND, JSON.stringify(prev));
        }
      }
      setNomeNovoEquipamento('');
      Alert.alert('Sucesso', 'Equipamento cadastrado com sucesso!');
      loadData();
    } catch (e) {
      console.error('Erro ao cadastrar equipamento:', e);
      Alert.alert('Erro', 'Falha ao cadastrar equipamento.');
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
          <Text style={styles.title}>Equipamentos</Text>

          <Picker
            selectedValue={localizacaoSelecionada}
            onValueChange={setLocalizacaoSelecionada}
            style={styles.picker}
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
            style={styles.picker}
          />

          <TouchableOpacity style={styles.btn} onPress={cadastrarEquipamento}>
            <Text style={styles.btnTxt}>Cadastrar Equipamento</Text>
          </TouchableOpacity>

          {equipamentosFiltrados.length === 0 ? (
            <Text style={styles.emptyText}>Nenhum equipamento para esta localização.</Text>
          ) : (
            equipamentosFiltrados.map((eq, idx) => (
              <View key={idx} style={[styles.equipamentoCard, eq.pendente && styles.pendente]}>
                <Text style={styles.equipNome}>{eq.nome}</Text>
                <Text style={styles.equipStatus}>Status: {eq.status || '—'}</Text>
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
  container: { flex: 1, backgroundColor: '#000' },
  scroll: { padding: 20, alignItems: 'center', paddingBottom: 80 },
  card: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? CARD_MAX : '100%',
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'yellow',
    marginBottom: 20,
    textAlign: 'center',
  },
  picker: {
    backgroundColor: '#444',
    color: '#fff',
    height: 50,
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  btn: {
    backgroundColor: '#007aff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  btnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  emptyText: {
    color: '#ccc',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 30,
  },
  equipamentoCard: {
    backgroundColor: '#222',
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
  },
  pendente: {
    borderColor: '#f90',
    borderWidth: 2,
    backgroundColor: '#442a00',
  },
  equipNome: {
    fontWeight: 'bold',
    fontSize: 18,
    color: '#fff',
  },
  equipStatus: {
    color: '#aaa',
    marginTop: 4,
  },
  equipInfo: {
    color: '#ccc',
    marginTop: 4,
    fontSize: 12,
  },
  pendenteInfo: {
    marginTop: 6,
    fontSize: 12,
    color: '#f90',
    fontWeight: 'bold',
  },
});
