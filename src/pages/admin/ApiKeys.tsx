import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';

const ApiKeyManager = () => {
  const [keys, setKeys] = useState([
    { id: '1', name: 'Production App', hint: 'sk_live_...', active: true, created: '2024-01-15' },
    { id: '2', name: 'Testing Env', hint: 'sk_test_...', active: false, created: '2024-02-10' },
  ]);

  const copyToClipboard = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copied', 'API Key hint copied to clipboard');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#0f172a', '#1e293b']}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.header}>
        <TouchableOpacity>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>API Keys</Text>
        <TouchableOpacity style={styles.addButton}>
          <MaterialCommunityIcons name="plus" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.infoBox}>
          <MaterialCommunityIcons name="information-outline" size={20} color="#38bdf8" />
          <Text style={styles.infoText}>
            Use these keys to authenticate your requests to the Zeal SMS API. Keep your private keys secure!
          </Text>
        </View>

        {keys.map((key) => (
          <View key={key.id} style={styles.keyCard}>
            <View style={styles.keyHeader}>
              <View>
                <Text style={styles.keyName}>{key.name}</Text>
                <Text style={styles.keyDate}>Created on {key.created}</Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: key.active ? '#05966920' : '#dc262620' }]}>
                <Text style={[styles.statusText, { color: key.active ? '#10b981' : '#ef4444' }]}>
                  {key.active ? 'Active' : 'Revoked'}
                </Text>
              </View>
            </View>

            <View style={styles.keyBox}>
              <Text style={styles.keyHint}>{key.hint}</Text>
              <TouchableOpacity onPress={() => copyToClipboard(key.hint)}>
                <MaterialCommunityIcons name="content-copy" size={20} color="#94a3b8" />
              </TouchableOpacity>
            </View>

            <View style={styles.keyActions}>
              <TouchableOpacity style={styles.actionBtn}>
                <MaterialCommunityIcons name="pencil-outline" size={18} color="#94a3b8" />
                <Text style={styles.actionBtnText}>Rename</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <MaterialCommunityIcons name="refresh" size={18} color="#94a3b8" />
                <Text style={styles.actionBtnText}>Roll Key</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <MaterialCommunityIcons name="trash-can-outline" size={18} color="#ef4444" />
                <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <TouchableOpacity style={styles.generateBtn}>
          <LinearGradient
            colors={['#38bdf8', '#2563eb']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientBtn}
          >
            <Text style={styles.generateBtnText}>Generate New Secret Key</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#38bdf815',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#38bdf830',
  },
  infoText: {
    color: '#38bdf8',
    fontSize: 13,
    marginLeft: 12,
    flex: 1,
    lineHeight: 18,
  },
  keyCard: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  keyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  keyName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  keyDate: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  keyBox: {
    flexDirection: 'row',
    backgroundColor: '#0f172a',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  keyHint: {
    color: '#94a3b8',
    fontFamily: 'monospace',
    fontSize: 14,
  },
  keyActions: {
    flexDirection: 'row',
    gap: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionBtnText: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
  },
  generateBtn: {
    marginTop: 10,
    marginBottom: 40,
  },
  gradientBtn: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  generateBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default ApiKeyManager;
