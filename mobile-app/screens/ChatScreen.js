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
  ActivityIndicator
} from 'react-native';
import axios from 'axios';

// Replace with your API server address
const API_URL = 'http://192.168.68.114:5000/api';
const MERCHANT_ID = 1; // Default merchant ID for demo

export default function ChatScreen({ navigation }) {
  const [messages, setMessages] = useState([
    {
      id: '1',
      text: "Hello! I'm your Grab Merchant Assistant. How can I help you today?",
      sender: 'assistant',
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const flatListRef = useRef(null);

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
    
    try {
      const response = await axios.post(`${API_URL}/chat`, {
        message: userMessage.text,
        merchant_id: MERCHANT_ID
      });
      
      const assistantMessage = {
        id: (Date.now() + 1).toString(),
        text: response.data.text,
        sender: 'assistant',
        action: response.data.action
      };
      
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
      
      // Handle action if provided
      if (response.data.action) {
        handleAction(response.data.action);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble responding right now. Please try again.",
        sender: 'assistant',
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAction = (action) => {
    switch (action) {
      case 'view_sales_report':
        // Add a small delay before navigation
        setTimeout(() => navigation.navigate('SalesReport'), 1000);
        break;
      case 'view_product_report':
        setTimeout(() => navigation.navigate('Products'), 1000);
        break;
      case 'view_insights':
        setTimeout(() => navigation.navigate('Insights'), 1000);
        break;
      default:
        break;
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