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
  ActivityIndicator
} from 'react-native';
import { Card } from 'react-native-paper';
import axios from 'axios';

const API_URL = 'http://192.168.68.114:5000';

const MerchantLoginScreen = ({ navigation }) => {
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
      navigation.navigate('Home', { merchantId: merchantId });
      
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
      style={styles.container}
    >
      <View style={styles.content}>
        <Card style={styles.card}>
          <Card.Title 
            title="Merchant Assistant" 
            subtitle="Please enter your Merchant ID to continue" 
          />
          <Card.Content>
            <TextInput
              style={styles.input}
              placeholder="Enter Merchant ID (e.g., M001)"
              value={merchantId}
              onChangeText={setMerchantId}
              autoCapitalize="characters"
            />
            
            <TouchableOpacity
              style={styles.button}
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
              <Text style={styles.secondaryButtonText}>
                View Available Merchants
              </Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    padding: 10,
    elevation: 4,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    marginVertical: 15,
    paddingHorizontal: 15,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#4285F4',
    borderRadius: 5,
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
    color: '#4285F4',
    fontSize: 14,
  }
});

export default MerchantLoginScreen;