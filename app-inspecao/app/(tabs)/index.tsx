import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { auth } from '../../config/firebase-config';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const router = useRouter();

  useEffect(() => {
    onAuthStateChanged(auth, user => {
      if (user) router.replace('/inspecoes');
    });
  }, []);

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      router.replace('/inspecoes');
    } catch (error) {
      Alert.alert('Erro', 'Credenciais inválidas');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput placeholder="Email" onChangeText={setEmail} style={styles.input} />
      <TextInput placeholder="Senha" secureTextEntry onChangeText={setSenha} style={styles.input} />
      <Button title="Entrar" onPress={login} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black', justifyContent: 'center', padding: 20 },
  title: { color: 'yellow', fontSize: 24, marginBottom: 20 },
  input: { backgroundColor: 'white', padding: 10, marginBottom: 10, borderRadius: 5 },
});
