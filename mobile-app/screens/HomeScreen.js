import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';

// Replace with your API server address
const API_URL = 'http://192.168.68.114:5000/api';
const MERCHANT_ID = '3e2b6'; // Your actual merchant ID

export default function HomeScreen({ navigation }) {
  const [merchantData, setMerchantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMerchantData();
  }, []);

  const fetchMerchantData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/merchant/${MERCHANT_ID}/summary`);
      setMerchantData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching merchant data:', err.response?.data || err.message);
      setError('Failed to load merchant data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#4caf50" />
        <Text style={styles.loadingText}>Loading merchant data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.button} onPress={fetchMerchantData}>
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.merchantCard}>
        <Text style={styles.merchantName}>{merchantData.name}</Text>
        <Text style={styles.merchantDetails}>
          {merchantData.city_id ? `City ID: ${merchantData.city_id}` : ''} • Joined: {merchantData.join_date}
        </Text>
        
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>${merchantData.total_sales.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total Sales</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{merchantData.transaction_count}</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </View>
          
          <View style={styles.statItem}>
            <Text style={styles.statValue}>${merchantData.avg_transaction_value.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Avg Value</Text>
          </View>
        </View>
      </View>

      <View style={styles.menuContainer}>
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => navigation.navigate('Chat')}
        >
          <Text style={styles.menuItemText}>Chat with Assistant</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => navigation.navigate('SalesReport')}
        >
          <Text style={styles.menuItemText}>Sales Report</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => navigation.navigate('Products')}
        >
          <Text style={styles.menuItemText}>Top Products</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.menuItem} 
          onPress={() => navigation.navigate('Insights')}
        >
          <Text style={styles.menuItemText}>Business Insights</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  merchantCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
  },
  merchantName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  merchantDetails: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  menuContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    elevation: 2,
  },
  menuItem: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  menuItemText: {
    fontSize: 16,
  },
  button: {
    backgroundColor: '#4caf50',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});