import React from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { RemixIcon } from '../../utils/icons';
import { navigateTo } from '../../utils/navigation';

export const ChatFloatingButton: React.FC = () => {
    const handlePress = () => {
        navigateTo('/support-chat');
    };

    return (
        <TouchableOpacity
            onPress={handlePress}
            style={styles.container}
            activeOpacity={0.85}
        >
            <View style={styles.bubble}>
                <RemixIcon name="ri-customer-service-2-fill" size={32} color="#ffffff" />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 100,
        right: 24,
        zIndex: 100,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.18,
        shadowRadius: 16,
        elevation: 16,
    },
    bubble: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#10b981',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#fff',
    },
});
