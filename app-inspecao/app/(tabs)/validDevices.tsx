import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet, Alert } from 'react-native';
import { collection, getDocs, deleteDoc, doc, addDoc } from 'firebase/firestore';
import { db, auth } from '../../config/firebase-config';
import { useAdmin } from '@/hooks/useAdmin';
import { useRouter } from 'expo-router';

export default function ValidarEquipamentos() {
  const [pendentes, setPendentes] = useState<any[]>([]);
  const isAdmin = useAdmin();
  const router = useRouter();

  useEffect(() => {
    if (isAdmin === false) router.replace('/');
    if (isAdmin) carregarPendentes();
  }, [isAdmin]);

  const carregarPendentes = async () => {
    const snap = await getDocs(collection(db, 'equipamentosPendentes'));
    const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    setPendentes(lista);
  };

  const validarEquipamento = async (equip: any) => {
    const user = auth.currentUser;
    if (!user) return;

    try {
      await addDoc(collection(db, 'equipamentos'), {
        nome: equip.nome,
        localizacao: equip.localizacao,
        status: equip.status,
        usuario: equip.usuario,
        validador: user.email,
      });
      await deleteDoc(doc(db, 'equipamentosPendentes', equip.id));
      Alert.alert('Validação', 'Equipamento aprovado!');
      carregarPendentes();
    } catch (e) {
      Alert.alert('Erro', 'Falha ao validar equipamento.');
    }
  };

  const recusarEquipamento = async (equipId: string) => {
    try {
      await deleteDoc(doc(db, 'equipamentosPendentes', equipId));
      Alert.alert('Recusado', 'Equipamento removido.');
      carregarPendentes();
    } catch (e) {
      Alert.alert('Erro', 'Erro ao recusar equipamento.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Equipamentos Pendentes</Text>
      <FlatList
        data={pendentes}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.text}>Nome: {item.nome}</Text>
            <Text style={styles.text}>Local: {item.localizacao}</Text>
            <Text style={styles.text}>Status: {item.status}</Text>
            <Text style={styles.text}>Criado por: {item.usuario}</Text>

            <View style={styles.buttons}>
              <Button title="Aprovar" onPress={() => validarEquipamento(item)} />
              <Button title="Recusar" color="red" onPress={() => recusarEquipamento(item.id)} />
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#000' },
  title: { fontSize: 22, color: 'yellow', textAlign: 'center', marginBottom: 15 },
  card: {
    backgroundColor: '#222',
    padding: 15,
    borderRadius: 8,
    marginBottom: 12,
  },
  text: { color: '#fff', marginBottom: 6 },
  buttons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
});
