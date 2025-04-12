import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image
} from 'react-native';
import { Card } from 'react-native-paper';
import axios from 'axios';
import { useTheme } from '../contexts/ThemeContext';

const API_URL = 'http://192.168.68.114:5000';

const MerchantLoginScreen = ({ navigation }) => {
  const theme = useTheme();
  const [merchantId, setMerchantId] = useState('');
  const [loading, setLoading] = useState(false);

  const validateMerchantId = async () => {
    // Basic validation
    if (!merchantId || merchantId.trim() === '') {
      Alert.alert('Error', 'Please enter a merchant ID');
      return;
    }

    setLoading(true);
    
    try {
      // Verify the merchant ID exists
      const response = await axios.get(`${API_URL}/api/merchant/${merchantId}/summary`);
      
      // If we get here, the merchant ID is valid
      setLoading(false);
      
      // Navigate to HomeScreen with the merchant ID
      navigation.navigate('Home', { 
        merchantId: merchantId,
        merchantName: response.data?.name || 'Merchant'
      });
      
    } catch (error) {
      setLoading(false);
      console.error('Error validating merchant ID:', error);
      Alert.alert(
        'Invalid Merchant ID',
        'The merchant ID you entered was not found. Please check and try again.',
        [{ text: 'OK' }]
      );
    }
  };

  const fetchMerchantList = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/merchants`);
      setLoading(false);
      
      if (response.data && response.data.merchants && response.data.merchants.length > 0) {
        // Show merchant selection dialog
        navigation.navigate('MerchantSelect', { 
          merchants: response.data.merchants 
        });
      } else {
        Alert.alert('No Merchants', 'No merchants were found in the system.');
      }
    } catch (error) {
      setLoading(false);
      console.error('Error fetching merchant list:', error);
      Alert.alert(
        'Error',
        'Could not fetch the list of merchants. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Merchant App</Text>
      </View>
      
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.logoContainer}>
              <Image 
                source={{ uri: '/api/placeholder/80/80' }} 
                style={styles.logo}
              />
            </View>
            
            <Text style={styles.title}>Welcome to Grab Merchant</Text>
            <Text style={styles.subtitle}>Enter your merchant ID to continue</Text>
            
            <TextInput
              style={[styles.input, { borderColor: theme.colors.border }]}
              placeholder="Enter Merchant ID (e.g., M001)"
              value={merchantId}
              onChangeText={setMerchantId}
              autoCapitalize="characters"
              placeholderTextColor={theme.colors.textLight}
            />
            
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.colors.primary }]}
              onPress={validateMerchantId}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Continue</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={fetchMerchantList}
              disabled={loading}
            >
              <Text style={[styles.secondaryButtonText, { color: theme.colors.primary }]}>
                View Available Merchants
              </Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2025 Grab Merchant Services</Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  header: {
    backgroundColor: '#00B14F', // Grab Green
    paddingTop: 50,
    paddingBottom: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    padding: 10,
    elevation: 4,
    borderRadius: 12,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#00B14F', // Grab Green
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#1C1C1C',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#6E6E6E',
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginVertical: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  button: {
    backgroundColor: '#00B14F', // Grab Green
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryButtonText: {
    color: '#00B14F', // Grab Green
    fontSize: 14,
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#6E6E6E',
    fontSize: 12,
  }
});

export default MerchantLoginScreen;