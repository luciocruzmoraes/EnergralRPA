import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { auth, db } from '../../config/firebase-config';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { useRouter } from 'expo-router';

export default function Platforma() {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [mensagem, setMensagem] = useState(''); // estado para mensagem temporária
  const [isAdmin, setIsAdmin] = useState(false); // Adicionando controle para admin
  const router = useRouter();

  useEffect(() => {
    const verificarAdmin = async () => {
      try {
        const userAtual = auth.currentUser;
        if (!userAtual) {
          setMensagem('Usuário não autenticado.');
          return;
        }

        const docSnap = await getDoc(doc(db, 'users', userAtual.uid));
        if (!docSnap.exists() || docSnap.data().role !== 'admin') {
          setMensagem('Você não tem permissão para acessar esta página.');
        }
      } catch (err) {
        console.error('Erro ao verificar admin:', err);
        setMensagem('Não foi possível verificar permissões.');
      }
    };

    verificarAdmin();
  }, []);

  const handleAddSubstation = async () => {
    if (!name || !city || !state) {
      Alert.alert('Erro', 'Preencha todos os campos!');
      return;
    }

    try {
      await setDoc(doc(db, 'subestacoes', name), {
        nome: name,
        cidade: city,
        estado: state,
      });

      setMensagem(`Subestação ${name} cadastrada com sucesso!`);

      // Limpar campos
      setName('');
      setCity('');
      setState('');

      // Limpar mensagem após 4 segundos
      setTimeout(() => setMensagem(''), 4000);
    } catch (error) {
      console.error('Erro ao adicionar subestação:', error);
      setMensagem('Erro ao cadastrar subestação');
      setTimeout(() => setMensagem(''), 4000);
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace('/');
    } catch (e) {
      setMensagem('Erro ao sair. Não foi possível desconectar.');
      console.error(e);
      setTimeout(() => setMensagem(''), 4000);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        {/* Cabeçalho com título e botão de logout */}
        <View style={styles.cardHeader}>
          <Text style={styles.title}>Cadastro de Subestação</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>

        <TextInput
          placeholder="Nome"
          value={name}
          onChangeText={setName}
          style={styles.input}
          placeholderTextColor="#aaa"
        />
        <TextInput
          placeholder="Cidade"
          value={city}
          onChangeText={setCity}
          style={styles.input}
          placeholderTextColor="#aaa"
        />
        <TextInput
          placeholder="Estado"
          value={state}
          onChangeText={setState}
          style={styles.input}
          placeholderTextColor="#aaa"
        />

        <TouchableOpacity style={styles.button} onPress={handleAddSubstation}>
          <Text style={styles.buttonText}>Cadastrar</Text>
        </TouchableOpacity>

        {mensagem ? (
          <Text style={styles.successMessage}>{mensagem}</Text>
        ) : null}

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
  cardHeader: {
    flexDirection: 'row',
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: 'yellow',
    fontSize: 24,
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'android' ? 'Roboto' : 'System',
    textAlign: 'center',
    flex: 1, // Garante que o título ocupe todo o espaço disponível e fique centralizado
  },
  logoutButton: {
    backgroundColor: '#555',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  logoutText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
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
  successMessage: {
    marginTop: 15,
    color: 'lightgreen',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
});
