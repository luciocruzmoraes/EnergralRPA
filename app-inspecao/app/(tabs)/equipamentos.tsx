import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { db, auth } from '../../config/firebase-config';
import { addDoc, collection, doc, getDoc } from 'firebase/firestore';

export default function CadastroEquipamento() {
  const [nome, setNome] = useState('');
  const [localizacao, setLocalizacao] = useState('');
  const [subestacaoId, setSubestacaoId] = useState('');

  const handleSalvar = async () => {
    const user = auth.currentUser;
    if (!user) return Alert.alert('Erro', 'Usuário não autenticado');

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists() || userDoc.data().role !== 'admin') {
      return Alert.alert('Erro', 'Apenas admins podem cadastrar');
    }

    await addDoc(collection(db, 'equipamentos'), {
      nome,
      localizacao,
      subestacaoId,
    });

    Alert.alert('Sucesso', 'Equipamento cadastrado');
    setNome('');
    setLocalizacao('');
    setSubestacaoId('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cadastro de Equipamento</Text>
      <TextInput placeholder="Nome" value={nome} onChangeText={setNome} style={styles.input} />
      <TextInput placeholder="Localização" value={localizacao} onChangeText={setLocalizacao} style={styles.input} />
      <TextInput placeholder="ID da Subestação" value={subestacaoId} onChangeText={setSubestacaoId} style={styles.input} />
      <Button title="Salvar" onPress={handleSalvar} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: 'black', justifyContent: 'center' },
  title: { color: 'yellow', fontSize: 20, marginBottom: 20 },
  input: { backgroundColor: 'white', marginBottom: 10, padding: 10, borderRadius: 5 },
});
