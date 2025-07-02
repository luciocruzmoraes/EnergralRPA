import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, Platform } from 'react-native';
import { signInWithEmailAndPassword, onAuthStateChanged } from 'firebase/auth';
import { useRouter } from 'expo-router';
import { auth } from '../../config/firebase-config';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        router.replace('/(tabs)/survey');  
      }
    });
    return () => unsubscribe();
  }, [router]);

  const login = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, senha);
      // O redirecionamento será feito automaticamente no useEffect
    } catch (error: any) {
      Alert.alert('Erro ao fazer login', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.loginForm}>
        <Text style={styles.title}>Login</Text>
        <TextInput
          style={styles.input}
          placeholder="E-mail"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Senha"
          value={senha}
          onChangeText={setSenha}
          secureTextEntry
        />
        <Button title="Entrar" onPress={login} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'black', 
    justifyContent: 'center', // Centraliza o conteúdo verticalmente
    alignItems: 'center', // Centraliza o conteúdo horizontalmente
    padding: 20 
  },
  loginForm: {
    width: '100%', // Garante que o formulário ocupe toda a largura possível
    maxWidth: 400, // Define uma largura máxima para o formulário
    alignItems: 'center', // Centraliza os itens dentro do formulário
  },
  title: {
    color: 'yellow',
    fontSize: 22,
    marginBottom: 20,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'android' ? 'Roboto' : 'System',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    color: 'white',
    width: '100%', // Faz o input ocupar toda a largura disponível
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
