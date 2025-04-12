import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';
import { fetchData } from '../utils.js/api';

const screenWidth = Dimensions.get('window').width;

export default function HomeScreen({ route }) {
  const merchantId = route.params?.merchantId || 'M0001';
  const [summary, setSummary] = useState(null);
  const [items, setItems] = useState([]);
  const [salesTrend, setSalesTrend] = useState([]);

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
    <ScrollView style={styles.container}>
      <View style={styles.assistantCard}>
        <Image source={require('../assets/assistant.png')} style={styles.assistantIcon} />
        <View style={styles.bubble}>
          <Text style={styles.bubbleText}>
            {summary ? `Your sales peaked at RM ${summary.today_sales} today\nTop item: ${items[0]?.name}` : 'Loading insights...'}
          </Text>
        </View>
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
}

const styles = StyleSheet.create({
  container: { backgroundColor: '#f9f9f9', padding: 20 },
  assistantCard: { flexDirection: 'row', marginBottom: 20, alignItems: 'center' },
  assistantIcon: { width: 64, height: 64, marginRight: 10 },
  bubble: { flex: 1, backgroundColor: '#e1fce9', borderRadius: 12, padding: 10 },
  bubbleText: { color: '#007e3a', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16, shadowColor: '#ccc', shadowOpacity: 0.2, shadowRadius: 4 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#333' },
  cardValue: { fontSize: 28, fontWeight: 'bold', color: '#00b14f', marginVertical: 4 },
  subtext: { fontSize: 13, color: '#666' },
  chartStyle: { borderRadius: 12, marginTop: 10 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  itemName: { fontSize: 15, color: '#333' },
  itemValue: { fontSize: 15, color: '#00b14f' },
  askBtn: { backgroundColor: '#00b14f', borderRadius: 30, paddingVertical: 12, alignItems: 'center', marginTop: 10 },
  askBtnText: { color: '#fff', fontWeight: 'bold' }
});
