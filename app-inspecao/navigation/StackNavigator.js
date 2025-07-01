import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Login from '../screens/Login';
import Home from '../screens/Home';
import CadastroUsuario from '../screens/CadastroUsuario';
import CadastroEquipamento from '../screens/CadastroEquipamento';
import CadastroSubestacao from '../screens/CadastroSubestacao';
import FormularioInspecao from '../screens/FormularioInspecao';

const Stack = createNativeStackNavigator();

export default function StackNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={Login} />
        <Stack.Screen name="Home" component={Home} />
        <Stack.Screen name="CadastroUsuario" component={CadastroUsuario} />
        <Stack.Screen name="CadastroEquipamento" component={CadastroEquipamento} />
        <Stack.Screen name="CadastroSubestacao" component={CadastroSubestacao} />
        <Stack.Screen name="FormularioInspecao" component={FormularioInspecao} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
