import React, { useState, useRef, useEffect, useCallback } from 'react';
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
    Linking,
    Animated,
    Easing,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { RemixIcon } from '../../utils/icons';
import { supabase } from '../../lib/supabase';
import { typography } from '../../utils/typography';
import { useAuth } from '../../context/AuthContext';
import { resolveRealUserId } from '../../utils/user';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'rider';
    timestamp: string;
    status?: 'sending' | 'sent' | 'failed';
}

const COMPLETED_STATUSES = ['completed', 'cancelled', 'done'];

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const RiderChatPage: React.FC = () => {
    const navigation = useNavigation<any>();
    const route = useRoute();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { riderId, orderId } = (route.params as any) || {};

    const flatListRef = useRef<FlatList>(null);
    const [inputText, setInputText] = useState('');
    const [rider, setRider] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);

    // ── Ride-ended banner ─────────────────────────────────────────────────────
    const [rideEnded, setRideEnded] = useState(false);
    const [rideEndReason, setRideEndReason] = useState<'completed' | 'cancelled'>('completed');
    const bannerAnim = useRef(new Animated.Value(0)).current;

    const showRideEndedBanner = useCallback((reason: 'completed' | 'cancelled') => {
        setRideEndReason(reason);
        setRideEnded(true);
        Animated.spring(bannerAnim, {
            toValue: 1,
            useNativeDriver: true,
            tension: 80,
            friction: 10,
        }).start();
    }, [bannerAnim]);

    // ── Load rider info ───────────────────────────────────────────────────────
    useEffect(() => {
        const fetchRider = async () => {
            setIsLoading(true);
            try {
                let riderData = null;

                if (riderId) {
                    const { data } = await supabase
                        .from('riders')
                        .select('id, full_name, avatar_url, phone_number, is_online, rating')
                        .eq('id', riderId)
                        .maybeSingle();
                    riderData = data;
                }

                if (!riderData && orderId) {
                    const { data: orderData } = await supabase
                        .from('orders')
                        .select('rider_id')
                        .eq('id', orderId)
                        .single();
                    if (orderData?.rider_id) {
                        const { data } = await supabase
                            .from('riders')
                            .select('id, full_name, avatar_url, phone_number, is_online, rating')
                            .eq('id', orderData.rider_id)
                            .maybeSingle();
                        riderData = data;
                    }
                }

                setRider(riderData || {
                    full_name: 'Dispatch Rider',
                    avatar_url: null,
                    is_online: true,
                });
            } finally {
                setIsLoading(false);
            }
        };
        fetchRider();
    }, [riderId, orderId]);

    // ── Load existing messages ────────────────────────────────────────────────
    useEffect(() => {
        if (!orderId) return;

        const loadMessages = async () => {
            const uid = await resolveRealUserId(user);
            const { data, error } = await supabase
                .from('chat_messages')
                .select('*')
                .eq('order_id', orderId)
                .order('created_at', { ascending: true })
                .limit(100);

            if (error) {
                if (error.code === '42P01') {
                    // Table doesn't exist yet — show placeholder
                    console.warn('[Chat] chat_messages table missing. Run migration SQL.');
                    setMessages([{
                        id: 'sys-1',
                        text: 'Chat is setting up — messages will appear here once connected.',
                        sender: 'rider',
                        timestamp: 'System',
                    }]);
                }
                return;
            }

            if (data) {
                const formatted: Message[] = data.map((m: any) => ({
                    id: m.id,
                    text: m.message,
                    sender: m.sender_type === 'rider' ? 'rider' : 'user',
                    timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    status: 'sent',
                }));
                setMessages(formatted);
            }
        };

        loadMessages();
    }, [orderId, user]);

    // ── Real-time message subscription ────────────────────────────────────────
    useEffect(() => {
        if (!orderId) return;

        const msgChannel = supabase.channel(`chat-${orderId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'chat_messages',
                filter: `order_id=eq.${orderId}`,
            }, (payload: any) => {
                const m = payload.new;
                setMessages(prev => {
                    // Avoid duplicating optimistic messages we already added
                    if (prev.some(p => p.id === m.id)) return prev;
                    return [...prev, {
                        id: m.id,
                        text: m.message,
                        sender: m.sender_type === 'rider' ? 'rider' : 'user',
                        timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        status: 'sent',
                    }];
                });
            })
            // Also listen for broadcast from the Rider app (in case DB is bypassed)
            .on('broadcast', { event: 'rider-message' }, (payload: any) => {
                const msg = payload.payload;
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    text: msg.text,
                    sender: 'rider',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    status: 'sent',
                }]);
            })
            .subscribe();

        return () => { supabase.removeChannel(msgChannel); };
    }, [orderId]);

    // ── Order status watcher — closes chat on completion/cancellation ─────────
    useEffect(() => {
        if (!orderId) return;

        // 1. Check current order status immediately
        (async () => {
            const { data } = await supabase
                .from('orders')
                .select('status')
                .eq('id', orderId)
                .single();
            if (data && COMPLETED_STATUSES.includes(data.status)) {
                showRideEndedBanner(data.status === 'cancelled' ? 'cancelled' : 'completed');
            }
        })();

        // 2. Subscribe to live status changes
        const orderChannel = supabase.channel(`order-status-chat-${orderId}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'orders',
                filter: `id=eq.${orderId}`,
            }, (payload: any) => {
                const newStatus: string = payload.new.status;
                if (COMPLETED_STATUSES.includes(newStatus)) {
                    showRideEndedBanner(newStatus === 'cancelled' ? 'cancelled' : 'completed');
                }
            })
            .subscribe();

        return () => { supabase.removeChannel(orderChannel); };
    }, [orderId, showRideEndedBanner]);

    // ── Auto-scroll ───────────────────────────────────────────────────────────
    useEffect(() => {
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }, [messages]);

    // ── Send message ──────────────────────────────────────────────────────────
    const handleSend = async () => {
        const text = inputText.trim();
        if (!text || isSending) return;

        setIsSending(true);
        const tempId = `temp-${Date.now()}`;
        const optimistic: Message = {
            id: tempId,
            text,
            sender: 'user',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: 'sending',
        };

        setMessages(prev => [...prev, optimistic]);
        setInputText('');

        try {
            const uid = await resolveRealUserId(user);
            const { data, error } = await supabase.from('chat_messages').insert({
                order_id: orderId,
                sender_id: uid,
                sender_type: 'user',
                message: text,
            }).select().single();

            if (error) throw error;

            // Replace temp optimistic message with confirmed one
            setMessages(prev =>
                prev.map(m => m.id === tempId
                    ? { ...m, id: data.id, status: 'sent' }
                    : m
                )
            );
        } catch (e: any) {
            // Mark as failed
            setMessages(prev =>
                prev.map(m => m.id === tempId ? { ...m, status: 'failed' } : m)
            );
            console.warn('[Chat] Send failed:', e.message);
        } finally {
            setIsSending(false);
        }
    };

    // ── Render message bubble ─────────────────────────────────────────────────
    const renderMessage = ({ item }: { item: Message }) => {
        const isUser = item.sender === 'user';
        return (
            <View style={[styles.messageContainer, isUser ? styles.userMessage : styles.riderMessage]}>
                {!isUser && (
                    <Image
                        source={{ uri: rider?.avatar_url || 'https://cdn-icons-png.flaticon.com/512/149/149071.png' }}
                        style={styles.msgAvatar}
                    />
                )}
                <View style={[styles.messageBubble, isUser ? styles.userBubble : styles.riderBubble]}>
                    <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.riderMessageText]}>
                        {item.text}
                    </Text>
                    <View style={styles.timestampRow}>
                        <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.riderTimestamp]}>
                            {item.timestamp}
                        </Text>
                        {isUser && (
                            <RemixIcon
                                name={item.status === 'sending' ? 'ri-time-line' : item.status === 'failed' ? 'ri-error-warning-line' : 'ri-check-double-line'}
                                size={11}
                                color={item.status === 'failed' ? '#ef4444' : item.status === 'sending' ? '#64748b' : 'rgba(255,255,255,0.7)'}
                            />
                        )}
                    </View>
                </View>
            </View>
        );
    };

    // ── Ride-ended banner ─────────────────────────────────────────────────────
    const renderRideEndedBanner = () => {
        if (!rideEnded) return null;
        const isCompleted = rideEndReason === 'completed';
        return (
            <Animated.View style={[styles.rideEndedBanner, {
                transform: [{
                    translateY: bannerAnim.interpolate({ inputRange: [0, 1], outputRange: [120, 0] })
                }],
                opacity: bannerAnim,
            }]}>
                <View style={[styles.rideEndedInner, isCompleted ? styles.bannerCompleted : styles.bannerCancelled]}>
                    <View style={styles.bannerIconBox}>
                        <RemixIcon
                            name={isCompleted ? 'ri-shield-check-fill' : 'ri-close-circle-fill'}
                            size={28}
                            color={isCompleted ? '#10b981' : '#ef4444'}
                        />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.bannerTitle}>
                            {isCompleted ? 'Mission Complete!' : 'Order Cancelled'}
                        </Text>
                        <Text style={styles.bannerSub}>
                            {isCompleted
                                ? 'This chat session has ended. Thank you for using BorlaWura.'
                                : 'This order was cancelled. The chat session is now closed.'}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={[styles.bannerBtn, isCompleted ? styles.bannerBtnGreen : styles.bannerBtnRed]}
                    onPress={() => navigation.navigate('Home')}
                    activeOpacity={0.8}
                >
                    <Text style={styles.bannerBtnText}>
                        {isCompleted ? 'RETURN TO DASHBOARD' : 'GO HOME'}
                    </Text>
                    <RemixIcon name="ri-arrow-right-line" size={16} color="#fff" />
                </TouchableOpacity>
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar barStyle="light-content" backgroundColor="#0f172a" />

            {/* ── Header ── */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <RemixIcon name="ri-arrow-left-line" size={22} color="#ffffff" />
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
                        <Text style={[styles.riderStatus, { color: rideEnded ? '#ef4444' : (rider?.is_online ? '#10b981' : '#64748b') }]}>
                            {rideEnded ? 'Session ended' : (rider?.is_online ? '● Online' : '● Offline')}
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.callButton}
                    onPress={() => rider?.phone_number && Linking.openURL(`tel:${rider.phone_number}`)}
                    disabled={rideEnded}
                >
                    <RemixIcon name="ri-phone-fill" size={20} color={rideEnded ? '#334155' : '#10b981'} />
                </TouchableOpacity>
            </View>

            {/* ── Order ID pill ── */}
            {orderId && (
                <View style={styles.orderPill}>
                    <RemixIcon name="ri-file-list-3-line" size={11} color="#64748b" />
                    <Text style={styles.orderPillText}>ORDER #{orderId.slice(0, 8).toUpperCase()}</Text>
                </View>
            )}

            {/* ── Messages ── */}
            {isLoading ? (
                <View style={styles.loadingBox}>
                    <ActivityIndicator size="small" color="#10b981" />
                    <Text style={styles.loadingText}>Loading conversation...</Text>
                </View>
            ) : (
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    renderItem={renderMessage}
                    keyExtractor={item => item.id}
                    contentContainerStyle={[styles.messagesList, { paddingBottom: rideEnded ? 200 : 24 }]}
                    showsVerticalScrollIndicator={false}
                    ListEmptyComponent={
                        <View style={styles.emptyBox}>
                            <RemixIcon name="ri-chat-3-line" size={36} color="#1e293b" />
                            <Text style={styles.emptyText}>No messages yet.</Text>
                            <Text style={styles.emptySub}>Send a message to your rider below.</Text>
                        </View>
                    }
                />
            )}

            {/* ── Input — disabled when ride has ended ── */}
            {!rideEnded && (
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
                >
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={styles.input}
                            value={inputText}
                            onChangeText={setInputText}
                            placeholder="Type a message..."
                            placeholderTextColor="#475569"
                            multiline
                            maxLength={500}
                            onSubmitEditing={handleSend}
                        />
                        <TouchableOpacity
                            onPress={handleSend}
                            style={[styles.sendButton, (inputText.trim().length > 0 && !isSending) ? styles.sendButtonActive : styles.sendButtonDisabled]}
                            disabled={inputText.trim().length === 0 || isSending}
                        >
                            {isSending
                                ? <ActivityIndicator size="small" color="#fff" />
                                : <RemixIcon name="ri-send-plane-fill" size={18} color="#ffffff" />
                            }
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            )}

            {/* ── Ride-ended floating banner ── */}
            {renderRideEndedBanner()}
        </SafeAreaView>
    );
};

// ─────────────────────────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#020617' },

    // Header
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#0f172a',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    backButton: { padding: 8, marginRight: 8, borderRadius: 10 },
    headerRiderInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    avatarContainer: { position: 'relative' },
    avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1e293b' },
    onlineStatus: {
        position: 'absolute', bottom: 0, right: 0,
        width: 11, height: 11, borderRadius: 6,
        borderWidth: 2, borderColor: '#0f172a',
    },
    riderName: { fontSize: 15, fontFamily: typography.bold, color: '#ffffff' },
    riderStatus: { fontSize: 11, fontFamily: typography.semiBold, marginTop: 1 },
    callButton: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: 'rgba(16,185,129,0.1)',
        alignItems: 'center', justifyContent: 'center',
    },

    // Order pill
    orderPill: {
        flexDirection: 'row', alignItems: 'center', gap: 6,
        alignSelf: 'center', marginTop: 10,
        backgroundColor: '#0f172a', paddingHorizontal: 12, paddingVertical: 5,
        borderRadius: 20, borderWidth: 1, borderColor: '#1e293b',
    },
    orderPillText: { fontSize: 9, fontFamily: typography.bold, color: '#64748b', letterSpacing: 1 },

    // Loading
    loadingBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingText: { fontSize: 13, fontFamily: typography.medium, color: '#475569' },

    // Empty state
    emptyBox: { paddingTop: 80, alignItems: 'center', gap: 8 },
    emptyText: { fontSize: 16, fontFamily: typography.bold, color: '#334155' },
    emptySub: { fontSize: 12, fontFamily: typography.medium, color: '#475569' },

    // Messages
    messagesList: { padding: 16 },
    messageContainer: { marginBottom: 14, flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
    userMessage: { justifyContent: 'flex-end' },
    riderMessage: { justifyContent: 'flex-start' },
    msgAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#1e293b' },
    messageBubble: {
        maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.12, shadowRadius: 4, elevation: 2,
    },
    userBubble: { backgroundColor: '#10b981', borderBottomRightRadius: 4 },
    riderBubble: { backgroundColor: '#1e293b', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
    messageText: { fontSize: 15, fontFamily: typography.medium, lineHeight: 22 },
    userMessageText: { color: '#ffffff' },
    riderMessageText: { color: '#e2e8f0' },
    timestampRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, alignSelf: 'flex-end' },
    timestamp: { fontSize: 9, fontFamily: typography.medium },
    userTimestamp: { color: 'rgba(255,255,255,0.6)' },
    riderTimestamp: { color: '#475569' },

    // Input bar
    inputContainer: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        padding: 12, paddingHorizontal: 16,
        backgroundColor: '#0f172a',
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.06)',
    },
    input: {
        flex: 1,
        backgroundColor: '#1e293b',
        borderRadius: 24,
        paddingHorizontal: 16, paddingVertical: 10,
        fontSize: 15, fontFamily: typography.medium, color: '#ffffff',
        maxHeight: 100,
        borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)',
    },
    sendButton: {
        width: 42, height: 42, borderRadius: 21,
        alignItems: 'center', justifyContent: 'center',
    },
    sendButtonActive: { backgroundColor: '#10b981' },
    sendButtonDisabled: { backgroundColor: 'rgba(255,255,255,0.06)' },

    // Ride-ended banner
    rideEndedBanner: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: 16, paddingBottom: 24,
        backgroundColor: '#020617',
        borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.08)',
        gap: 12,
    },
    rideEndedInner: {
        flexDirection: 'row', alignItems: 'center', gap: 14,
        padding: 16, borderRadius: 20, borderWidth: 1,
    },
    bannerCompleted: {
        backgroundColor: 'rgba(16,185,129,0.08)',
        borderColor: 'rgba(16,185,129,0.2)',
    },
    bannerCancelled: {
        backgroundColor: 'rgba(239,68,68,0.08)',
        borderColor: 'rgba(239,68,68,0.2)',
    },
    bannerIconBox: {
        width: 52, height: 52, borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.04)',
        alignItems: 'center', justifyContent: 'center',
    },
    bannerTitle: { fontSize: 15, fontFamily: typography.bold, color: '#f1f5f9', marginBottom: 3 },
    bannerSub: { fontSize: 12, fontFamily: typography.medium, color: '#64748b', lineHeight: 16 },
    bannerBtn: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        gap: 8, paddingVertical: 14, borderRadius: 16,
    },
    bannerBtnGreen: { backgroundColor: '#10b981' },
    bannerBtnRed: { backgroundColor: '#ef4444' },
    bannerBtnText: { fontSize: 12, fontFamily: typography.bold, color: '#fff', letterSpacing: 1 },
});

export default RiderChatPage;
