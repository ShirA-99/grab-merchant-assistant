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
    async function loadData() {
      const s = await fetchData(`/merchant/${merchantId}/summary`);
      const i = await fetchData(`/merchant/${merchantId}/items/performance?days=30`);
      const t = await fetchData(`/merchant/${merchantId}/sales/daily?days=7`);
      if (s) setSummary(s);
      if (i) setItems(i.items.slice(0, 3));
      if (t) setSalesTrend(t);
    }
    loadData();
  }, []);

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

      {summary && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Today’s Revenue</Text>
          <Text style={styles.cardValue}>RM {summary.today_sales.toFixed(2)}</Text>
          <Text style={styles.subtext}>{summary.today_orders} orders today</Text>
        </View>
      )}

      {salesTrend.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sales Trend (Last 7 Days)</Text>
          <LineChart
            data={{
              labels: salesTrend.map(d => d.date.slice(5)),
              datasets: [{
                data: salesTrend.map(d => d.sales)
              }]
            }}
            width={screenWidth - 40}
            height={180}
            chartConfig={{
              backgroundColor: '#00b14f',
              backgroundGradientFrom: '#e9ffe8',
              backgroundGradientTo: '#e9ffe8',
              color: () => '#00b14f',
              labelColor: () => '#333',
            }}
            bezier
            style={styles.chartStyle}
          />
        </View>
      )}

      {items.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Top-Selling Items</Text>
          {items.map(item => (
            <View key={item.item_id} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemValue}>RM {item.revenue.toFixed(2)}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity style={styles.askBtn}>
        <Text style={styles.askBtnText}>Ask your assistant</Text>
      </TouchableOpacity>
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
