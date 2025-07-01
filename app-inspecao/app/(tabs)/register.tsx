import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  Switch,
} from 'react-native';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../config/firebase-config';

export default function Register() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const criarUsuario = async () => {
    const userAtual = auth.currentUser;
    if (!userAtual) return Alert.alert('Erro', 'Usuário não autenticado');

    // Verifica se o usuário logado é admin
    const docSnap = await getDoc(doc(db, 'users', userAtual.uid));
    if (!docSnap.exists() || docSnap.data().role !== 'admin') {
      return Alert.alert('Erro', 'Apenas admins podem cadastrar usuários');
    }

    try {
      const apiKey = 'AIzaSyCGjNUNIE_9SD1-40znBb2-byHlp95DfxQ'; // 🔑 sua chave Web API do Firebase

      // Cria usuário pela API REST do Firebase Auth
      const response = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password: senha,
            returnSecureToken: true,
          }),
        }
      );

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      // Salva papel (role) no Firestore
      await setDoc(doc(db, 'users', data.localId), {
        email,
        role: isAdmin ? 'admin' : 'user',
      });

      Alert.alert('Sucesso', `Usuário criado como ${isAdmin ? 'admin' : 'user'}`);
      setEmail('');
      setSenha('');
      setIsAdmin(false);
    } catch (error: any) {
      Alert.alert('Erro ao criar usuário', error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cadastro de Usuário</Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        placeholder="Senha"
        value={senha}
        secureTextEntry
        onChangeText={setSenha}
        style={styles.input}
      />

      <View style={styles.switchContainer}>
        <Text style={styles.label}>Criar como admin?</Text>
        <Switch value={isAdmin} onValueChange={setIsAdmin} />
      </View>

      <Button title="Cadastrar" onPress={criarUsuario} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    color: 'yellow',
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: 'white',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  label: {
    color: 'white',
    marginRight: 10,
  },
});
