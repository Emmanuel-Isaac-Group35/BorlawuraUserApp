import React, { useState, useRef, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    FlatList,
    KeyboardAvoidingView,
    Platform,
    Image,
    StatusBar,
    Linking
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RemixIcon } from '../../utils/icons';
import { supabase } from '../../lib/supabase';
import { typography } from '../../utils/typography';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'rider';
    timestamp: string;
}

const RiderChatPage: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const { riderId, orderId } = (route.params as any) || {};
    const flatListRef = useRef<FlatList>(null);
    const [inputText, setInputText] = useState('');
    const [rider, setRider] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'Hello! I am on my way to your location for the pickup.',
            sender: 'rider',
            timestamp: 'Just now',
        }
    ]);

    useEffect(() => {
        const fetchRider = async () => {
            if (riderId) {
                const { data } = await supabase.from('riders').select('*').eq('id', riderId).maybeSingle();
                if (data) setRider(data);
            } else {
                // Fallback for demo
                setRider({
                    full_name: 'Kwame Asante',
                    avatar_url: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
                    is_online: true
                });
            }
            setIsLoading(false);
        };
        fetchRider();

        // Real-time messages listener (Mocking logic since no messages table yet, but structured for future)
        const channel = supabase.channel(`order-chat-${orderId}`)
            .on('broadcast', { event: 'new-message' }, (payload) => {
                const msg = payload.payload;
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    text: msg.text,
                    sender: 'rider',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }]);
            }).subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [riderId, orderId]);

    const handleSend = () => {
        if (inputText.trim().length === 0) return;

        const newMessage: Message = {
            id: Date.now().toString(),
            text: inputText.trim(),
            sender: 'user',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages([...messages, newMessage]);
        setInputText('');

        // Simulate rider response
        setTimeout(() => {
            const response: Message = {
                id: (Date.now() + 1).toString(),
                text: 'Okay, copy that!',
                sender: 'rider',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages(prev => [...prev, response]);
        }, 2000);
    };

    useEffect(() => {
        // Scroll to bottom when messages change
        setTimeout(() => {
            flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
    }, [messages]);

    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.sender === 'user';
        return (
            <View style={[
                styles.messageContainer,
                isUser ? styles.userMessage : styles.riderMessage
            ]}>
                <View style={[
                    styles.messageBubble,
                    isUser ? styles.userBubble : styles.riderBubble
                ]}>
                    <Text style={[
                        styles.messageText,
                        isUser ? styles.userMessageText : styles.riderMessageText
                    ]}>
                        {item.text}
                    </Text>
                    <Text style={[
                        styles.timestamp,
                        isUser ? styles.userTimestamp : styles.riderTimestamp
                    ]}>
                        {item.timestamp}
                    </Text>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <RemixIcon name="ri-arrow-left-line" size={24} color="#1f2937" />
                </TouchableOpacity>

                <View style={styles.headerRiderInfo}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: rider?.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }}
                            style={styles.avatar}
                        />
                        <View style={[styles.onlineStatus, { backgroundColor: rider?.is_online ? '#10b981' : '#94a3b8' }]} />
                    </View>
                    <View>
                        <Text style={styles.riderName}>{rider?.full_name || 'Rider'}</Text>
                        <Text style={[styles.riderStatus, { color: rider?.is_online ? '#10b981' : '#64748b' }]}>
                            {rider?.is_online ? 'Online' : 'Offline'}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity 
                    style={styles.callButton}
                    onPress={() => rider?.phone_number && Linking.openURL(`tel:${rider.phone_number}`)}
                >
                    <RemixIcon name="ri-phone-fill" size={20} color="#10b981" />
                </TouchableOpacity>
            </View>

            {/* Messages */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.messagesList}
                showsVerticalScrollIndicator={false}
            />

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
            >
                <View style={styles.inputContainer}>
                    <TouchableOpacity style={styles.attachButton}>
                        <RemixIcon name="ri-add-line" size={24} color="#6b7280" />
                    </TouchableOpacity>

                    <TextInput
                        style={styles.input}
                        value={inputText}
                        onChangeText={setInputText}
                        placeholder="Type a message..."
                        placeholderTextColor="#9ca3af"
                        multiline
                        maxLength={500}
                    />

                    <TouchableOpacity
                        onPress={handleSend}
                        style={[
                            styles.sendButton,
                            inputText.trim().length > 0 ? styles.sendButtonActive : styles.sendButtonDisabled
                        ]}
                        disabled={inputText.trim().length === 0}
                    >
                        <RemixIcon name="ri-send-plane-fill" size={20} color="#ffffff" />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    backButton: {
        padding: 8,
        marginRight: 8,
        borderRadius: 8,
    },
    headerRiderInfo: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#f3f4f6',
    },
    onlineStatus: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#10b981',
        borderWidth: 2,
        borderColor: '#ffffff',
    },
    riderName: {
        fontSize: 16,
        fontFamily: typography.bold,
        color: '#1f2937',
    },
    riderStatus: {
        fontSize: 12,
        color: '#10b981',
        fontFamily: typography.semiBold,
    },
    callButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#ecfdf5',
        alignItems: 'center',
        justifyContent: 'center',
    },
    messagesList: {
        padding: 16,
        paddingBottom: 24,
    },
    messageContainer: {
        marginBottom: 16,
        flexDirection: 'row',
    },
    userMessage: {
        justifyContent: 'flex-end',
    },
    riderMessage: {
        justifyContent: 'flex-start',
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 1,
    },
    userBubble: {
        backgroundColor: '#3b82f6',
        borderBottomRightRadius: 4,
    },
    riderBubble: {
        backgroundColor: '#ffffff',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 16,
        fontFamily: typography.medium,
        lineHeight: 22,
    },
    userMessageText: {
        color: '#ffffff',
    },
    riderMessageText: {
        color: '#1f2937',
    },
    timestamp: {
        fontSize: 10,
        fontFamily: typography.medium,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    userTimestamp: {
        color: 'rgba(255, 255, 255, 0.7)',
    },
    riderTimestamp: {
        color: '#9ca3af',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        paddingHorizontal: 16,
        backgroundColor: '#ffffff',
        borderTopWidth: 1,
        borderTopColor: '#f3f4f6',
    },
    attachButton: {
        padding: 8,
        marginRight: 8,
    },
    input: {
        flex: 1,
        backgroundColor: '#f3f4f6',
        borderRadius: 24,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 16,
        fontFamily: typography.medium,
        color: '#1f2937',
        maxHeight: 100,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    },
    sendButtonActive: {
        backgroundColor: '#3b82f6',
    },
    sendButtonDisabled: {
        backgroundColor: '#e5e7eb',
    },
});

export default RiderChatPage;
