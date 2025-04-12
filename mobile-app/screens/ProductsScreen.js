import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator } from 'react-native';
import axios from 'axios';

// Replace with your API server address
const API_URL = 'http://192.168.68.114:5000';
const MERCHANT_ID = 1; // Default merchant ID for demo

export default function ProductsScreen() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/merchant/${MERCHANT_ID}/products/top`);
      setProducts(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching products data:', err);
      setError('Failed to load products data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4caf50" />
        <Text style={styles.loadingText}>Loading products data...</Text>
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

  const renderProductItem = ({ item, index }) => (
    <View style={styles.productItem}>
      <View style={styles.rankContainer}>
        <Text style={styles.rankText}>{index + 1}</Text>
      </View>
      <View style={styles.productDetails}>
        <Text style={styles.productName}>{item.name}</Text>
        <Text style={styles.productCategory}>{item.category}</Text>
        <View style={styles.statsRow}>
          <Text style={styles.productStat}>Sold: {item.quantity_sold} units</Text>
          <Text style={styles.productStat}>Revenue: ${item.revenue.toFixed(2)}</Text>
        </View>
      </View>
    </View>
  );

  // Calculate total revenue and quantities
  const totalRevenue = products.reduce((sum, product) => sum + product.revenue, 0);
  const totalQuantity = products.reduce((sum, product) => sum + product.quantity_sold, 0);

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Top Selling Products</Text>
        <Text style={styles.subHeaderText}>Total Revenue: ${totalRevenue.toFixed(2)}</Text>
      </View>
      
      <View style={styles.summaryContainer}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{products.length}</Text>
          <Text style={styles.summaryLabel}>Products</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>{totalQuantity}</Text>
          <Text style={styles.summaryLabel}>Units Sold</Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryValue}>${(totalRevenue / totalQuantity).toFixed(2)}</Text>
          <Text style={styles.summaryLabel}>Avg Unit Price</Text>
        </View>
      </View>
      
      <FlatList
        data={products}
        renderItem={renderProductItem}
        keyExtractor={item => item.item_id.toString()}
        contentContainerStyle={styles.listContainer}
      />
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
  summaryContainer: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  listContainer: {
    paddingBottom: 16,
  },
  productItem: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderRadius: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  rankContainer: {
    width: 36,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  },
  productDetails: {
    flex: 1,
    padding: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  productCategory: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  productStat: {
    fontSize: 12,
    color: '#444',
  },
});