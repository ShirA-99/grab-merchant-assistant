import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import HomeScreen from './screens/HomeScreen';
import ChatScreen from './screens/ChatScreen';
import SalesReportScreen from './screens/SalesReportScreen';
import ProductsScreen from './screens/ProductsScreen';
import InsightsScreen from './screens/InsightsScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="Home"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#4caf50',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Merchant Dashboard' }} />
        <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Assistant Chat' }} />
        <Stack.Screen name="SalesReport" component={SalesReportScreen} options={{ title: 'Sales Report' }} />
        <Stack.Screen name="Products" component={ProductsScreen} options={{ title: 'Top Products' }} />
        <Stack.Screen name="Insights" component={InsightsScreen} options={{ title: 'Business Insights' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}