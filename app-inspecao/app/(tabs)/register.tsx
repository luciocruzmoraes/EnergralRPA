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
import { auth, db } from '../../config/firebase-config';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export default function CadastroUsuario() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [dtAdmissao, setDtAdmissao] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);

  const criarUsuario = async () => {
    try {
      const userAtual = auth.currentUser;
      if (!userAtual) throw new Error('Usuário não autenticado');

      const docSnap = await getDoc(doc(db, 'users', userAtual.uid));
      if (!docSnap.exists() || docSnap.data().role !== 'admin') {
        throw new Error('Apenas admins podem cadastrar usuários');
      }

      const apiKey = 'AIzaSyCGjNUNIE_9SD1-40znBb2-byHlp95DfxQ';

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

      if (data.error) throw new Error(data.error.message);

      await setDoc(doc(db, 'users', data.localId), {
        email,
        nome,
        cpf,
        dtAdmissao: new Date(dtAdmissao),
        role: isAdmin ? 'admin' : 'user',
      });

      Alert.alert('Sucesso', `Usuário criado como ${isAdmin ? 'admin' : 'user'}`);
      setEmail('');
      setSenha('');
      setNome('');
      setCpf('');
      setDtAdmissao('');
      setIsAdmin(false);
    } catch (error: any) {
      Alert.alert('Erro', error.message || 'Erro ao criar usuário');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cadastro de Usuário</Text>

      <TextInput
        placeholder="Nome"
        value={nome}
        onChangeText={setNome}
        style={styles.input}
      />
      <TextInput
        placeholder="CPF"
        value={cpf}
        onChangeText={setCpf}
        style={styles.input}
      />
      <TextInput
        placeholder="Data de admissão (AAAA-MM-DD)"
        value={dtAdmissao}
        onChangeText={setDtAdmissao}
        style={styles.input}
      />
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        style={styles.input}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Senha"
        value={senha}
        onChangeText={setSenha}
        style={styles.input}
        secureTextEntry
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
  container: { flex: 1, backgroundColor: 'black', padding: 20, justifyContent: 'center' },
  title: { color: 'yellow', fontSize: 22, marginBottom: 20, textAlign: 'center' },
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