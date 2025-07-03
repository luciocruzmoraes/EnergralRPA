import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
  Dimensions,
  TextInput,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import NetInfo from '@react-native-community/netinfo';
import { auth, db } from '../../config/firebase-config';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { useRouter } from 'expo-router';

const checklistItems = [
  'Soluta adipisci odit aut.',
  'Asperiores perspiciatis numquam quibusdam atque.',
  'Veniam dolores magnam porro voluptate occaecat...',
  'At fuga aspernatur exercitationem odio fugit p...',
  'Dolor inventore facere debitis eligendi.',
];

const criterios = ['Sinal estável', 'Dentro dos parâmetros', 'Sem danos visíveis'];
const statusOptions = ['Inativos', 'Operacional', 'Com falha', 'Em manutenção'];

type Equip = {
  nome: string;
  localizacao: string;
  usuario?: string;    // usuário que criou
  validador?: string;  // quem validou (aprovou) - pode estar ausente ainda
};

const KEY_SUBS = 'cache_subestacoes';
const KEY_EQUIP = 'cache_equipamentos';
const KEY_PEND = 'cache_equipamentos_pendentes'; // Novo key para pendentes localmente
const KEY_PEND_INSPECAO = 'inspecoesPendentes';
const KEY_FORM = 'form_inspecao_cache';

export default function Inspecao() {
  const router = useRouter();

  const [localizacao, setLocalizacao] = useState('');
  const [equipamento, setEquipamento] = useState('');
  const [status, setStatus] = useState('');
  const [respostas, setRespostas] = useState(Array(checklistItems.length).fill(''));
  const [observacao, setObservacao] = useState('');

  const [subestacoes, setSubestacoes] = useState<string[]>([]);
  const [equipamentos, setEquipamentos] = useState<Equip[]>([]);
  const [pendentesLocais, setPendentesLocais] = useState<Equip[]>([]);
  const [equipamentosFiltrados, setFiltrados] = useState<string[]>([]);

  const [salvoComSucesso, setSalvoComSucesso] = useState(false);
  const [mensagemSucesso, setMensagemSucesso] = useState('');

  useEffect(() => {
    (async () => {
      const online = (await NetInfo.fetch()).isConnected ?? false;
      await Promise.all([loadSubestacoes(online), loadEquipamentos(online), loadEquipPendentesLocais()]);
      if (online) syncPendentes();
      await carregarFormLocal();
    })();
  }, []);

  useEffect(() => {
    setEquipamento('');
    // Juntar equipamentos aprovados e pendentes locais para dropdown
    const listaCompleta = [...equipamentos, ...pendentesLocais];

    const filtrados = listaCompleta
      .filter(eq => eq.localizacao === localizacao)
      .map(eq => eq.nome);

    setFiltrados(filtrados);
  }, [localizacao, equipamentos, pendentesLocais]);

  const loadSubestacoes = async (online: boolean) => {
    try {
      const cached = await AsyncStorage.getItem(KEY_SUBS);
      if (cached) setSubestacoes(JSON.parse(cached));
    } catch {}

    if (!online) return;

    try {
      const snap = await getDocs(collection(db, 'subestacoes'));
      const lista = snap.docs.map(d => d.data().nome || '').filter(Boolean);
      setSubestacoes(lista);
      await AsyncStorage.setItem(KEY_SUBS, JSON.stringify(lista));
    } catch (e) {
      console.error('Subestações FS:', e);
    }
  };

  const loadEquipamentos = async (online: boolean) => {
    try {
      const cached = await AsyncStorage.getItem(KEY_EQUIP);
      if (cached) setEquipamentos(JSON.parse(cached));
    } catch {}

    if (!online) return;

    try {
      const snap = await getDocs(collection(db, 'equipamentos'));
      const lista = snap.docs
        .map(d => {
          const dt = d.data();
          return {
            nome: dt.nome || '',
            localizacao: dt.localizacao || '',
            usuario: dt.usuario || '',
            validador: dt.validador || '',
          };
        })
        .filter(e => e.nome && e.localizacao);
      setEquipamentos(lista);
      await AsyncStorage.setItem(KEY_EQUIP, JSON.stringify(lista));
    } catch (e) {
      console.error('Equipamentos FS:', e);
    }
  };

  // Carregar pendentes locais de equipamentos (usuários comuns)
  const loadEquipPendentesLocais = async () => {
    try {
      const pendentes = await AsyncStorage.getItem(KEY_PEND);
      if (pendentes) {
        setPendentesLocais(JSON.parse(pendentes));
      } else {
        setPendentesLocais([]);
      }
    } catch (e) {
      console.error('Erro ao carregar equipamentos pendentes locais:', e);
    }
  };

  const syncPendentes = useCallback(async () => {
    try {
      const str = await AsyncStorage.getItem(KEY_PEND_INSPECAO);
      if (!str) return;
      const pend = JSON.parse(str);
      for (const item of pend) {
        await addDoc(collection(db, 'inspecoes'), item);
      }
      await AsyncStorage.removeItem(KEY_PEND_INSPECAO);
      Alert.alert('Sincronizado', 'Inspeções pendentes enviadas com sucesso!');
    } catch (e) {
      console.error('Sync:', e);
    }
  }, []);

  useEffect(() => {
    const dados = { localizacao, equipamento, status, respostas, observacao };
    AsyncStorage.setItem(KEY_FORM, JSON.stringify(dados)).catch(e => {
      console.error('Erro ao salvar form local:', e);
    });
  }, [localizacao, equipamento, status, respostas, observacao]);

  const carregarFormLocal = async () => {
    try {
      const json = await AsyncStorage.getItem(KEY_FORM);
      if (json) {
        const dados = JSON.parse(json);
        if (dados.localizacao) setLocalizacao(dados.localizacao);
        if (dados.equipamento) setEquipamento(dados.equipamento);
        if (dados.status) setStatus(dados.status);
        if (dados.respostas && Array.isArray(dados.respostas))
          setRespostas(dados.respostas);
        if (dados.observacao) setObservacao(dados.observacao);
      }
    } catch (e) {
      console.error('Erro ao carregar form local:', e);
    }
  };

  const salvar = async () => {
    const user = auth.currentUser;
    if (!user) {
      Alert.alert('Erro', 'Usuário não autenticado');
      return;
    }

    if (!localizacao || !equipamento || !status) {
      Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
      return;
    }

    if (respostas.some(r => !r)) {
      Alert.alert('Erro', 'Responda todos os itens do checklist');
      return;
    }

    const dados = {
      uid: user.uid,
      usuario: user.email,
      equipamento,
      localizacao,
      status,
      checklist: checklistItems.map((item, i) => ({ item, resposta: respostas[i] })),
      observacao,
      data: new Date().toISOString(),
    };

    const online = (await NetInfo.fetch()).isConnected ?? false;
    try {
      if (online) {
        await addDoc(collection(db, 'inspecoes'), dados);
        setMensagemSucesso('Inspeção registrada com sucesso!');
        await AsyncStorage.removeItem(KEY_FORM);
      } else {
        const prev = JSON.parse((await AsyncStorage.getItem(KEY_PEND_INSPECAO)) || '[]');
        prev.push(dados);
        await AsyncStorage.setItem(KEY_PEND_INSPECAO, JSON.stringify(prev));
        setMensagemSucesso('Inspeção salva localmente e será sincronizada.');
      }
      limpar();
      setSalvoComSucesso(true);
    } catch (e) {
      console.error('Erro ao salvar inspeção:', e);
      Alert.alert('Erro', 'Falha ao salvar inspeção');
    }
  };

  const limpar = () => {
    setLocalizacao('');
    setEquipamento('');
    setStatus('');
    setRespostas(Array(checklistItems.length).fill(''));
    setObservacao('');
  };

  const logout = async () => {
    try {
      await auth.signOut();
      router.replace('/');
    } catch {
      Alert.alert('Erro', 'Não foi possível sair.');
    }
  };

  if (salvoComSucesso) {
    return (
      <View style={[styles.container, styles.successContainer]}>
        <Text style={styles.successIcon}>✅</Text>
        <Text style={styles.successText}>{mensagemSucesso}</Text>
        <TouchableOpacity style={styles.btn} onPress={() => setSalvoComSucesso(false)}>
          <Text style={styles.btnTxt}>Nova Inspeção</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.card}>
          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutTxt}>Sair</Text>
          </TouchableOpacity>

          <Text style={styles.heading}>Formulário de Inspeção</Text>

          <View style={styles.field}>
            <Picker selectedValue={localizacao} onValueChange={setLocalizacao} style={styles.picker}>
              <Picker.Item label="Selecione a subestação..." value="" />
              {subestacoes.map((s, i) => <Picker.Item key={i} label={s} value={s} />)}
            </Picker>
          </View>

          <View style={styles.field}>
            <Picker
              enabled={!!localizacao}
              selectedValue={equipamento}
              onValueChange={setEquipamento}
              style={styles.picker}
            >
              <Picker.Item
                label={localizacao ? 'Selecione o equipamento...' : 'Escolha a subestação primeiro...'}
                value=""
              />
              {equipamentosFiltrados.map((e, i) => (
                <Picker.Item key={i} label={e} value={e} />
              ))}
            </Picker>
          </View>

          <View style={styles.field}>
            <Picker selectedValue={status} onValueChange={setStatus} style={styles.picker}>
              <Picker.Item label="Selecione o status..." value="" />
              {statusOptions.map((s, i) => (
                <Picker.Item key={i} label={s} value={s} />
              ))}
            </Picker>
          </View>

          {checklistItems.map((item, idx) => (
            <View key={idx} style={styles.field}>
              <Text style={styles.label}>{item}</Text>
              <Picker
                selectedValue={respostas[idx]}
                onValueChange={v => {
                  const arr = [...respostas];
                  arr[idx] = v;
                  setRespostas(arr);
                }}
                style={styles.picker}
              >
                <Picker.Item label="Selecione..." value="" />
                {criterios.map((c, i) => (
                  <Picker.Item key={i} label={c} value={c} />
                ))}
              </Picker>
            </View>
          ))}

          <View style={styles.field}>
            <Text style={styles.label}>Observação</Text>
            <TextInput
              style={[styles.picker, styles.textArea]}
              placeholder="Digite observações adicionais..."
              value={observacao}
              onChangeText={setObservacao}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor="#bbb"
            />
          </View>

          <TouchableOpacity style={styles.btn} onPress={salvar}>
            <Text style={styles.btnTxt}>SALVAR INSPEÇÃO</Text>
          </TouchableOpacity>
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
  logoutBtn: {
    alignSelf: 'flex-end',
    padding: 8,
    backgroundColor: '#555',
    borderRadius: 6,
    marginBottom: 10,
  },
  logoutTxt: { color: '#fff', fontWeight: 'bold' },
  heading: {
    fontSize: 24,
    color: 'yellow',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  field: { marginBottom: 15 },
  label: { color: '#fff', marginBottom: 6, fontSize: 14 },
  picker: {
    backgroundColor: '#444',
    color: '#fff',
    height: 50,
    borderRadius: 8,
  },
  textArea: {
    height: 100,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === 'ios' ? 12 : 8,
    backgroundColor: '#444',
    borderRadius: 8,
    color: '#fff',
  },
  btn: {
    backgroundColor: '#007aff',
    borderRadius: 8,
    padding: 15,
    marginTop: 20,
    alignItems: 'center',
  },
  btnTxt: { color: '#fff', fontWeight: 'bold', fontSize: 16 },

  // Sucesso
  successContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  successText: {
    color: '#0f0',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  successIcon: {
    fontSize: 64,
    color: '#0f0',
  },
});
