import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';

const API_URL = 'http://192.168.68.114:5000'; // Removed the /api suffix

const HomeScreen = ({ navigation, route }) => {
  // Get merchant ID from route params or use null
  const { merchantId } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [merchantData, setMerchantData] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [salesError, setSalesError] = useState(null);
  const [selectedMerchant, setSelectedMerchant] = useState(merchantId || null);

  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    // If we have a merchantId from navigation params, update selected merchant
    if (route.params?.merchantId) {
      setSelectedMerchant(route.params.merchantId);
    }
  }, [route.params?.merchantId]);

  useEffect(() => {
    // Only load data if we have a selected merchant
    if (selectedMerchant) {
      loadMerchantData();
      loadSalesData();
    } else {
      // If no merchant is selected, redirect to login screen
      navigation.replace('MerchantLogin');
    }
  }, [selectedMerchant]);

  const loadMerchantData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/merchant/${selectedMerchant}/summary`);
      setMerchantData(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching merchant data:', error);
      setLoading(false);
      Alert.alert(
        'Error',
        'Could not load merchant data. Please try again later.',
        [{ text: 'OK' }]
      );
    }
  };

  const loadSalesData = async () => {
    try {
      // Use the /api prefix in the URL to match the backend route definition
      const response = await axios.get(`${API_URL}/api/merchant/${selectedMerchant}/sales/daily?days=30`);
      setSalesData(response.data);
      setSalesError(null);
    } catch (error) {
      console.error('Error fetching sales data:', error);
      setSalesError('Could not load sales data');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadMerchantData(), loadSalesData()]);
    setRefreshing(false);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getChartData = () => {
    if (!salesData || salesData.length === 0) {
      return {
        labels: ["No Data"],
        datasets: [{ data: [0] }]
      };
    }
  
    // Group data by month
    const monthlyData = {};
    salesData.forEach(item => {
      const date = new Date(item.date);
      const monthKey = date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = 0;
      }
      monthlyData[monthKey] += item.sales;
    });
  
    // Convert to arrays for chart
    const labels = Object.keys(monthlyData);
    const data = Object.values(monthlyData);
  
    return {
      labels: labels,
      datasets: [
        {
          data: data,
          color: (opacity = 1) => `rgba(66, 133, 244, ${opacity})`,
          strokeWidth: 2
        }
      ]
    };
  };

  const changeMerchant = () => {
    navigation.navigate('MerchantLogin');
  };

  const navigateToInsights = () => {
    navigation.navigate('Insights', { merchantId: selectedMerchant });
  };

  const navigateToProducts = () => {
    navigation.navigate('Products', { merchantId: selectedMerchant });
  };

  const navigateToSalesReport = () => {
    navigation.navigate('SalesReport', { merchantId: selectedMerchant });
  };

  const navigateToChat = () => {
    navigation.navigate('Chat', { merchantId: selectedMerchant });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4285F4" />
        <Text style={styles.loadingText}>Loading merchant data...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Merchant Header */}
      <View style={styles.header}>
        <View style={styles.merchantInfoContainer}>
          <Text style={styles.merchantName}>{merchantData?.name || 'Merchant'}</Text>
          <Text style={styles.merchantId}>ID: {merchantData?.merchant_id || 'Unknown'}</Text>
          <Text style={styles.joinDate}>Member since: {merchantData?.join_date || 'Unknown'}</Text>
        </View>
        <TouchableOpacity style={styles.changeMerchantButton} onPress={changeMerchant}>
          <Ionicons name="swap-horizontal-outline" size={20} color="white" />
          <Text style={styles.changeMerchantText}>Change</Text>
        </TouchableOpacity>
      </View>

      {/* Monthly Performance Summary (replacing Today's summary) */}
      <Card style={styles.summaryCard}>
        <Card.Title title="Monthly Performance" />
        <Card.Content>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatCurrency(merchantData?.total_sales || 0)}</Text>
              <Text style={styles.statLabel}>Total Revenue</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{merchantData?.transaction_count || 0}</Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {merchantData?.transaction_count > 0 
                  ? formatCurrency(merchantData.total_sales / merchantData.transaction_count) 
                  : '$0.00'}
              </Text>
              <Text style={styles.statLabel}>Avg. Order</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Monthly Sales Chart */}
      <Card style={styles.chartCard}>
        <Card.Title title="Monthly Sales"/>
        <Card.Content>
          {salesError ? (
            <Text style={styles.errorText}>{salesError}</Text>
          ) : salesData.length > 0 ? (
            <LineChart
              data={getChartData()}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                backgroundColor: '#ffffff',
                backgroundGradientFrom: '#ffffff',
                backgroundGradientTo: '#ffffff',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(66, 133, 244, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: '6',
                  strokeWidth: '2',
                  stroke: '#4285F4'
                }
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
            />
          ) : (
            <ActivityIndicator size="large" color="#4285F4" />
          )}
        </Card.Content>
      </Card>

      {/* Overall Statistics */}
      <Card style={styles.statsCard}>
        <Card.Title title="Business Metrics" />
        <Card.Content>
          <View style={styles.statsGrid}>
            <View style={styles.statGridItem}>
              <Text style={styles.statGridValue}>{formatCurrency(merchantData?.avg_transaction_value || 0)}</Text>
              <Text style={styles.statGridLabel}>Avg. Order Value</Text>
            </View>
            <View style={styles.statGridItem}>
              <Text style={styles.statGridValue}>{merchantData?.active_days || 0}</Text>
              <Text style={styles.statGridLabel}>Active Days</Text>
            </View>
            <View style={styles.statGridItem}>
              <Text style={styles.statGridValue}>{formatCurrency((merchantData?.total_sales || 0) / (merchantData?.active_days || 1))}</Text>
              <Text style={styles.statGridLabel}>Avg. Daily Sales</Text>
            </View>
            <View style={styles.statGridItem}>
              <Text style={styles.statGridValue}>{formatCurrency((merchantData?.transaction_count || 0) / (merchantData?.active_days || 1))}</Text>
              <Text style={styles.statGridLabel}>Orders per Day</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.actionsCard}>
        <Card.Title title="Quick Actions" />
        <Card.Content>
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={navigateToSalesReport}
            >
              <Ionicons name="bar-chart-outline" size={24} color="#4285F4" />
              <Text style={styles.actionButtonText}>Sales Report</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={navigateToInsights}
            >
              <Ionicons name="bulb-outline" size={24} color="#4285F4" />
              <Text style={styles.actionButtonText}>Insights</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={navigateToProducts}
            >
              <Ionicons name="fast-food-outline" size={24} color="#4285F4" />
              <Text style={styles.actionButtonText}>Products</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.actionButton} 
              onPress={navigateToChat}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={24} color="#4285F4" />
              <Text style={styles.actionButtonText}>Assistant</Text>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  header: {
    backgroundColor: '#4285F4',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  merchantInfoContainer: {
    flex: 1,
  },
  merchantName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: 'white',
  },
  merchantId: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  joinDate: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  changeMerchantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  changeMerchantText: {
    color: 'white',
    marginLeft: 4,
    fontSize: 12,
  },
  summaryCard: {
    margin: 10,
    elevation: 4,
  },
  chartCard: {
    margin: 10,
    elevation: 4,
  },
  statsCard: {
    margin: 10,
    elevation: 4,
  },
  actionsCard: {
    margin: 10,
    elevation: 4,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statGridItem: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  statGridValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4285F4',
    marginBottom: 4,
  },
  statGridLabel: {
    fontSize: 12,
    color: '#666',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    color: '#4285F4',
    marginTop: 8,
    fontWeight: '500',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 10,
  }
});

export default HomeScreen;