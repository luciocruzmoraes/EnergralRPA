import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

const checklist = [
  { item: 'CHK001', descricao: 'Soluta adipisci odit aut.' },
  { item: 'CHK002', descricao: 'Asperiores perspiciatis numquam quibusdam atque.' },
  { item: 'CHK003', descricao: 'Veniam dolores magnam porro voluptate occaecati.' },
  { item: 'CHK004', descricao: 'At fuga aspernatur exercitationem odio fugit pariatur.' },
  { item: 'CHK005', descricao: 'Dolor inventore facere debitis eligendi.' },
];

const criterios = [
  'Dentro dos parâmetros',
  'Sinal estável',
  'Sem danos visíveis',
  'Funcionamento normal',
];

export default function App() {
  const [marcados, setMarcados] = useState<string[]>([]);
  const [criteriosSelecionados, setCriteriosSelecionados] = useState<{ [item: string]: string }>({});

  const alternarItem = (item: string) => {
    setMarcados(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const enviarChecklist = () => {
    if (marcados.length === 0) {
      Alert.alert('Checklist', 'Nenhum item selecionado.');
      return;
    }

    const resultado = marcados.map(item => 
      `${item} - ${criteriosSelecionados[item] || 'Sem critério'}`
    ).join('\n');

    Alert.alert('Resultado', resultado);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.titulo}>Checklist de Inspeção</Text>
      <ScrollView contentContainerStyle={styles.scroll}>
        {checklist.map(({ item, descricao }) => (
          <TouchableOpacity
            key={item}
            onPress={() => alternarItem(item)}
            activeOpacity={0.9}
            style={[styles.card, marcados.includes(item) && styles.cardAtivo]}
          >
            <Text style={styles.itemTexto}>
              {marcados.includes(item) ? '✅' : '⬜️'} {item} - {descricao}
            </Text>

            <Picker
              selectedValue={criteriosSelecionados[item] || ''}
              onValueChange={(valor) =>
                setCriteriosSelecionados(prev => ({ ...prev, [item]: valor }))
              }
              style={styles.picker}
            >
              <Picker.Item label="Selecionar critério..." value="" />
              {criterios.map((c, index) => (
                <Picker.Item key={index} label={c} value={c} />
              ))}
            </Picker>
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.botao} onPress={enviarChecklist}>
          <Text style={styles.botaoTexto}>Enviar Checklist</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    paddingTop: 40,
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#000000',
    marginBottom: 20,
  },
  scroll: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  card: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    marginBottom: 14,
  },
  cardAtivo: {
    backgroundColor: '#e6f8ec', // verde claro
  },
  itemTexto: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
    marginBottom: 6,
  },
  picker: {
    height: 40,
    color: '#000',
    backgroundColor: 'transparent',
  },
  botao: {
    backgroundColor: '#2ECC71',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 20,
  },
  botaoTexto: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
