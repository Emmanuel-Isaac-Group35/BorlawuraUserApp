import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { RemixIcon } from '../../utils/icons';
import { navigateTo } from '../../utils/navigation';

export const ChatFloatingButton: React.FC = () => {
    const handlePress = () => {
        navigateTo('/chatbot');
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            style={styles.container}
            activeOpacity={0.8}
        >
            <View style={styles.bubble}>
                <RemixIcon name="ri-chat-smile-3-fill" size={28} color="#ffffff" />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 80, // Above the bottom navigation (64px + 16px margin)
        right: 16,
        zIndex: 100,
    },
    bubble: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#10b981',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#10b981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 6,
    },
});
