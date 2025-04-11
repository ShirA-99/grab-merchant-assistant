import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';

// Replace with your API server address
const API_URL = 'http://192.168.68.114:5000/api';
const MERCHANT_ID = 1; // Default merchant ID for demo

export default function InsightsScreen({ navigation }) {
  const [insights, setInsights] = useState([]);
  const [merchantName, setMerchantName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/merchant/${MERCHANT_ID}/insights`);
      setInsights(response.data.insights);
      setMerchantName(response.data.merchant_name);
      setError(null);
    } catch (err) {
      console.error('Error fetching insights:', err);
      setError('Failed to load insights. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getInsightTypeColor = (type) => {
    switch (type) {
      case 'positive':
        return '#4caf50';
      case 'negative':
        return '#f44336';
      case 'warning':
        return '#ff9800';
      case 'info':
      default:
        return '#2196f3';
    }
  };

  const getInsightTypeIcon = (type) => {
    switch (type) {
      case 'positive':
        return '↑';
      case 'negative':
        return '↓';
      case 'warning':
        return '!';
      case 'info':
      default:
        return 'i';
    }
  };

  const renderInsightItem = ({ item }) => (
    <View style={styles.insightItem}>
      <View 
        style={[
          styles.insightIconContainer, 
          { backgroundColor: getInsightTypeColor(item.type) }
        ]}
      >
        <Text style={styles.insightIcon}>{getInsightTypeIcon(item.type)}</Text>
      </View>
      <View style={styles.insightContent}>
        <Text style={styles.insightTitle}>{item.title}</Text>
        <Text style={styles.insightDescription}>{item.description}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4caf50" />
        <Text style={styles.loadingText}>Generating insights...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchInsights}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Business Insights</Text>
        <Text style={styles.subHeaderText}>For {merchantName}</Text>
      </View>
      
      {insights.length > 0 ? (
        <FlatList
          data={insights}
          renderItem={renderInsightItem}
          keyExtractor={(item, index) => index.toString()}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={styles.noInsightsContainer}>
          <Text style={styles.noInsightsText}>
            No insights available yet. We're still collecting data to provide meaningful insights.
          </Text>
        </View>
      )}
      
      <View style={styles.refreshContainer}>
        <TouchableOpacity style={styles.refreshButton} onPress={fetchInsights}>
          <Text style={styles.refreshButtonText}>Refresh Insights</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 4,
  },
  retryButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  headerContainer: {
    marginBottom: 16,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subHeaderText: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  listContainer: {
    paddingBottom: 16,
  },
  insightItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  insightIconContainer: {
    width: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  insightIcon: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  insightContent: {
    flex: 1,
    padding: 12,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  insightDescription: {
    fontSize: 14,
    color: '#444',
    lineHeight: 20,
  },
  noInsightsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noInsightsText: {
    textAlign: 'center',
    color: '#666',
  },
  refreshContainer: {
    margin: 16,
  },
  refreshButton: {
    backgroundColor: '#4caf50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
});