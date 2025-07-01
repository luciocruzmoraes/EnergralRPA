import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { db, auth } from '../../config/firebase-config';
import { addDoc, collection, doc, getDoc } from 'firebase/firestore';

export default function CadastroSubestacao() {
  const [nome, setNome] = useState('');
  const [cidade, setCidade] = useState('');
  const [estado, setEstado] = useState('');

  const handleSalvar = async () => {
    const user = auth.currentUser;
    if (!user) return Alert.alert('Erro', 'Usuário não autenticado');

    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (!userDoc.exists() || userDoc.data().role !== 'admin') {
      return Alert.alert('Erro', 'Apenas admins podem cadastrar');
    }

    await addDoc(collection(db, 'subestacoes'), { nome, cidade, estado });
    Alert.alert('Sucesso', 'Subestação cadastrada');
    setNome('');
    setCidade('');
    setEstado('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cadastro de Subestação</Text>
      <TextInput placeholder="Nome" value={nome} onChangeText={setNome} style={styles.input} />
      <TextInput placeholder="Cidade" value={cidade} onChangeText={setCidade} style={styles.input} />
      <TextInput placeholder="Estado" value={estado} onChangeText={setEstado} style={styles.input} />
      <Button title="Salvar" onPress={handleSalvar} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: 'black', justifyContent: 'center' },
  title: { color: 'yellow', fontSize: 20, marginBottom: 20 },
  input: { backgroundColor: 'white', marginBottom: 10, padding: 10, borderRadius: 5 },
});
