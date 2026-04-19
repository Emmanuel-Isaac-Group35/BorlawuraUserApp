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
      const { error } = await supabase.from('support_tickets').insert([{
        creator_id: user?.id || user?.supabase_id,
        creator_type: 'user',
        subject: `User Support Request: ${user?.full_name || 'Resident'}`,
        description: inputText,
        priority: 'medium',
        status: 'open'
      }]);

      if (error) throw error;

      setMessages([...messages, newMessage]);
      setInputText('');

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
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 20), height: Math.max(insets.top, 20) + 70 }]}>
        <TouchableOpacity onPress={() => navigateTo('/support')} style={styles.backButton}>
          <RemixIcon name="ri-arrow-left-s-line" size={28} color="#0f172a" />
        </TouchableOpacity>
        <View style={styles.agentInfo}>
          <View style={styles.agentAvatar}>
            <RemixIcon name="ri-customer-service-2-fill" size={20} color="#fff" />
            <View style={styles.onlineStatus} />
          </View>
          <View>
            <View style={styles.agentNameRow}>
               <Text style={styles.agentName}>Support Desk</Text>
               <RemixIcon name="ri-checkbox-circle-fill" size={14} color="#10b981" />
            </View>
            <Text style={styles.agentStatus}>Active Response</Text>
          </View>
        </View>
      </View>
 
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.chatArea}
          contentContainerStyle={[
            styles.chatContent,
            { 
              paddingTop: 30,
              paddingBottom: 20 
            }
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
                <Text style={[
                  styles.messageText,
                  msg.sender === 'user' ? styles.userText : styles.agentText
                ]}>
                  {msg.text}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={[
                    styles.timestamp,
                    msg.sender === 'user' ? styles.userTimestamp : styles.agentTimestamp
                  ]}>
                    {msg.timestamp}
                  </Text>
                  {msg.sender === 'user' && (
                    <RemixIcon name="ri-check-double-line" size={14} color="rgba(255,255,255,0.6)" />
                  )}
                </View>
              </View>
            </View>
          ))}
          {isTyping && (
            <View style={styles.typingContainer}>
              <View style={styles.typingBubble}>
                 <View style={styles.typingDot} />
                 <View style={[styles.typingDot, { opacity: 0.6 }]} />
                 <View style={[styles.typingDot, { opacity: 0.3 }]} />
              </View>
            </View>
          )}
        </ScrollView>

        <View style={[styles.inputArea, { paddingBottom: Math.max(insets.bottom, 20) }]}>
           <View style={styles.inputContainer}>
              <TouchableOpacity style={styles.attachButton}>
                <RemixIcon name="ri-attachment-2" size={22} color="#94a3b8" />
              </TouchableOpacity>
              <TextInput
                style={styles.input}
                placeholder="Message support..."
                value={inputText}
                onChangeText={setInputText}
                multiline
                placeholderTextColor="#94a3b8"
              />
              <TouchableOpacity 
                onPress={sendMessage}
                style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                disabled={!inputText.trim() || isSending}
              >
                {isSending ? (
                   <ActivityIndicator size="small" color="#fff" />
                ) : (
                   <RemixIcon name="ri-send-plane-2-fill" size={20} color="#fff" />
                )}
              </TouchableOpacity>
           </View>
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
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1.5,
    borderBottomColor: '#f1f5f9',
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
    width: 44,
    height: 44,
    borderRadius: 16,
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  onlineStatus: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10b981',
    borderWidth: 2.5,
    borderColor: '#fff',
  },
  agentNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  agentName: {
    fontSize: 17,
    fontFamily: typography.bold,
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  agentStatus: {
    fontSize: 12,
    fontFamily: typography.medium,
    color: '#10b981',
    marginTop: -2,
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    paddingHorizontal: 20,
  },
  messageWrapper: {
    marginVertical: 10,
    maxWidth: '85%',
  },
  userWrapper: {
    alignSelf: 'flex-end',
  },
  agentWrapper: {
    alignSelf: 'flex-start',
  },
  messageBubble: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
  },
  userBubble: {
    backgroundColor: '#10b981',
    borderBottomRightRadius: 6,
  },
  agentBubble: {
    backgroundColor: '#fff',
    borderBottomLeftRadius: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  messageText: {
    fontSize: 15,
    fontFamily: typography.medium,
    lineHeight: 22,
  },
  userText: {
    color: '#fff',
  },
  agentText: {
    color: '#334155',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: 6,
  },
  timestamp: {
    fontSize: 10,
    fontFamily: typography.bold,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  agentTimestamp: {
    color: '#94a3b8',
  },
  typingContainer: {
    paddingVertical: 12,
  },
  typingBubble: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    flexDirection: 'row',
    gap: 4,
    alignSelf: 'flex-start',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94a3b8',
  },
  inputArea: {
    backgroundColor: '#fff',
    borderTopWidth: 1.5,
    borderTopColor: '#f1f5f9',
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 8,
  },
  attachButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    fontSize: 15,
    fontFamily: typography.medium,
    color: '#1e293b',
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: '#e2e8f0',
    shadowOpacity: 0,
    elevation: 0,
  },
});
