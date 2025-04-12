import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity 
} from 'react-native';
import { Card } from 'react-native-paper';

const MerchantSelectScreen = ({ navigation, route }) => {
  const { merchants } = route.params || { merchants: [] };

  const selectMerchant = (merchantId) => {
    navigation.navigate('Home', { merchantId });
  };

  const renderMerchantItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.merchantItem}
      onPress={() => selectMerchant(item.merchant_id)}
    >
      <Text style={styles.merchantName}>{item.name}</Text>
      <Text style={styles.merchantId}>ID: {item.merchant_id}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <Card.Title title="Select a Merchant" />
        <Card.Content>
          {merchants.length > 0 ? (
            <FlatList
              data={merchants}
              renderItem={renderMerchantItem}
              keyExtractor={item => item.merchant_id}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            <Text style={styles.noData}>No merchants available</Text>
          )}
          
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </Card.Content>
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  card: {
    flex: 1,
    padding: 10,
    elevation: 4,
  },
  merchantItem: {
    paddingVertical: 15,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  merchantId: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#ddd',
  },
  noData: {
    textAlign: 'center',
    padding: 20,
    color: '#666',
  },
  backButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 20,
    backgroundColor: '#f0f7ff',
    borderRadius: 5,
  },
  backButtonText: {
    color: '#4285F4',
    fontSize: 16,
  }
});

export default MerchantSelectScreen;