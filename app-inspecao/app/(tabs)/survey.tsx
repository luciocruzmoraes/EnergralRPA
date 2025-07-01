import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { auth, db } from '../../config/firebase-config';
import { collection, addDoc, getDocs } from 'firebase/firestore';

const checklistItems = [
  'Soluta adipisci odit aut.',
  'Asperiores perspiciatis numquam quibusdam atque.',
  'Veniam dolores magnam porro voluptate occaecat...',
  'At fuga aspernatur exercitationem odio fugit p...',
  'Dolor inventore facere debitis eligendi.',
];

const criterios = [
  'Sinal estável',
  'Dentro dos parâmetros',
  'Sem danos visíveis',
];

const statusOptions = [
  'Inativos',
  'Operacional',
  'Com falha',
  'Em manutenção',
];

export default function Inspecao() {
  const [equipamento, setEquipamento] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [status, setStatus] = useState('');
  const [respostas, setRespostas] = useState(Array(5).fill(''));

  const [equipamentosLista, setEquipamentosLista] = useState<string[]>([]);
  const [subestacoesLista, setSubestacoesLista] = useState<string[]>([]);

  // Carregar equipamentos com getDocs
  const carregarEquipamentos = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'equipamentos'));
      const lista: string[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return data.nome || ''; 
      }).filter(nome => nome !== '');
      setEquipamentosLista(lista);
    } catch (error) {
      console.error('Erro ao carregar equipamentos:', error);
      Alert.alert('Erro', 'Falha ao carregar equipamentos');
    }
  };

  const carregarSubestacoes = async () => {
    try {
      const snapshot = await getDocs(collection(db, 'subestacoes'));
      const lista: string[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return data.nome || '';
      }).filter(nome => nome !== '');
      setSubestacoesLista(lista);
    } catch (error) {
      console.error('Erro ao carregar subestações:', error);
      Alert.alert('Erro', 'Falha ao carregar subestações');
    }
  };

  useEffect(() => {
    carregarEquipamentos();
    carregarSubestacoes();
  }, []);

  const salvarInspecao = async () => {
    const user = auth.currentUser;
    if (!user) return Alert.alert('Erro', 'Usuário não autenticado');

    if (!equipamento || !localizacao || !status) {
      return Alert.alert('Erro', 'Preencha todos os campos obrigatórios');
    }

    if (respostas.some((r) => r === '')) {
      return Alert.alert('Erro', 'Responda todos os itens do checklist');
    }

    const inspecao = {
      usuario: user.email,
      uid: user.uid,
      equipamento,
      localizacao,
      status,
      checklist: checklistItems.map((item, i) => ({
        item,
        resposta: respostas[i],
      })),
      data: new Date().toISOString(),
    };

    try {
      const antigas = await AsyncStorage.getItem('inspecoes');
      const lista = antigas ? JSON.parse(antigas) : [];
      lista.push(inspecao);
      await AsyncStorage.setItem('inspecoes', JSON.stringify(lista));
      await addDoc(collection(db, 'inspecoes'), inspecao);

      Alert.alert('Sucesso', 'Inspeção salva localmente e no Firebase!');
      limparFormulario();
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Falha ao salvar a inspeção');
    }
  };

  const limparFormulario = () => {
    setEquipamento('');
    setLocalizacao('');
    setStatus('');
    setRespostas(Array(5).fill(''));
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Formulário de Inspeção</Text>

      <View style={styles.dropdownContainer}>
        <Picker
          selectedValue={equipamento}
          onValueChange={setEquipamento}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          <Picker.Item label="Selecione o equipamento..." value="" />
          {equipamentosLista.length === 0 && (
            <Picker.Item label="Carregando..." value="" enabled={false} />
          )}
          {equipamentosLista.map((eq, i) => (
            <Picker.Item key={i} label={eq} value={eq} />
          ))}
        </Picker>
      </View>

      <View style={styles.dropdownContainer}>
        <Picker
          selectedValue={localizacao}
          onValueChange={setLocalizacao}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          <Picker.Item label="Selecione a localização..." value="" />
          {subestacoesLista.length === 0 && (
            <Picker.Item label="Carregando..." value="" enabled={false} />
          )}
          {subestacoesLista.map((loc, i) => (
            <Picker.Item key={i} label={loc} value={loc} />
          ))}
        </Picker>
      </View>

      <View style={styles.dropdownContainer}>
        <Picker
          selectedValue={status}
          onValueChange={setStatus}
          style={styles.picker}
          itemStyle={styles.pickerItem}
        >
          <Picker.Item label="Selecione o status..." value="" />
          {['Inativos', 'Operacional', 'Com falha', 'Em manutenção'].map((statusItem, i) => (
            <Picker.Item key={i} label={statusItem} value={statusItem} />
          ))}
        </Picker>
      </View>

      {checklistItems.map((item, index) => (
        <View key={index} style={styles.dropdownContainer}>
          <Text style={styles.label}>{item}</Text>
          <Picker
            selectedValue={respostas[index]}
            style={styles.picker}
            itemStyle={styles.pickerItem}
            onValueChange={(valor) => {
              const nova = [...respostas];
              nova[index] = valor;
              setRespostas(nova);
            }}
          >
            <Picker.Item label="Selecione..." value="" />
            {criterios.map((criterio, i) => (
              <Picker.Item key={i} label={criterio} value={criterio} />
            ))}
          </Picker>
        </View>
      ))}

      <TouchableOpacity style={styles.button} onPress={salvarInspecao}>
        <Text style={styles.buttonText}>SALVAR INSPEÇÃO</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black', padding: 20 },
  title: {
    color: 'yellow',
    fontSize: 22,
    marginBottom: 20,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'android' ? 'Roboto' : 'System',
    textAlign: 'center',
  },
  dropdownContainer: {
    marginBottom: 10,
  },
  label: {
    color: 'white',
    marginBottom: 8,
    fontSize: 15,
  },
  picker: {
    backgroundColor: 'white',
    height: 50,
    borderRadius: 5,
    width: '100%',
  },
  pickerItem: {
    fontSize: 16,
    height: 50,
  },
  button: {
    backgroundColor: '#339CFF',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
