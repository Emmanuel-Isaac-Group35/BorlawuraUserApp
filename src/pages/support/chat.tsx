import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, Image, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Navigation } from '../../components/feature/Navigation';
import { RemixIcon } from '../../utils/icons';
import { navigateTo } from '../../utils/navigation';
import { useAuth } from '../../context/AuthContext';
import { supabase } from '../../lib/supabase';
import { typography } from '../../utils/typography';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'agent';
  timestamp: string;
}

const SupportChatPage: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! Thanks for reaching out to Borla Wura support. How can we help you today?",
      sender: 'agent',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  const sendMessage = async () => {
    if (!inputText.trim() || isSending) return;
    setIsSending(true);

    const newMessage: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    try {
      // 1. Indicate creator_type and persist to database
      const { error } = await supabase.from('support_tickets').insert([{
        creator_id: user?.id || user?.supabase_id,
        creator_type: 'user', // Explicitly indicate this is coming from the User App
        subject: `User Support Request: ${user?.full_name || 'Resident'}`,
        description: inputText,
        priority: 'medium',
        status: 'open'
      }]);

      if (error) throw error;

      // 2. Update local UI
      setMessages([...messages, newMessage]);
      setInputText('');

      // 3. Simulate agent response
      setIsTyping(true);
      setTimeout(() => {
        const agentResponse: Message = {
          id: (Date.now() + 1).toString(),
          text: "Thanks for reporting. Our support team has received your ticket and will respond shortly.",
          sender: 'agent',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages(prev => [...prev, agentResponse]);
        setIsTyping(false);
      }, 2000);
    } catch (err: any) {
      Alert.alert('Report Failed', 'Could not send the report: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <View style={styles.container}>
      {/* Absolute Dynamic Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20), height: Math.max(insets.top, 20) + 60 }]}>
        <TouchableOpacity onPress={() => navigateTo('/support')} style={styles.backButton}>
          <RemixIcon name="ri-arrow-left-line" size={24} color="#1f2937" />
        </TouchableOpacity>
        <View style={styles.agentInfo}>
          <View style={styles.agentAvatar}>
            <RemixIcon name="ri-customer-service-2-line" size={24} color="#fff" />
            <View style={styles.onlineStatus} />
          </View>
          <View>
            <Text style={styles.agentName}>Live Support</Text>
            <Text style={styles.agentStatus}>Online</Text>
          </View>
        </View>
      </View>
 
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatArea}
        contentContainerStyle={[
          styles.chatContent,
          { paddingTop: 20 }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => (
          <View
            key={msg.id}
            style={[
              styles.messageWrapper,
              msg.sender === 'user' ? styles.userWrapper : styles.agentWrapper
            ]}
          >
            <View
              style={[
                styles.messageBubble,
                msg.sender === 'user' ? styles.userBubble : styles.agentBubble
              ]}
            >
              {msg.sender === 'user' && <Text style={styles.roleTag}>USER REPORT</Text>}
              <Text style={[
                styles.messageText,
                msg.sender === 'user' ? styles.userText : styles.agentText
              ]}>
                {msg.text}
              </Text>
              <Text style={[
                styles.timestamp,
                msg.sender === 'user' ? styles.userTimestamp : styles.agentTimestamp
              ]}>
                {msg.timestamp}
              </Text>
            </View>
          </View>
        ))}
        {isTyping && (
          <View style={styles.typingContainer}>
            <Text style={styles.typingText}>Borla Wura Support is typing...</Text>
          </View>
        )}
      </ScrollView>
 
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, 12) + 8 }]}>
          <TouchableOpacity style={styles.attachButton}>
            <RemixIcon name="ri-add-line" size={24} color="#6b7280" />
          </TouchableOpacity>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            placeholderTextColor="#9ca3af"
          />
          <TouchableOpacity 
            onPress={sendMessage}
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            disabled={!inputText.trim() || isSending}
          >
            {isSending ? (
               <ActivityIndicator size="small" color="#fff" />
            ) : (
               <RemixIcon name="ri-send-plane-2-fill" size={24} color="#fff" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

export default SupportChatPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    zIndex: 50,
  },
  backButton: {
    marginRight: 16,
  },
  agentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  agentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  onlineStatus: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#fff',
  },
  agentName: {
    fontSize: 16,
    fontFamily: typography.bold,
    color: '#1f2937',
  },
  agentStatus: {
    fontSize: 12,
    fontFamily: typography.medium,
    color: '#10b981',
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageWrapper: {
    marginVertical: 8,
    maxWidth: '80%',
  },
  userWrapper: {
    alignSelf: 'flex-end',
  },
  agentWrapper: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: '#10b981',
    borderBottomRightRadius: 4,
  },
  agentBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  messageText: {
    fontSize: 15,
    fontFamily: typography.regular,
    lineHeight: 20,
  },
  userText: {
    color: '#fff',
  },
  agentText: {
    color: '#1f2937',
  },
  timestamp: {
    fontSize: 10,
    fontFamily: typography.regular,
    marginTop: 4,
    alignSelf: 'flex-end',
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  agentTimestamp: {
    color: '#9ca3af',
  },
  roleTag: {
    fontSize: 9,
    fontFamily: typography.bold,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  typingContainer: {
    paddingVertical: 8,
  },
  typingText: {
    fontSize: 12,
    color: '#6b7280',
    fontFamily: typography.medium,
    fontStyle: 'italic',
  },
  inputArea: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 8,
  },
  attachButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: '#f3f4f6',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 15,
    fontFamily: typography.medium,
    color: '#1f2937',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
});
