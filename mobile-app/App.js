// App.js
import React from 'react';
import { StatusBar } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
// Screens
import HomeScreen from './screens/HomeScreen';
import SalesReportScreen from './screens/SalesReportScreen';
import ProductsScreen from './screens/ProductsScreen';
import InsightsScreen from './screens/InsightsScreen';
import ChatScreen from './screens/ChatScreen';
import MerchantLoginScreen from './screens/MerchantLoginScreen';
import MerchantSelectScreen from './screens/MerchantSelectScreen';
// Contexts
import { ThemeProvider } from './contexts/ThemeContext';
// Constants
const COLORS = {
  GREEN: '#00B14F',
  DARK_GREEN: '#00833B',
  BLACK: '#1C1C1C',
  LIGHT_GREY: '#F7F7F7',
};
const Stack = createStackNavigator();
const AppNavigator = () => (
  <Stack.Navigator
    initialRouteName="MerchantLogin"
    screenOptions={{
      headerStyle: {
        backgroundColor: COLORS.GREEN,
        elevation: 0,
        shadowOpacity: 0,
      },
      headerTintColor: '#fff',
      headerTitleStyle: {
        fontWeight: 'bold',
        fontSize: 18,
      },
      cardStyle: { backgroundColor: COLORS.LIGHT_GREY },
      headerBackTitleVisible: false,
    }}
  >
    <Stack.Screen
      name="MerchantLogin"
      component={MerchantLoginScreen}
      options={{ headerShown: false }}
    />
    <Stack.Screen
      name="MerchantSelect"
      component={MerchantSelectScreen}
      options={{
        title: 'Select Your Store',
        headerLeft: () => null,
      }}
    />
    <Stack.Screen
      name="Home"
      component={HomeScreen}
      options={({ route }) => ({
        title: route.params?.merchantName || 'Dashboard',
        headerLeft: () => null,
      })}
    />
    <Stack.Screen
      name="SalesReport"
      component={SalesReportScreen}
      options={{ title: 'Sales Performance' }}
    />
    <Stack.Screen
      name="Products"
      component={ProductsScreen}
      options={{ title: 'Menu Management' }}
    />
    <Stack.Screen
      name="Insights"
      component={InsightsScreen}
      options={{ title: 'Business Insights' }}
    />
    <Stack.Screen
      name="Chat"
      component={ChatScreen}
      options={{
        title: 'Grab Assistant',
        headerStyle: {
          backgroundColor: COLORS.GREEN,
        },
      }}
    />
  </Stack.Navigator>
);
const App = () => {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <StatusBar backgroundColor={COLORS.GREEN} barStyle="light-content" />
          <NavigationContainer>
            <AppNavigator />
          </NavigationContainer>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};
export default App;