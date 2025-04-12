import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'react-native';

// Import screens
import HomeScreen from './screens/HomeScreen';
import SalesReportScreen from './screens/SalesReportScreen';
import ProductsScreen from './screens/ProductsScreen';
import InsightsScreen from './screens/InsightsScreen';
import ChatScreen from './screens/ChatScreen';
import MerchantLoginScreen from './screens/MerchantLoginScreen';
import MerchantSelectScreen from './screens/MerchantSelectScreen';

// Define Grab-branded custom theme
const GrabTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#00B14F',
    secondary: '#67C983',
    background: '#F6FDF9',
    card: '#FFFFFF',
    text: '#333333',
    subtext: '#666666',
    border: '#E0E0E0',
    error: '#FF6B6B',
    success: '#00B14F',
    warning: '#FFD700',
    highlight: '#E8F7EF',
    inactive: '#BBBBBB',
    notification: '#FF5722',
  },
};

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer theme={GrabTheme}>
      {/* Status bar styling */}
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* App-wide navigation stack */}
      <Stack.Navigator
        initialRouteName="MerchantLoginScreen"
        screenOptions={{
          headerShown: false,
          headerStyle: {
            backgroundColor: '#FFFFFF',
            elevation: 0,
            shadowOpacity: 0,
            borderBottomWidth: 1,
            borderBottomColor: '#F0F0F0',
          },
          headerTintColor: '#00B14F',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 18,
          },
          cardStyle: { backgroundColor: '#F6FDF9' },
          animation: 'slide_from_right',
        }}>

        {/* Merchant Login screen with no header */}
        <Stack.Screen 
          name="MerchantLoginScreen" 
          component={MerchantLoginScreen} 
          options={{ headerShown: false }} 
        />

        {/* Optional merchant selector screen */}
        <Stack.Screen 
          name="MerchantSelectScreen" 
          component={MerchantSelectScreen} 
          options={{ 
            title: 'Select Merchant',
            headerShown: true,
          }} 
        />

        {/* Home Dashboard */}
        <Stack.Screen 
          name="Home" 
          component={HomeScreen} 
          options={({ route }) => ({ 
            headerShown: true,
            title: route.params?.merchantName || 'Merchant Dashboard',
          })} 
        />

        {/* Detailed pages for each feature */}
        <Stack.Screen 
          name="SalesReportScreen" 
          component={SalesReportScreen} 
          options={{ 
            title: 'Sales Report',
            headerShown: true,
          }} 
        />

        <Stack.Screen 
          name="ProductsScreen" 
          component={ProductsScreen} 
          options={{ 
            title: 'Products',
            headerShown: true,
          }} 
        />

        <Stack.Screen 
          name="InsightsScreen" 
          component={InsightsScreen} 
          options={{ 
            title: 'Business Insights',
            headerShown: true,
          }} 
        />

        <Stack.Screen 
          name="ChatScreen" 
          component={ChatScreen} 
          options={{ 
            title: 'Keyword Insights',
            headerShown: true,
          }} 
        />

      </Stack.Navigator>
    </NavigationContainer>
  );
}