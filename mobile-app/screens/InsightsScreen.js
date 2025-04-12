import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import axios from 'axios';

// API configuration - update to match your Flask server
const API_URL = 'http://192.168.68.114:5000/api';

export default function InsightsScreen({ navigation, route }) {
  // Get merchant_id from route params if available, otherwise use default
  const merchantId = route.params?.merchantId || 1;
  
  const [insights, setInsights] = useState([]);
  const [merchantData, setMerchantData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMerchantSummary();
    generateInsights();
  }, [merchantId]);

  const fetchMerchantSummary = async () => {
    try {
      const response = await axios.get(`${API_URL}/merchant/${merchantId}/summary`);
      setMerchantData(response.data);
    } catch (err) {
      console.error('Error fetching merchant summary:', err);
      // Don't set error state here as we'll handle it in generateInsights
    }
  };

  // Since your API doesn't have a direct insights endpoint, we'll generate insights
  // from available data in the summary and daily sales endpoints
  const generateInsights = async () => {
    try {
      setLoading(true);
      
      // Fetch merchant summary data
      const summaryResponse = await axios.get(`${API_URL}/merchant/${merchantId}/summary`);
      const summaryData = summaryResponse.data;
      
      // Fetch daily sales data
      const dailySalesResponse = await axios.get(`${API_URL}/merchant/${merchantId}/sales/daily`);
      const dailySalesData = dailySalesResponse.data;
      
      // Generate insights based on fetched data
      const generatedInsights = [];
      
      // Insight 1: Sales trend
      if (dailySalesData && dailySalesData.length >= 2) {
        const recentDays = dailySalesData.slice(-7); // Last 7 days
        
        // Calculate trend
        let increasing = 0;
        let decreasing = 0;
        
        for (let i = 1; i < recentDays.length; i++) {
          if (recentDays[i].sales > recentDays[i-1].sales) {
            increasing++;
          } else if (recentDays[i].sales < recentDays[i-1].sales) {
            decreasing++;
          }
        }
        
        if (increasing > decreasing) {
          generatedInsights.push({
            title: 'Sales Trend Positive',
            description: `Your sales are trending upward over the last ${recentDays.length} days. Keep up the good work!`,
            type: 'positive'
          });
        } else if (decreasing > increasing) {
          generatedInsights.push({
            title: 'Sales Trend Negative',
            description: `Your sales are trending downward over the last ${recentDays.length} days. Consider promotions to boost revenue.`,
            type: 'negative'
          });
        } else {
          generatedInsights.push({
            title: 'Sales Trend Stable',
            description: `Your sales have been relatively stable over the last ${recentDays.length} days.`,
            type: 'info'
          });
        }
      }
      
      // Insight 2: Transaction value analysis
      if (summaryData && summaryData.avg_transaction_value) {
        if (summaryData.avg_transaction_value > 50) {
          generatedInsights.push({
            title: 'High Average Order Value',
            description: `Your average order value is $${summaryData.avg_transaction_value.toFixed(2)}, which is good! Consider upselling complementary products to increase this further.`,
            type: 'positive'
          });
        } else if (summaryData.avg_transaction_value < 20) {
          generatedInsights.push({
            title: 'Low Average Order Value',
            description: `Your average order value is $${summaryData.avg_transaction_value.toFixed(2)}. Consider bundling products or offering premium options to increase this.`,
            type: 'warning'
          });
        } else {
          generatedInsights.push({
            title: 'Average Order Value',
            description: `Your average order value is $${summaryData.avg_transaction_value.toFixed(2)}.`,
            type: 'info'
          });
        }
      }
      
      // Insight 3: Business activity
      if (summaryData && summaryData.active_days) {
        const daysPercentage = (summaryData.active_days / 30) * 100;
        
        if (daysPercentage < 70) {
          generatedInsights.push({
            title: 'Business Activity',
            description: `You've been active on ${summaryData.active_days} days in the last month. Consider operating more consistently to increase your overall revenue.`,
            type: 'warning'
          });
        } else {
          generatedInsights.push({
            title: 'Consistent Business Activity',
            description: `You've been active on ${summaryData.active_days} days in the last month, showing good consistency in your operations.`,
            type: 'positive'
          });
        }
      }
      
      // Insight 4: General business health
      if (summaryData && summaryData.total_sales && summaryData.transaction_count) {
        generatedInsights.push({
          title: 'Business Health',
          description: `With ${summaryData.transaction_count} transactions totaling $${summaryData.total_sales.toFixed(2)}, your business shows ${summaryData.total_sales > 5000 ? 'strong' : 'moderate'} activity.`,
          type: summaryData.total_sales > 5000 ? 'positive' : 'info'
        });
      }

      // Insight 5: Transaction frequency
      if (dailySalesData && dailySalesData.length > 0) {
        const totalTransactions = dailySalesData.reduce((sum, day) => sum + day.transactions, 0);
        const avgTransactionsPerDay = totalTransactions / dailySalesData.length;
        
        if (avgTransactionsPerDay < 5) {
          generatedInsights.push({
            title: 'Low Transaction Frequency',
            description: `You're averaging ${avgTransactionsPerDay.toFixed(1)} transactions per day. Consider marketing to increase customer visits.`,
            type: 'warning'
          });
        } else if (avgTransactionsPerDay > 20) {
          generatedInsights.push({
            title: 'High Transaction Volume',
            description: `Great job! You're averaging ${avgTransactionsPerDay.toFixed(1)} transactions per day.`,
            type: 'positive'
          });
        }
      }
      
      setInsights(generatedInsights);
      setError(null);
    } catch (err) {
      console.error('Error generating insights:', err);
      setError('Failed to generate insights. Please try again.');
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
        <Text style={styles.loadingText}>Analyzing your business data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={generateInsights}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Business Insights</Text>
        {merchantData && (
          <Text style={styles.subHeaderText}>For {merchantData.name}</Text>
        )}
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
        <TouchableOpacity style={styles.refreshButton} onPress={generateInsights}>
          <Text style={styles.refreshButtonText}>Refresh Insights</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.navigate('ChatScreen', { merchantId })}
        >
          <Text style={styles.backButtonText}>Return to Assistant</Text>
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
    fontSize: 16,
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
    fontSize: 16,
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
    paddingTop: Platform.OS === 'ios' ? 40 : 0,
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
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
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
    fontSize: 16,
  },
  refreshContainer: {
    marginHorizontal: 16,
    marginBottom: 16,
  },
  refreshButton: {
    backgroundColor: '#4caf50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  refreshButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  backButton: {
    backgroundColor: '#2196f3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  backButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  }
});