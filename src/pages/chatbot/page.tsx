import React from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useNavigation } from '@react-navigation/native';
import { RemixIcon } from '../../utils/icons';

const CHATBOT_WIDGET_HTML = `
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Borla Wura Chatbot</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/remixicon/4.5.0/remixicon.min.css">
    <style>
      html, body {
        margin: 0;
        padding: 0;
        height: 100%;
        width: 100%;
        font-family: 'Montserrat', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        background-color: #F9FAFB;
      }
      #root {
        height: 100%;
        width: 100%;
      }
      #vapi-widget-floating-button {
        bottom: 40px !important;
      }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script 
      src="https://readdy.ai/api/public/assistant/widget?projectId=bcbc1fd3-afd0-404e-9cdb-114022b252d3"
      mode="hybrid"
      voice-show-transcript="true"
      theme="light"
      size="tiny"
      accent-color="#10B981"
      button-base-color="#059669"
      button-accent-color="#FFFFFF"
      main-label="Chat with Borla Wura Support"
      start-button-text="Start Chat"
      end-button-text="End Chat"
      defer
    ></script>
  </body>
  </html>
`;

const ChatbotPage: React.FC = () => {
    const navigation = useNavigation();

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={styles.backButton}
                >
                    <RemixIcon name="ri-arrow-left-line" size={24} color="#1f2937" />
                </TouchableOpacity>
                <View style={styles.headerText}>
                    <Text style={styles.title}>Live Chat Support</Text>
                    <Text style={styles.subtitle}>Chat with our AI assistant</Text>
                </View>
            </View>
            <View style={styles.webviewContainer}>
                <WebView
                    originWhitelist={['*']}
                    source={{ html: CHATBOT_WIDGET_HTML }}
                    startInLoadingState
                    renderLoading={() => (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#10B981" />
                        </View>
                    )}
                    javaScriptEnabled={true}
                    domStorageEnabled={true}
                />
            </View>
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
        gap: 12,
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 16,
        backgroundColor: '#ffffff',
        borderBottomWidth: 1,
        borderBottomColor: '#f3f4f6',
    },
    backButton: {
        width: 40,
        height: 40,
        backgroundColor: '#ffffff',
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#f3f4f6',
    },
    headerText: {
        flex: 1,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1f2937',
    },
    subtitle: {
        fontSize: 14,
        color: '#4b5563',
    },
    webviewContainer: {
        flex: 1,
        backgroundColor: '#ffffff',
    },
    loadingContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#ffffff',
    },
});

export default ChatbotPage;
