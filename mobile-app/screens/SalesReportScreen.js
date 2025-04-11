import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, ScrollView, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import axios from 'axios';

// Replace with your API server address
const API_URL = 'http://192.168.68.114:5000/api';
const MERCHANT_ID = 1; // Default merchant ID for demo

export default function SalesReportScreen() {
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDailySales();
  }, []);

  const fetchDailySales = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/merchant/${MERCHANT_ID}/sales/daily`);
      setSalesData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching sales data:', err);
      setError('Failed to load sales data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4caf50" />
        <Text style={styles.loadingText}>Loading sales data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Prepare data for the chart
  const chartData = {
    labels: salesData.slice(-7).map(item => {
      const date = new Date(item.date);
      return date.getDate() + '/' + (date.getMonth() + 1);
    }),
    datasets: [
      {
        data: salesData.slice(-7).map(item => item.sales),
        color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
        strokeWidth: 2
      }
    ],
    legend: ["Last 7 days sales"]
  };

  // Calculate statistics
  const totalSales = salesData.reduce((sum, item) => sum + item.sales, 0);
  const avgSales = totalSales / salesData.length;
  const totalTransactions = salesData.reduce((sum, item) => sum + item.transactions, 0);
  
  // Find best sales day
  const bestDay = salesData.reduce((best, current) => 
    (best.sales > current.sales) ? best : current, 
    { sales: 0 });
  
  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Sales Report (Last 30 Days)</Text>
        <Text style={styles.subHeaderText}>Total Sales: ${totalSales.toFixed(2)}</Text>
      </View>
      
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Last 7 Days Sales Trend</Text>
        <LineChart
          data={chartData}
          width={Dimensions.get("window").width - 32}
          height={220}
          yAxisLabel="$"
          chartConfig={{
            backgroundColor: "#ffffff",
            backgroundGradientFrom: "#ffffff",
            backgroundGradientTo: "#ffffff",
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(76, 175, 80, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16
            }
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16
          }}
        />
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>${avgSales.toFixed(2)}</Text>
          <Text style={styles.statLabel}>Average Daily Sales</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{totalTransactions}</Text>
          <Text style={styles.statLabel}>Total Transactions</Text>
        </View>
      </View>
      
      <View style={styles.insightCard}>
        <Text style={styles.insightTitle}>Sales Insight</Text>
        <Text style={styles.insightText}>
          Your best sales day was {new Date(bestDay.date).toLocaleDateString()} with ${bestDay.sales.toFixed(2)} in sales.
        </Text>
      </View>
    </ScrollView>
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
    color: '#4caf50',
    marginTop: 4,
  },
  chartContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    flex: 1,
    marginHorizontal: 4,
    alignItems: 'center',
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
    textAlign: 'center',
  },
  insightCard: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
  },
});