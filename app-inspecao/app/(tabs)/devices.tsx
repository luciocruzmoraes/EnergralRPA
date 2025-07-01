import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, Button, Alert, StyleSheet, 
  FlatList, TouchableOpacity 
} from 'react-native';
import { db, auth } from '../../config/firebase-config';
import { addDoc, collection, doc, getDoc, getDocs } from 'firebase/firestore';

type Subestacao = {
  id: string;
  nome?: string;
};

export default function devicesRegister() {
  const [nome, setNome] = useState('');
  const [setor, setSetor] = useState('');
  const [subestacaoId, setSubestacaoId] = useState('');
  const [subestacoes, setSubestacoes] = useState<Subestacao[]>([]);

  useEffect(() => {
    const carregarSubestacoes = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'subestacoes'));
        const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Subestacao[];
        setSubestacoes(lista);
      } catch (error) {
        Alert.alert('Erro', 'Não foi possível carregar as subestações');
      }
    };

    carregarSubestacoes();
  }, []);

  const handleSalvar = async () => {
    const user = auth.currentUser;
    if (!user) return Alert.alert('Erro', 'Usuário não autenticado');

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists() || userDoc.data().role !== 'admin') {
      return Alert.alert('Erro', 'Apenas admins podem cadastrar');
    }

    if (!nome.trim()) return Alert.alert('Erro', 'Informe o nome do equipamento');
    if (!setor.trim()) return Alert.alert('Erro', 'Informe o setor');
    if (!subestacaoId) return Alert.alert('Erro', 'Selecione uma subestação');

    await addDoc(collection(db, 'equipamentos'), {
      nome,
      setor,
      subestacaoId,
    });

    Alert.alert('Sucesso', 'Equipamento cadastrado');
    setNome('');
    setSetor('');
    setSubestacaoId('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cadastro de Equipamento</Text>
      
      <TextInput
        placeholder="Nome"
        value={nome}
        onChangeText={setNome}
        style={styles.input}
      />
      
      <TextInput
        placeholder="Setor"
        value={setor}
        onChangeText={setSetor}
        style={styles.input}
      />

      <Text style={[styles.label, { marginTop: 10 }]}>Selecione a Subestação:</Text>
      
      <FlatList
        data={subestacoes}
        keyExtractor={item => item.id}
        style={{ maxHeight: 150, marginBottom: 20 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.subestacaoItem,
              subestacaoId === item.id && styles.subestacaoSelecionada,
            ]}
            onPress={() => setSubestacaoId(item.id)}
          >
            <Text style={styles.subestacaoText}>{item.nome || item.id}</Text>
          </TouchableOpacity>
        )}
      />

      <Button title="Salvar" onPress={handleSalvar} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: 'black', justifyContent: 'center' },
  title: { color: 'yellow', fontSize: 20, marginBottom: 20 },
  input: { backgroundColor: 'white', marginBottom: 10, padding: 10, borderRadius: 5 },
  label: { color: 'yellow', fontSize: 16, marginBottom: 5 },
  subestacaoItem: {
    padding: 10,
    backgroundColor: '#333',
    marginBottom: 5,
    borderRadius: 5,
  },
  subestacaoSelecionada: {
    backgroundColor: 'yellow',
  },
  subestacaoText: {
    color: 'black',
  },
});
