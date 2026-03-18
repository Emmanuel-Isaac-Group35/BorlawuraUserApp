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
    StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { RemixIcon } from '../../utils/icons';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'rider';
    timestamp: string;
}

const RiderChatPage: React.FC = () => {
    const navigation = useNavigation();
    const flatListRef = useRef<FlatList>(null);
    const [inputText, setInputText] = useState('');

    // Mock data for the rider
    const rider = {
        name: 'Kwame Asante',
        status: 'Online',
        image: 'https://readdy.ai/api/search-image?query=Professional%20African%20male%20waste%20collection%20worker%2C%20friendly%20smile%2C%20uniform%2C%20safety%20equipment%2C%20confident%20expression%2C%20clean%20background%2C%20high-quality%20portrait%20photography&width=80&height=80&seq=rider1&orientation=squarish'
    };

    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: 'Hello! I am on my way to your location.',
            sender: 'rider',
            timestamp: '14:35',
        },
        {
            id: '2',
            text: 'Great, thanks! I have the bags ready outside.',
            sender: 'user',
            timestamp: '14:36',
        },
        {
            id: '3',
            text: 'Perfect. I should be there in about 10 minutes.',
            sender: 'rider',
            timestamp: '14:37',
        }
    ]);

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
                            source={{ uri: rider.image }}
                            style={styles.avatar}
                        />
                        <View style={styles.onlineStatus} />
                    </View>
                    <View>
                        <Text style={styles.riderName}>{rider.name}</Text>
                        <Text style={styles.riderStatus}>{rider.status}</Text>
                    </View>
                </View>

                <TouchableOpacity style={styles.callButton}>
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
        fontWeight: '600',
        color: '#1f2937',
    },
    riderStatus: {
        fontSize: 12,
        color: '#10b981',
        fontWeight: '500',
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
