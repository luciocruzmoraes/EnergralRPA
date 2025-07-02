import React, { useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { db, auth } from '../../config/firebase-config';
import { addDoc, collection } from 'firebase/firestore';
import { useAdmin } from '@/hooks/useAdmin';

export default function Platform() {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const isAdmin = useAdmin();

  const handleAddSubstation = async () => {
    if (isAdmin === false) return Alert.alert('Acesso negado', 'Apenas administradores podem cadastrar subestações.');

    try {
      await addDoc(collection(db, 'Platform'), { name, city, state });
      Alert.alert('Sucesso', 'Subestação cadastrada com sucesso');
      setName('');
      setCity('');
      setState('');
    } catch (error: any) {
      Alert.alert('Erro', error.message);
    }
  };

  if (isAdmin === null) return <Text>Carregando...</Text>;  // Verificando o status do admin
  if (isAdmin === false) return <Text>Acesso negado. Você não tem permissões de administrador.</Text>; // Acesso negado

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cadastro de Subestação</Text>
      <TextInput style={styles.input} placeholder="Nome" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Cidade" value={city} onChangeText={setCity} />
      <TextInput style={styles.input} placeholder="Estado" value={state} onChangeText={setState} />
      <Button title="Cadastrar Subestação" onPress={handleAddSubstation} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  title: { fontSize: 24, marginBottom: 20 },
  input: { padding: 10, marginBottom: 15, borderWidth: 1, borderColor: '#ccc', borderRadius: 5 },
});
