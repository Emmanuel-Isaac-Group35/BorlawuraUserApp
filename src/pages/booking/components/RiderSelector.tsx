import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, ActivityIndicator } from 'react-native';
import { RemixIcon } from '../../../utils/icons';
import { supabase } from '../../../lib/supabase';

interface Rider {
  id: string;
  name: string;
  rating: number;
  phone: string;
  photo: string;
  isOnline: boolean;
  distance: string;
}

interface RiderSelectorProps {
  selectedRiderId: string | null;
  onSelect: (riderId: string) => void;
}

export const RiderSelector: React.FC<RiderSelectorProps> = ({ selectedRiderId, onSelect }) => {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRiders = async () => {
      try {
        const { data, error } = await supabase
          .from('riders')
          .select('*')
          .eq('status', 'active')
          .eq('is_online', true)
          .limit(10);

        if (error) throw error;

        if (data && data.length > 0) {
          const formatted = data.map(r => ({
            id: r.id,
            name: r.full_name || `${r.first_name || ''} ${r.last_name || ''}`.trim() || 'Borla Rider',
            rating: r.rating || 5.0,
            phone: r.phone_number || r.phone || '',
            photo: r.avatar_url || 'https://readdy.ai/api/search-image?query=Professional%20African%20male%20waste%20collection%20worker%2C%20friendly%20smile%2C%20uniform&width=100&height=100&seq=rider_list',
            isOnline: r.is_online !== false,
            distance: (Math.random() * 5 + 0.5).toFixed(1) + ' km away'
          }));
          setRiders(formatted);
        } else {
          // Fallback mocks if no riders in DB
          setRiders([
            {
              id: 'mock-1',
              name: 'Kofi Mensah',
              rating: 4.9,
              phone: '024 123 4567',
              photo: 'https://readdy.ai/api/search-image?query=African%20man%20friendly%20smile%20uniform&width=100&height=100&seq=1',
              isOnline: true,
              distance: '0.8 km away'
            },
            {
              id: 'mock-2',
              name: 'Amara Okafor',
              rating: 4.8,
              phone: '027 987 6543',
              photo: 'https://readdy.ai/api/search-image?query=African%20woman%20smiling%20uniform%20professional&width=100&height=100&seq=2',
              isOnline: true,
              distance: '1.2 km away'
            }
          ]);
        }
      } catch (err) {
        console.error('Error fetching riders:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchRiders();

    // Subscribe to rider status changes
    const channel = supabase
      .channel('rider-status-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'riders',
        },
        () => {
          fetchRiders(); // Re-fetch list when any rider status changes
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const renderRider = ({ item }: { item: Rider }) => (
    <TouchableOpacity
      style={[
        styles.riderCard,
        selectedRiderId === item.id && styles.riderCardSelected
      ]}
      onPress={() => onSelect(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.riderInfo}>
        <View style={styles.photoContainer}>
          <Image source={{ uri: item.photo }} style={styles.photo} />
          {item.isOnline && <View style={styles.onlineBadge} />}
        </View>
        <View style={styles.details}>
          <Text style={styles.name}>{item.name}</Text>
          <View style={styles.ratingRow}>
            <RemixIcon name="ri-star-fill" size={14} color="#fbbf24" />
            <Text style={styles.rating}>{item.rating}</Text>
            <View style={styles.dot} />
            <Text style={styles.distance}>{item.distance}</Text>
          </View>
        </View>
      </View>
      <View style={[
        styles.selectionCircle,
        selectedRiderId === item.id && styles.selectionCircleActive
      ]}>
        {selectedRiderId === item.id && <RemixIcon name="ri-check-line" size={14} color="#fff" />}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Fetching available riders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Select Your Rider</Text>
      <Text style={styles.subtitle}>Choose your favorite Borla Wura rider for this pickup</Text>
      
      <View style={styles.list}>
        {riders.map(item => renderRider({ item }))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 24,
  },
  list: {
    gap: 12,
  },
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#f3f4f6',
  },
  riderCardSelected: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f3f4f6',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  details: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rating: {
    fontSize: 14,
    color: '#4b5563',
    fontWeight: '500',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#d1d5db',
    marginHorizontal: 4,
  },
  distance: {
    fontSize: 14,
    color: '#6b7280',
  },
  selectionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionCircleActive: {
    backgroundColor: '#10b981',
    borderColor: '#10b981',
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
});
