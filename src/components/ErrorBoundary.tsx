import React, { Component, ReactNode } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RemixIcon } from '../utils/icons';
import { typography } from '../utils/typography';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('CRITICAL APP ERROR:', error);
  }

  handleRestart = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <SafeAreaView style={styles.container}>
          <StatusBar barStyle="dark-content" />
          <View style={styles.content}>
             <View style={styles.iconBox}>
                <RemixIcon name="ri-mist-line" size={48} color="#ef4444" />
             </View>
             
             <Text style={styles.title}>System Interruption</Text>
             <Text style={styles.message}>
               We encountered an unexpected issue while processing your request. Our team has been notified.
             </Text>

             <View style={styles.debugBox}>
                <Text style={styles.debugTitle}>Error Trace</Text>
                <ScrollView style={styles.debugScroll}>
                   <Text style={styles.debugText}>{this.state.error?.message}</Text>
                   <Text style={[styles.debugText, { marginTop: 8, opacity: 0.6 }]}>{this.state.error?.stack}</Text>
                </ScrollView>
             </View>

             <TouchableOpacity onPress={this.handleRestart} style={styles.restartBtn}>
                <Text style={styles.restartText}>Restart BorlaWura</Text>
                <RemixIcon name="ri-refresh-line" size={18} color="#fff" />
             </TouchableOpacity>

             <Text style={styles.footer}>If the issue persists, please contact support.</Text>
          </View>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    padding: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconBox: {
    width: 100,
    height: 100,
    borderRadius: 32,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontFamily: typography.bold,
    color: '#0f172a',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    fontFamily: typography.medium,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  debugBox: {
    width: '100%',
    height: 180,
    backgroundColor: '#f8fafc',
    borderRadius: 24,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    marginBottom: 32,
  },
  debugTitle: {
    fontSize: 12,
    fontFamily: typography.bold,
    color: '#94a3b8',
    textTransform: 'uppercase',
    marginBottom: 8,
    letterSpacing: 1,
  },
  debugScroll: {
    flex: 1,
  },
  debugText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#475569',
  },
  restartBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0f172a',
    paddingHorizontal: 32,
    height: 60,
    borderRadius: 20,
    gap: 12,
    width: '100%',
  },
  restartText: {
    fontSize: 16,
    fontFamily: typography.bold,
    color: '#fff',
  },
  footer: {
    marginTop: 24,
    fontSize: 13,
    fontFamily: typography.medium,
    color: '#94a3b8',
  }
});
