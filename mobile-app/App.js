import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import your screens
import HomeScreen from './screens/HomeScreen';
import SalesReportScreen from './screens/SalesReportScreen';
import ProductsScreen from './screens/ProductsScreen';
import InsightsScreen from './screens/InsightsScreen';
import ChatScreen from './screens/ChatScreen';
import MerchantLoginScreen from './screens/MerchantLoginScreen';
import MerchantSelectScreen from './screens/MerchantSelectScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator 
        initialRouteName="MerchantLogin"
        screenOptions={{
          headerStyle: {
            backgroundColor: '#4285F4',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="MerchantLogin" 
          component={MerchantLoginScreen} 
          options={{ title: 'Merchant Login' }}
        />
        <Stack.Screen 
          name="MerchantSelect" 
          component={MerchantSelectScreen} 
          options={{ title: 'Select Merchant' }}
        />
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={{ title: 'Dashboard' }}
        />
        <Stack.Screen 
          name="SalesReport" 
          component={SalesReportScreen} 
          options={{ title: 'Sales Report' }}
        />
        <Stack.Screen 
          name="Products" 
          component={ProductsScreen} 
          options={{ title: 'Products' }}
        />
        <Stack.Screen 
          name="Insights" 
          component={InsightsScreen} 
          options={{ title: 'Business Insights' }}
        />
        <Stack.Screen 
          name="Chat" 
          component={ChatScreen} 
          options={{ title: 'Assistant' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;