import React, { useState, useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import axios from 'axios';

// API configuration - update to match your Flask server
const API_URL = 'http://192.168.68.114:5000/api';
const DEFAULT_MERCHANT_ID = 1; // Default merchant ID for demo

export default function ChatScreen({ navigation, route }) {
  // Get merchant_id from route params if available, otherwise use default
  const merchantId = route.params?.merchantId || DEFAULT_MERCHANT_ID;
  
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "Hello! I'm your Grab Merchant Assistant. How can I help you today?",
      sender: 'assistant',
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [merchantInfo, setMerchantInfo] = useState(null);
  
  const flatListRef = useRef(null);

  // Fetch merchant summary on component mount
  useEffect(() => {
    fetchMerchantSummary();
  }, [merchantId]);

  const fetchMerchantSummary = async () => {
    try {
      const response = await axios.get(`${API_URL}/merchant/${merchantId}/summary`);
      setMerchantInfo(response.data);
      
      // Add merchant-specific welcome message
      if (response.data && response.data.name) {
        const welcomeMsg = {
          id: Date.now().toString(),
          text: `Welcome ${response.data.name}! I can help you check your sales data, transaction history, and more.`,
          sender: 'assistant',
        };
        setMessages(prevMessages => [...prevMessages, welcomeMsg]);
      }
    } catch (error) {
      console.error('Error fetching merchant summary:', error);
    }
  };

  const handleSend = async () => {
    if (inputMessage.trim() === '') return;
    
    const userMessage = {
      id: Date.now().toString(),
      text: inputMessage,
      sender: 'user',
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputMessage('');
    setIsLoading(true);
    
    // Process user message to determine intent
    const userIntent = determineUserIntent(inputMessage);
    
    try {
      let responseData;
      
      switch (userIntent) {
        case 'summary':
          responseData = await fetchMerchantSummaryData();
          break;
        case 'daily_sales':
          responseData = await fetchDailySalesData();
          break;
        default:
          // For general inquiries or when intent is not clear
          responseData = {
            text: "I can help you with sales summaries, daily sales data, or listing all merchants. What specific information are you looking for?",
            action: null
          };
      }
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        text: responseData.text,
        sender: 'assistant',
        action: responseData.action
      };
      
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
      
      // Handle action if provided
      if (responseData.action) {
        handleAction(responseData.action);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble retrieving the data right now. Please try again.",
        sender: 'assistant',
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Simple intent detection based on keywords
  const determineUserIntent = (message) => {
    const lowerMsg = message.toLowerCase();
    
    if (lowerMsg.includes('summary') || lowerMsg.includes('overview') || lowerMsg.includes('how am i doing')) {
      return 'summary';
    } else if (lowerMsg.includes('daily sales') || lowerMsg.includes('daily revenue') || lowerMsg.includes('sales by day')) {
      return 'daily_sales';
    } else if (lowerMsg.includes('list merchants') || lowerMsg.includes('all merchants')) {
      return 'list_merchants';
    }
    
    return 'general';
  };
  
  const fetchMerchantSummaryData = async () => {
    try {
      const response = await axios.get(`${API_URL}/merchant/${merchantId}/summary`);
      const data = response.data;
      
      return {
        text: `Here's your summary:\n• Total Sales: $${data.total_sales.toFixed(2)}\n• Transactions: ${data.transaction_count}\n• Active Days: ${data.active_days}\n• Average Order Value: $${data.avg_transaction_value.toFixed(2)}`,
        action: 'view_sales_report'
      };
    } catch (error) {
      console.error('Error fetching summary data:', error);
      throw error;
    }
  };
  
  const fetchDailySalesData = async () => {
    try {
      const response = await axios.get(`${API_URL}/merchant/${merchantId}/sales/daily`);
      const data = response.data;
      
      // Get recent days data to show in chat
      const recentDays = data.slice(-3);
      let salesText = "Here are your recent daily sales:\n";
      
      recentDays.forEach(day => {
        salesText += `• ${day.date}: $${day.sales.toFixed(2)} (${day.transactions} transactions)\n`;
      });
      
      salesText += "\nWould you like to see the full report?";
      
      return {
        text: salesText,
        action: 'view_sales_report'
      };
    } catch (error) {
      console.error('Error fetching daily sales:', error);
      throw error;
    }
  };
  
  const handleAction = (action) => {
    switch (action) {
      case 'view_sales_report':
        // Add a small delay before navigation
        setTimeout(() => navigation.navigate('SalesReport', { merchantId }), 1000);
        break;
      case 'view_product_report':
        setTimeout(() => navigation.navigate('Products', { merchantId }), 1000);
        break;
      case 'view_insights':
        setTimeout(() => navigation.navigate('Insights', { merchantId }), 1000);
        break;
      case 'list_merchants':
        listAllMerchants();
        break;
      default:
        break;
    }
  };
  
  const listAllMerchants = async () => {
    try {
      const response = await axios.get(`${API_URL}/merchants`);
      const merchants = response.data.merchants;
      
      let merchantList = "Here are some merchants in our system:\n";
      merchants.slice(0, 5).forEach(merchant => {
        merchantList += `• ID ${merchant.merchant_id}: ${merchant.name}\n`;
      });
      
      const listMessage = {
        id: Date.now().toString(),
        text: merchantList,
        sender: 'assistant',
      };
      
      setMessages(prevMessages => [...prevMessages, listMessage]);
    } catch (error) {
      console.error('Error listing merchants:', error);
      const errorMessage = {
        id: Date.now().toString(),
        text: "I couldn't retrieve the merchant list. Please try again later.",
        sender: 'assistant',
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    }
  };

  const renderMessage = ({ item }) => (
    <View style={[
      styles.messageBubble,
      item.sender === 'user' ? styles.userBubble : styles.assistantBubble
    ]}>
      <Text style={styles.messageText}>{item.text}</Text>
      
      {item.action && (
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleAction(item.action)}
        >
          <Text style={styles.actionButtonText}>
            {item.action === 'view_sales_report' ? 'View Sales Report' : 
             item.action === 'view_product_report' ? 'View Products' : 
             item.action === 'view_insights' ? 'View Insights' : 
             'View Details'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: true });
    }
  }, [messages]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {merchantInfo && (
        <View style={styles.merchantHeader}>
          <Text style={styles.merchantName}>{merchantInfo.name}</Text>
          <Text style={styles.merchantStats}>
            Sales: ${merchantInfo.total_sales.toFixed(2)} | Orders: {merchantInfo.transaction_count}
          </Text>
        </View>
      )}
      
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        style={styles.messageList}
        contentContainerStyle={styles.messageListContent}
      />
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputMessage}
          onChangeText={setInputMessage}
          placeholder="Type a message..."
          returnKeyType="send"
          onSubmitEditing={handleSend}
        />
        {isLoading ? (
          <ActivityIndicator size="small" color="#4caf50" style={styles.sendButton} />
        ) : (
          <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
            <Text style={styles.sendButtonText}>Send</Text>
          </TouchableOpacity>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  merchantHeader: {
    backgroundColor: '#4caf50',
    padding: 12,
    paddingTop: Platform.OS === 'ios' ? 40 : 12,
  },
  merchantName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
  },
  merchantStats: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  messageList: {
    flex: 1,
  },
  messageListContent: {
    padding: 16,
  },
  messageBubble: {
    padding: 12,
    borderRadius: 16,
    marginBottom: 8,
    maxWidth: '80%',
  },
  userBubble: {
    backgroundColor: '#dcf8c6',
    alignSelf: 'flex-end',
  },
  assistantBubble: {
    backgroundColor: 'white',
    alignSelf: 'flex-start',
  },
  messageText: {
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  input: {
    flex: 1,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 20,
    backgroundColor: '#f9f9f9',
  },
  sendButton: {
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    width: 60,
    height: 40,
    backgroundColor: '#4caf50',
    borderRadius: 20,
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  actionButton: {
    marginTop: 8,
    backgroundColor: '#4caf50',
    padding: 8,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  actionButtonText: {
    color: 'white',
    fontSize: 12,
  },
});