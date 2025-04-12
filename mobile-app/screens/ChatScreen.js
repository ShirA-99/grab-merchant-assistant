import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard
} from 'react-native';
import { Card } from 'react-native-paper';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
const API_URL = 'http://192.168.68.114:5000';

const ChatScreen = ({ route, navigation }) => {
  const { merchantId = 'M001' } = route.params || {};
  const [messages, setMessages] = useState([
    {
      id: '1',
      sender: 'assistant',
      text: "Hello! I'm your Merchant Assistant. How can I help you with your business today?",
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [merchantData, setMerchantData] = useState(null);
  const [keywordData, setKeywordData] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  
  const flatListRef = useRef(null);

  useEffect(() => {
    loadMerchantData();
    loadKeywordData();
  }, [merchantId]);

  const loadMerchantData = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/merchant/${merchantId}/summary`);
      setMerchantData(response.data);
    } catch (error) {
      console.error('Error fetching merchant data:', error);
      // Add error handling as needed
    }
  };

  const loadKeywordData = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/merchant/${merchantId}/keywords`);
      setKeywordData(response.data.keywords || []);
    } catch (error) {
      console.error('Error fetching keyword data:', error);
      // Add error handling as needed
    }
  };

  const sendMessage = async () => {
    if (!inputText.trim()) return;
    
    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: inputText,
      timestamp: new Date()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setInputText('');
    setIsLoading(true);
    
    // Scroll to bottom
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
    
    try {
      // Simulating API call to a chat service or AI endpoint
      // In a real app, you would connect to your backend or a service like OpenAI
      simulateTyping();
      
      // Process the message based on content
      await processUserMessage(userMessage.text);
      
    } catch (error) {
      console.error('Error processing message:', error);
      addAssistantMessage("I'm sorry, I encountered an error while processing your request. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Simulate typing indicator
  const simulateTyping = () => {
    setIsTyping(true);
    setTimeout(() => setIsTyping(false), 1500 + Math.random() * 1000);
  };

  // Process user message and generate appropriate response
  const processUserMessage = async (text) => {
    const lowerText = text.toLowerCase();
    
    // Handle sales questions
    if (lowerText.includes('sales') || lowerText.includes('revenue') || lowerText.includes('earning')) {
      await handleSalesQuestion();
    }
    // Handle product questions
    else if (lowerText.includes('product') || lowerText.includes('item') || lowerText.includes('menu')) {
      await handleProductQuestion();
    }
    // Handle keyword questions
    else if (lowerText.includes('keyword') || lowerText.includes('search term') || lowerText.includes('search query')) {
      await handleKeywordQuestion();
    }
    // Handle customer questions
    else if (lowerText.includes('customer') || lowerText.includes('buyer') || lowerText.includes('client')) {
      await handleCustomerQuestion();
    }
    // Handle help/suggestions
    else if (lowerText.includes('help') || lowerText.includes('suggest') || lowerText.includes('improve') || lowerText.includes('better')) {
      await handleHelpQuestion();
    }
    // Handle greetings
    else if (lowerText.includes('hi') || lowerText.includes('hello') || lowerText.includes('hey')) {
      handleGreeting();
    }
    // Default response
    else {
      handleDefaultResponse();
    }
  };

  const handleSalesQuestion = async () => {
    try {
      // Fetch sales metrics for analysis
      const response = await axios.get(`${API_URL}/api/merchant/${merchantId}/sales/metrics`);
      const salesData = response.data;
      
      let message = `Based on your recent sales data:\n\n`;
      message += `• Total Sales: $${salesData.total_sales.toFixed(2)}\n`;
      message += `• Total Orders: ${salesData.total_orders}\n`;
      message += `• Average Order Value: $${salesData.avg_order_value.toFixed(2)}\n\n`;
      
      if (salesData.sales_change > 0) {
        message += `Your sales are up ${salesData.sales_change.toFixed(1)}% compared to the previous period. Keep up the good work! 📈`;
      } else if (salesData.sales_change < 0) {
        message += `Your sales are down ${Math.abs(salesData.sales_change).toFixed(1)}% compared to the previous period. Would you like some suggestions to boost sales? 📉`;
      } else {
        message += `Your sales are stable compared to the previous period. Would you like some suggestions to grow further? 📊`;
      }
      
      addAssistantMessage(message);
    } catch (error) {
      addAssistantMessage("I couldn't retrieve your sales data at the moment. Please try again later.");
    }
  };

  const handleProductQuestion = async () => {
    try {
      // Fetch product performance data
      const response = await axios.get(`${API_URL}/api/merchant/${merchantId}/items/performance`);
      const products = response.data.items || [];
      
      if (products.length === 0) {
        addAssistantMessage("I don't see any product data available. Would you like to add some products?");
        return;
      }
      
      // Sort by order count
      products.sort((a, b) => b.order_count - a.order_count);
      
      const topProducts = products.slice(0, 3);
      
      let message = `Here's info about your top-selling products:\n\n`;
      
      topProducts.forEach((product, index) => {
        message += `${index + 1}. ${product.name}\n`;
        message += `   • Price: $${product.price.toFixed(2)}\n`;
        message += `   • Orders: ${product.order_count}\n`;
        message += `   • Revenue: $${product.revenue.toFixed(2)}\n\n`;
      });
      
      message += `Would you like to see more details about your product performance?`;
      
      addAssistantMessage(message);
    } catch (error) {
      addAssistantMessage("I couldn't retrieve your product data at the moment. Please try again later.");
    }
  };

  const handleKeywordQuestion = async () => {
    if (keywordData.length === 0) {
      addAssistantMessage("I don't have keyword data available at the moment. Would you like me to help you track important keywords for your business?");
      return;
    }
    
    // Sort by conversion rate
    const sortedKeywords = [...keywordData].sort((a, b) => b.conversion_rate - a.conversion_rate);
    const topKeywords = sortedKeywords.slice(0, 5);
    
    let message = `Here are your top-performing keywords by conversion rate:\n\n`;
    
    topKeywords.forEach((keyword, index) => {
      message += `${index + 1}. "${keyword.keyword}"\n`;
      message += `   • Views: ${keyword.views}\n`;
      message += `   • Orders: ${keyword.orders}\n`;
      message += `   • Conversion Rate: ${keyword.conversion_rate.toFixed(1)}%\n\n`;
    });
    
    message += `These keywords are driving the most conversions. Consider featuring them prominently in your listings.`;
    
    addAssistantMessage(message);
  };

  const handleCustomerQuestion = async () => {
    try {
      // Fetch customer insights
      const response = await axios.get(`${API_URL}/api/merchant/${merchantId}/insights`);
      const data = response.data;
      
      let message = `Here's what I know about your customers:\n\n`;
      message += `• Total Unique Customers: ${data.customer_metrics.total_unique_customers}\n`;
      message += `• Repeat Customers: ${data.customer_metrics.repeat_customers}\n`;
      message += `• Repeat Rate: ${data.customer_metrics.repeat_rate_percent.toFixed(1)}%\n\n`;
      
      if (data.customer_metrics.repeat_rate_percent < 20) {
        message += `Your repeat customer rate is below average. Consider implementing a loyalty program to encourage customers to return.`;
      } else if (data.customer_metrics.repeat_rate_percent > 40) {
        message += `You have a strong repeat customer base! Your customers love your products. Consider asking for referrals to grow further.`;
      } else {
        message += `Your repeat customer rate is average for the industry. Creating special promotions for previous customers could help increase this rate.`;
      }
      
      addAssistantMessage(message);
    } catch (error) {
      addAssistantMessage("I couldn't retrieve customer data at the moment. Please try again later.");
    }
  };

  const handleHelpQuestion = async () => {
    try {
      // Get sales metrics and insights to provide targeted help
      const metricsResponse = await axios.get(`${API_URL}/api/merchant/${merchantId}/sales/metrics`);
      const insightsResponse = await axios.get(`${API_URL}/api/merchant/${merchantId}/insights`);
      
      const metrics = metricsResponse.data;
      const insights = insightsResponse.data;
      
      let suggestions = [];
      
      // Check sales trend
      if (metrics.sales_change < 0) {
        suggestions.push("Your sales are trending downward. Consider running a limited-time promotion to boost orders.");
      }
      
      // Check repeat customer rate
      if (insights.customer_metrics.repeat_rate_percent < 30) {
        suggestions.push("Your repeat customer rate is lower than ideal. Think about implementing a loyalty program.");
      }
      
      // Check delivery metrics
      if (insights.delivery_metrics.avg_preparation_time_min > 10) {
        suggestions.push("Your preparation time is higher than average. Looking for ways to optimize your preparation process could improve customer satisfaction.");
      }
      
      // If no specific issues found
      if (suggestions.length === 0) {
        suggestions.push("Based on your metrics, your business is doing well! To grow further, consider expanding your product line.");
        suggestions.push("You might also benefit from creating seasonal specials to attract new customers.");
      }
      
      let message = `Here are some suggestions to help your business:\n\n`;
      suggestions.forEach((suggestion, index) => {
        message += `${index + 1}. ${suggestion}\n\n`;
      });
      
      message += `Would you like more detailed recommendations for any of these areas?`;
      
      addAssistantMessage(message);
    } catch (error) {
      // Fallback suggestions if API fails
      const message = `Here are some general suggestions to improve your business:\n\n` +
        `1. Regularly review your best and worst-selling items\n\n` +
        `2. Consider seasonal promotions to boost sales during slower periods\n\n` +
        `3. Engage with customer feedback to improve your offerings\n\n` +
        `Would you like more specific advice on any of these areas?`;
      
      addAssistantMessage(message);
    }
  };

  const handleGreeting = () => {
    const greetings = [
      `Hello there! How can I help with your business today?`,
      `Hi! I'm here to help you analyze your business performance. What would you like to know?`,
      `Hello! Would you like to see your sales summary, product performance, or customer insights today?`
    ];
    
    const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
    addAssistantMessage(randomGreeting);
  };

  const handleDefaultResponse = () => {
    const responses = [
      `I can help you with information about your sales, products, customers, and keywords. What would you like to know?`,
      `I'm not sure I understood that. Would you like to know about your sales performance, product analytics, or customer insights?`,
      `I can provide insights about your business performance. Try asking about your sales, top products, or customer trends.`
    ];
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    addAssistantMessage(randomResponse);
  };

  const addAssistantMessage = (text) => {
    const assistantMessage = {
      id: Date.now().toString(),
      sender: 'assistant',
      text: text,
      timestamp: new Date()
    };
    
    setTimeout(() => {
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
      
      // Scroll to bottom after message is added
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }, 1500); // Delay to make it feel more natural after typing indicator
  };

  const renderMessage = ({ item }) => {
    const isUser = item.sender === 'user';
    
    return (
      <View style={[
        styles.messageContainer,
        isUser ? styles.userMessageContainer : styles.assistantMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isUser ? styles.userBubble : styles.assistantBubble
        ]}>
          <Text style={[
            styles.messageText,
            isUser ? styles.userMessageText : styles.assistantMessageText
          ]}>
            {item.text}
          </Text>
        </View>
        <Text style={styles.timestamp}>
          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  const renderSuggestions = () => {
    const suggestions = [
      "How are my sales doing?",
      "What are my top products?",
      "Tell me about my customers",
      "Any suggestions to improve?"
    ];
    
    return (
      <View style={styles.suggestionsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionsScrollContent}
        >
          {suggestions.map((suggestion, index) => (
            <TouchableOpacity 
              key={index}
              style={styles.suggestionChip}
              onPress={() => {
                setInputText(suggestion);
                setTimeout(() => sendMessage(), 100);
              }}
            >
              <Text style={styles.suggestionText}>{suggestion}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Merchant Name Header */}
      {merchantData && (
        <View style={styles.merchantHeader}>
          <Text style={styles.merchantName}>{merchantData.name}</Text>
          <Text style={styles.merchantSubtitle}>Business Assistant</Text>
        </View>
      )}
      
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messagesContainer}
        onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
      />
      
      {/* Typing indicator */}
      {isTyping && (
        <View style={styles.typingContainer}>
          <View style={styles.typingBubble}>
            <Text style={styles.typingText}>Assistant is typing</Text>
            <ActivityIndicator size="small" color="#999" style={styles.typingIndicator} />
          </View>
        </View>
      )}
      
      {/* Quick suggestions */}
      {messages.length < 3 && renderSuggestions()}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          placeholderTextColor="#999"
          multiline
          onSubmitEditing={sendMessage}
        />
        <TouchableOpacity 
          style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]} 
          onPress={sendMessage}
          disabled={!inputText.trim()}
        >
          <Ionicons name="send" size={20} color={inputText.trim() ? "#fff" : "#ccc"} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  merchantHeader: {
    padding: 16,
    backgroundColor: '#4285F4',
    alignItems: 'center',
  },
  merchantName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  merchantSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
    alignSelf: 'flex-start',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
  },
  assistantMessageContainer: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    borderRadius: 18,
    padding: 12,
    marginBottom: 4,
  },
  userBubble: {
    backgroundColor: '#4285F4',
  },
  assistantBubble: {
    backgroundColor: '#EAEAEA',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: 'white',
  },
  assistantMessageText: {
    color: '#333',
  },
  timestamp: {
    fontSize: 10,
    color: '#999',
    alignSelf: 'flex-end',
    marginRight: 8,
  },
  typingContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  typingBubble: {
    backgroundColor: '#EAEAEA',
    borderRadius: 18,
    padding: 12,
    alignSelf: 'flex-start',
    maxWidth: '60%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingText: {
    fontSize: 14,
    color: '#666',
    marginRight: 6,
  },
  typingIndicator: {
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#f2f2f2',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 120,
    fontSize: 16,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4285F4',
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  suggestionsContainer: {
    marginHorizontal: 16,
    marginBottom: 12,
  },
  suggestionsScrollContent: {
    paddingVertical: 8,
  },
  suggestionChip: {
    backgroundColor: 'white',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  suggestionText: {
    fontSize: 14,
    color: '#4285F4',
  }
});

export default ChatScreen;