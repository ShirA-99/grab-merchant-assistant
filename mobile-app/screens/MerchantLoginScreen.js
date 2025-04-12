import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';

export default function MerchantLoginScreen({ navigation }) {
  const [merchants, setMerchants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  /**
   * Fetch the list of merchants from the backend API.
   * On success, populate merchant list.
   * On failure, show error alert.
   */
  const fetchMerchants = async () => {
    try {
      setLoading(true);
      const res = await fetch('http://192.168.68.114/api/merchants'); // Update IP for real device if needed
      const json = await res.json();

      if (json?.merchants?.length > 0) {
        setMerchants(json.merchants);
      } else {
        Alert.alert('No merchants found', 'Make sure your database is properly populated.');
        setMerchants([]);
      }
    } catch (err) {
      console.error('API Error:', err);
      Alert.alert('Connection Error', 'Unable to fetch merchant data. Please check your connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMerchants();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMerchants();
  };

  /**
   * Renders an individual merchant card.
   * @param {object} item - Merchant info containing name and ID
   */
  const renderMerchant = ({ item }) => (
    <TouchableOpacity
      style={styles.merchantCard}
      onPress={() => navigation.navigate('Home', {
        merchantId: item.merchant_id,
        merchantName: item.name // pass name to be used in App.js header
      })}
      activeOpacity={0.85}
    >
      <Image source={require('../assets/storefront.png')} style={styles.icon} />
      <View>
        <Text style={styles.merchantName}>{item.name}</Text>
        <Text style={styles.merchantId}>ID: {item.merchant_id}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Image source={require('../assets/grab-logo.png')} style={styles.logo} />
      <Text style={styles.title}>Welcome to Grab Merchant Assistant</Text>
      <Text style={styles.subtitle}>Select your merchant account to continue:</Text>

      {loading ? (
        <ActivityIndicator size="large" color="#00b14f" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={merchants}
          keyExtractor={(item) => item.merchant_id}
          renderItem={renderMerchant}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={() => (
            <Text style={styles.emptyText}>No merchant accounts found.</Text>
          )}
        />
      )}

      <View style={styles.footer}>
        <Text style={styles.footerText}>© 2025 • Powered by Grab • UMHackathon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f4fff4',
    padding: 20,
    paddingTop: 60,
  },
  logo: {
    width: 180,
    height: 60,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00b14f',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#444',
    textAlign: 'center',
    marginBottom: 15,
  },
  merchantCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    padding: 16,
    marginVertical: 8,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  icon: {
    width: 48,
    height: 48,
    marginRight: 16,
    tintColor: '#00b14f',
  },
  merchantName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#222',
  },
  merchantId: {
    fontSize: 13,
    color: '#777',
  },
  footer: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#888',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
    color: '#999',
  },
});
