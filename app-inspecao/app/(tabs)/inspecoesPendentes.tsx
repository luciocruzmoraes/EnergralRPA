import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Platform,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../config/firebase-config';
import { useFocusEffect } from '@react-navigation/native';

const KEY_PEND = 'inspecoesPendentes';

export default function InspecoesPendentes() {
  const [pendentes, setPendentes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const carregarPendentes = useCallback(async () => {
    try {
      const json = await AsyncStorage.getItem(KEY_PEND);
      if (json) {
        const lista = JSON.parse(json);
        if (Array.isArray(lista)) {
          setPendentes(lista);
        } else {
          setPendentes([]);
        }
      } else {
        setPendentes([]);
      }
    } catch (e) {
      Alert.alert('Erro', 'Falha ao carregar inspeções pendentes');
      setPendentes([]);
    }
  }, []);

  // Recarrega sempre que a tela for focada
  useFocusEffect(
    useCallback(() => {
      carregarPendentes();
    }, [carregarPendentes])
  );

  const sincronizar = async () => {
    if (pendentes.length === 0) {
      Alert.alert('Nada a sincronizar', 'Não há inspeções pendentes para enviar.');
      return;
    }

    setLoading(true);

    try {
      for (const item of pendentes) {
        await addDoc(collection(db, 'inspecoes'), item);
      }
      await AsyncStorage.removeItem(KEY_PEND);
      setPendentes([]);
      Alert.alert('Sucesso', 'Todas as inspeções pendentes foram sincronizadas!');
    } catch (e) {
      Alert.alert('Erro', 'Falha ao sincronizar inspeções. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: any }) => {
    const dataFormatada = item.data
      ? new Date(item.data).toLocaleString()
      : 'Data não informada';

    return (
      <View style={styles.item}>
        <Text style={styles.title}>
          {item.equipamento ?? 'Equipamento não informado'} - {item.localizacao ?? 'Localização não informada'}
        </Text>
        <Text>Status: {item.status ?? 'Desconhecido'}</Text>
        <Text>Data: {dataFormatada}</Text>
        {item.observacao ? (
          <Text numberOfLines={2} style={styles.observacao}>
            Observação: {item.observacao}
          </Text>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Inspeções Pendentes</Text>

      {pendentes.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Nenhuma inspeção pendente.</Text>
        </View>
      ) : (
        <FlatList
          data={pendentes}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}

      <TouchableOpacity
        style={[styles.btn, loading && styles.btnDisabled]}
        onPress={sincronizar}
        disabled={loading}
      >
        <Text style={styles.btnTxt}>
          {loading ? 'Sincronizando...' : 'Sincronizar todas'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const { width } = Dimensions.get('window');
const CARD_MAX = 480;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 20,
    alignItems: 'center',
  },

  heading: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'yellow',
    marginBottom: 20,
    fontFamily: Platform.select({ ios: 'System', android: 'Roboto', default: 'sans-serif' }),
  },

  list: {
    width: '100%',
    maxWidth: Platform.OS === 'web' ? CARD_MAX : '100%',
  },

  item: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
  },

  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },

  observacao: {
    color: '#ccc',
    marginTop: 6,
    fontStyle: 'italic',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },

  emptyText: {
    color: '#bbb',
    fontSize: 16,
  },

  btn: {
    backgroundColor: '#007aff',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    width: '100%',
    maxWidth: CARD_MAX,
    alignItems: 'center',
  },

  btnDisabled: {
    backgroundColor: '#555',
  },

  btnTxt: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
