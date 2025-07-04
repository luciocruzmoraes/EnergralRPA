import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
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
  const [dataAdmissao, setDataAdmissao] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [mensagem, setMensagem] = useState(''); // estado para mensagem temporária
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
        dataadmissao: dataAdmissao,
        role: isAdmin ? 'admin' : 'user',
      });

      setMensagem(`Usuário ${nome} cadastrado como ${isAdmin ? 'admin' : 'usuário comum'}.`);
      
      // Limpar campos
      setEmail('');
      setSenha('');
      setNome('');
      setCpf('');
      setDataAdmissao('');
      setIsAdmin(false);

      // Limpar mensagem após 4 segundos
      setTimeout(() => setMensagem(''), 4000);

    } catch (error: any) {
      setMensagem(error.message || 'Erro ao criar usuário');
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
          <Text style={styles.title}>Cadastro de Usuário</Text>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Text style={styles.logoutText}>Sair</Text>
          </TouchableOpacity>
        </View>

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
          value={dataAdmissao}
          onChangeText={setDataAdmissao}
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
    flex: 1, 
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
  successMessage: {
    marginTop: 15,
    color: 'lightgreen',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
});
