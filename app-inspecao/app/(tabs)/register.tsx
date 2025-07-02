import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Switch,
  Platform,
} from 'react-native';
import { auth, db } from '../../config/firebase-config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';

export default function CadastroUsuario() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [cpf, setCpf] = useState('');
  const [dtAdmissao, setDtAdmissao] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();

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

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace('/'); // Altere para a rota de login se necessário
    } catch (e) {
      Alert.alert('Erro ao sair', 'Não foi possível desconectar.');
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Cadastro de Usuário</Text>

        <TextInput
          placeholder="Nome"
          value={nome}
          onChangeText={setNome}
          style={styles.input}
          placeholderTextColor="#aaa"
        />
        <TextInput
          placeholder="CPF"
          value={cpf}
          onChangeText={setCpf}
          style={styles.input}
          placeholderTextColor="#aaa"
        />
        <TextInput
          placeholder="Data de admissão (AAAA-MM-DD)"
          value={dtAdmissao}
          onChangeText={setDtAdmissao}
          style={styles.input}
          placeholderTextColor="#aaa"
        />
        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          style={styles.input}
          placeholderTextColor="#aaa"
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          placeholder="Senha"
          value={senha}
          onChangeText={setSenha}
          style={styles.input}
          placeholderTextColor="#aaa"
          secureTextEntry
        />

        <View style={styles.switchContainer}>
          <Text style={styles.label}>Criar como admin?</Text>
          <Switch value={isAdmin} onValueChange={setIsAdmin} />
        </View>

        <TouchableOpacity style={styles.button} onPress={criarUsuario}>
          <Text style={styles.buttonText}>Cadastrar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  form: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  logoutButton: {
    alignSelf: 'flex-end',
    marginBottom: 10,
    padding: 8,
    backgroundColor: '#555',
    borderRadius: 6,
  },
  logoutText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  title: {
    color: 'yellow',
    fontSize: 24,
    marginBottom: 20,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'android' ? 'Roboto' : 'System',
    textAlign: 'center',
  },
  input: {
    width: '100%',
    padding: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    color: 'white',
    backgroundColor: '#444',
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    alignSelf: 'flex-start',
  },
  label: {
    color: 'white',
    fontSize: 16,
    marginRight: 10,
  },
  button: {
    padding: 15,
    backgroundColor: '#007aff',
    borderRadius: 8,
    marginTop: 20,
    width: '100%',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
