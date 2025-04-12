import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  RefreshControl,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import { FontAwesome5 } from '@expo/vector-icons';
import axios from 'axios';
import { Dimensions } from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { useTheme } from '../contexts/ThemeContext';

const API_URL = 'http://192.168.68.114:5000';

const HomeScreen = ({ navigation, route }) => {
  const theme = useTheme();
  const { merchantId } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [merchantData, setMerchantData] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [salesError, setSalesError] = useState(null);
  const [selectedMerchant, setSelectedMerchant] = useState(merchantId || null);

  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    if (route.params?.merchantId) {
      setSelectedMerchant(route.params.merchantId);
    }
  }, [route.params?.merchantId]);

  useEffect(() => {
    if (selectedMerchant) {
      loadMerchantData();
      loadSalesData();
    } else {
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

  // Mock yearly sales data instead of monthly
  const getYearlySalesData = () => {
    // Create mock data for yearly visualization
    return {
      labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
      datasets: [
        {
          data: [
            25000, 28000, 32000, 30000, 35000, 42000, 
            38000, 42000, 48000, 50000, 55000, 60000
          ],
          color: (opacity = 1) => `rgba(0, 177, 79, ${opacity})`, // Grab green
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
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading merchant data...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh} 
          colors={[theme.colors.primary]} 
        />
      }
    >
      {/* Merchant Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.merchantInfoContainer}>
          <Text style={styles.merchantName}>{merchantData?.name || 'Merchant'}</Text>
          <Text style={styles.merchantId}>ID: {merchantData?.merchant_id || 'Unknown'}</Text>
          <Text style={styles.joinDate}>Member since: {merchantData?.join_date || 'Unknown'}</Text>
        </View>
        <TouchableOpacity 
          style={styles.changeMerchantButton} 
          onPress={changeMerchant}
        >
          <Ionicons name="swap-horizontal-outline" size={20} color="white" />
          <Text style={styles.changeMerchantText}>Change</Text>
        </TouchableOpacity>
      </View>

      {/* Today's Performance Summary */}
      <Card style={styles.summaryCard}>
        <Card.Content>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Today's Performance</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {formatCurrency(merchantData?.today_sales || 0)}
              </Text>
              <Text style={styles.statLabel}>Today's Sales</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {merchantData?.today_orders || 0}
              </Text>
              <Text style={styles.statLabel}>Orders</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.colors.primary }]}>
                {merchantData?.today_orders > 0 
                  ? formatCurrency(merchantData.today_sales / merchantData.today_orders) 
                  : '$0.00'}
              </Text>
              <Text style={styles.statLabel}>Avg. Order</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Yearly Sales Chart */}
      <Card style={styles.chartCard}>
        <Card.Content>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>2025 Sales Performance</Text>
          <View style={styles.chartContainer}>
            <LineChart
              data={getYearlySalesData()}
              width={screenWidth - 40}
              height={220}
              yAxisLabel="$"
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: theme.colors.background,
                backgroundGradientFrom: theme.colors.background,
                backgroundGradientTo: theme.colors.background,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(0, 177, 79, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(28, 28, 28, ${opacity})`,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: '4',
                  strokeWidth: '2',
                  stroke: theme.colors.primary
                }
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
            />
          </View>
          <TouchableOpacity 
            style={[styles.viewDetailsButton, { backgroundColor: theme.colors.primary }]}
            onPress={navigateToSalesReport}
          >
            <Text style={styles.viewDetailsText}>View Full Report</Text>
            <Ionicons name="arrow-forward" size={16} color="white" />
          </TouchableOpacity>
        </Card.Content>
      </Card>

      {/* Business Metrics */}
      <Card style={styles.statsCard}>
        <Card.Content>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Business Metrics</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statGridItem, { backgroundColor: theme.colors.background }]}>
              <FontAwesome5 name="dollar-sign" size={18} color={theme.colors.primary} style={styles.statIcon} />
              <Text style={[styles.statGridValue, { color: theme.colors.primary }]}>
                {formatCurrency(merchantData?.avg_transaction_value || 0)}
              </Text>
              <Text style={styles.statGridLabel}>Avg. Order Value</Text>
            </View>
            <View style={[styles.statGridItem, { backgroundColor: theme.colors.background }]}>
              <FontAwesome5 name="calendar-check" size={18} color={theme.colors.primary} style={styles.statIcon} />
              <Text style={[styles.statGridValue, { color: theme.colors.primary }]}>
                {merchantData?.active_days || 0}
              </Text>
              <Text style={styles.statGridLabel}>Active Days</Text>
            </View>
            <View style={[styles.statGridItem, { backgroundColor: theme.colors.background }]}>
              <FontAwesome5 name="chart-line" size={18} color={theme.colors.primary} style={styles.statIcon} />
              <Text style={[styles.statGridValue, { color: theme.colors.primary }]}>
                {formatCurrency((merchantData?.total_sales || 0) / (merchantData?.active_days || 1))}
              </Text>
              <Text style={styles.statGridLabel}>Daily Sales Avg</Text>
            </View>
            <View style={[styles.statGridItem, { backgroundColor: theme.colors.background }]}>
              <FontAwesome5 name="shopping-bag" size={18} color={theme.colors.primary} style={styles.statIcon} />
              <Text style={[styles.statGridValue, { color: theme.colors.primary }]}>
                {((merchantData?.transaction_count || 0) / (merchantData?.active_days || 1)).toFixed(1)}
              </Text>
              <Text style={styles.statGridLabel}>Orders per Day</Text>
            </View>
          </View>
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <Card style={styles.actionsCard}>
        <Card.Content>
          <Text style={[styles.cardTitle, { color: theme.colors.text }]}>Quick Actions</Text>
          <View style={styles.actionButtonsContainer}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: `${theme.colors.primary}10` }]} 
              onPress={navigateToSalesReport}
            >
              <Ionicons name="bar-chart-outline" size={24} color={theme.colors.primary} />
              <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>Sales Report</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: `${theme.colors.primary}10` }]} 
              onPress={navigateToInsights}
            >
              <Ionicons name="bulb-outline" size={24} color={theme.colors.primary} />
              <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>Insights</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: `${theme.colors.primary}10` }]} 
              onPress={navigateToProducts}
            >
              <Ionicons name="fast-food-outline" size={24} color={theme.colors.primary} />
              <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>Menu Items</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: `${theme.colors.primary}10` }]} 
              onPress={navigateToChat}
            >
              <Ionicons name="chatbubble-ellipses-outline" size={24} color={theme.colors.primary} />
              <Text style={[styles.actionButtonText, { color: theme.colors.primary }]}>Grab Assistant</Text>
            </TouchableOpacity>
          </View>
        </Card.Content>
      </Card>

      {/* Grab Promo Banner */}
      <Card style={styles.promoCard}>
        <Card.Content style={styles.promoContent}>
          <View style={styles.promoTextContainer}>
            <Text style={styles.promoTitle}>Increase your visibility</Text>
            <Text style={styles.promoDescription}>
              Join Grab Preferred Merchants Program and boost your sales by 30%
            </Text>
            <TouchableOpacity 
              style={[styles.promoButton, { backgroundColor: theme.colors.secondary }]}
            >
              <Text style={styles.promoButtonText}>Learn More</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.promoImageContainer}>
            <FontAwesome5 name="store" size={50} color={theme.colors.primary} />
          </View>
        </Card.Content>
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#555',
  },
  header: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  summaryCard: {
    margin: 10,
    elevation: 2,
    borderRadius: 12,
  },
  chartCard: {
    margin: 10,
    elevation: 2,
    borderRadius: 12,
    paddingVertical: 10,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  statsCard: {
    margin: 10,
    elevation: 2,
    borderRadius: 12,
  },
  actionsCard: {
    margin: 10,
    elevation: 2,
    borderRadius: 12,
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
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.18,
    shadowRadius: 1.0,
    elevation: 1,
  },
  statIcon: {
    marginBottom: 10,
  },
  statGridValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statGridLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    width: '48%',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionButtonText: {
    marginTop: 8,
    fontWeight: '500',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginVertical: 10,
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 10,
  },
  viewDetailsText: {
    color: 'white',
    fontWeight: '500',
    marginRight: 8,
  },
  promoCard: {
    margin: 10,
    marginBottom: 20,
    borderRadius: 12,
    elevation: 2,
  },
  promoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  promoTextContainer: {
    flex: 3,
  },
  promoImageContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  promoDescription: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  promoButton: {
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  promoButtonText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 12,
  }
});

export default HomeScreen;