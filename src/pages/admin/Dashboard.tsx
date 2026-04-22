import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const StatCard = ({ title, value, icon, color }: any) => (
  <View style={styles.statCard}>
    <View style={[styles.iconContainer, { backgroundColor: color + '20' }]}>
      <MaterialCommunityIcons name={icon} size={24} color={color} />
    </View>
    <View>
      <Text style={styles.statLabel}>{title}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  </View>
);

const AdminDashboard = () => {
  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1a1a2e', '#16213e']}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.title}>Zeal SMS Admin</Text>
          </View>
          <TouchableOpacity style={styles.profileButton}>
            <MaterialCommunityIcons name="bell-outline" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard 
            title="Total Sent" 
            value="1.2M" 
            icon="send-circle-outline" 
            color="#4ecca3" 
          />
          <StatCard 
            title="Delivery Rate" 
            value="98.5%" 
            icon="check-decagram-outline" 
            color="#45b7d1" 
          />
          <StatCard 
            title="Active Campaigns" 
            value="24" 
            icon="bullhorn-outline" 
            color="#ff8c94" 
          />
          <StatCard 
            title="Revenue" 
            value="$12.4k" 
            icon="currency-usd" 
            color="#f9d5bb" 
          />
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Campaigns</Text>
          {[1, 2, 3].map((i) => (
            <TouchableOpacity key={i} style={styles.activityItem}>
              <View style={styles.activityIcon}>
                <MaterialCommunityIcons name="message-text-outline" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activityTitle}>Ramadan Greetings Bulk</Text>
                <Text style={styles.activitySubtitle}>Sent to 45,000 recipients</Text>
              </View>
              <Text style={styles.activityTime}>2h ago</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionButton}>
              <MaterialCommunityIcons name="plus" size={24} color="#fff" />
              <Text style={styles.actionText}>New Campaign</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <MaterialCommunityIcons name="key-variant" size={24} color="#fff" />
              <Text style={styles.actionText}>API Keys</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    color: '#94a3b8',
    fontSize: 16,
    fontFamily: 'Montserrat-Regular',
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold',
  },
  profileButton: {
    width: 45,
    height: 45,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
    justifyContent: 'space-between',
  },
  statCard: {
    width: (width - 48) / 2,
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 20,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 12,
    fontFamily: 'Montserrat-Medium',
  },
  statValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Montserrat-Bold',
  },
  section: {
    padding: 24,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    fontFamily: 'Montserrat-Bold',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4ecca3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  activitySubtitle: {
    color: '#94a3b8',
    fontSize: 13,
  },
  activityTime: {
    color: '#64748b',
    fontSize: 12,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    height: 100,
    backgroundColor: '#4ecca3',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  actionText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  }
});

export default AdminDashboard;
