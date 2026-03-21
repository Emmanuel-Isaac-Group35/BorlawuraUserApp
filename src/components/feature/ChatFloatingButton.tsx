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
            activeOpacity={0.8}
        >
            <View style={styles.bubble}>
                <RemixIcon name="ri-customer-service-2-fill" size={28} color="#ffffff" />
            </View>
        </TouchableOpacity>
    );
};

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 90, // Slightly higher to avoid overlap with bottom navigation on some devices
        right: 20,
        zIndex: 100,
    },
    bubble: {
        width: 56,
        height: 56,
        borderRadius: 20, // Rounded square as per screenshot
        backgroundColor: '#10b981', // Borla Wura Green
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 8,
    },
});
