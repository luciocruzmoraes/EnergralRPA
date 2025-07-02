import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { db, auth } from '../../config/firebase-config';
import { addDoc, collection } from 'firebase/firestore';
import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'expo-router';

export default function Platforma() {
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const isAdmin = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (isAdmin === false) {
      router.replace('/(tabs)/survey');
    }
  }, [isAdmin, router]);

  if (isAdmin === null) return <Text>Carregando...</Text>;
  if (isAdmin === false) return null;

  const handleAddSubstation = async () => {
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

  const handleLogout = async () => {
    try {
      await auth.signOut();
      router.replace('/'); // Altere para a rota de login, se necessário
    } catch (e) {
      Alert.alert('Erro', 'Falha ao sair.');
      console.error(e);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Sair</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Cadastro de Subestação</Text>

        <TextInput
          style={styles.input}
          placeholder="Nome"
          value={name}
          onChangeText={setName}
          placeholderTextColor="#aaa"
        />
        <TextInput
          style={styles.input}
          placeholder="Cidade"
          value={city}
          onChangeText={setCity}
          placeholderTextColor="#aaa"
        />
        <TextInput
          style={styles.input}
          placeholder="Estado"
          value={state}
          onChangeText={setState}
          placeholderTextColor="#aaa"
        />
        <Button title="Cadastrar Subestação" onPress={handleAddSubstation} />
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
    alignItems: 'center',
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    position: 'relative',
  },
  logoutButton: {
    position: 'absolute',
    top: 10,
    right: 10,
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
});
