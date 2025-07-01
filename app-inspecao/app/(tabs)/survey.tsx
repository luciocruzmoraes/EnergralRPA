import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { auth, db } from '../../config/firebase-config';
import { collection, addDoc } from 'firebase/firestore';


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

export default function Inspecao() {
  const [equipamento, setEquipamento] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [status, setStatus] = useState('');
  const [respostas, setRespostas] = useState(Array(5).fill(''));

  const salvarInspecao = async () => {
    const user = auth.currentUser;
    if (!user) return Alert.alert('Erro', 'Usuário não autenticado');

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

      <TextInput
        placeholder="Equipamento"
        value={equipamento}
        onChangeText={setEquipamento}
        style={styles.input}
      />
      <TextInput
        placeholder="Localização"
        value={localizacao}
        onChangeText={setLocalizacao}
        style={styles.input}
      />
      <TextInput
        placeholder="Status"
        value={status}
        onChangeText={setStatus}
        style={styles.input}
      />

      {checklistItems.map((item, index) => (
        <View key={index} style={styles.dropdownContainer}>
          <Text style={styles.label}>{item}</Text>
          <Picker
            selectedValue={respostas[index]}
            style={styles.picker}
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

      <Button title="Salvar Inspeção" onPress={salvarInspecao} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black', padding: 20 },
  title: { color: 'yellow', fontSize: 22, marginBottom: 20 },
  input: {
    backgroundColor: 'white',
    marginBottom: 10,
    borderRadius: 5,
    padding: 10,
  },
  dropdownContainer: {
    marginBottom: 15,
    backgroundColor: '#1c1c1c',
    borderRadius: 5,
    padding: 10,
  },
  label: { color: 'white', marginBottom: 5 },
  picker: {
    backgroundColor: 'white',
    borderRadius: 5,
  },
});
