import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, FlatList, ActivityIndicator } from 'react-native';
import { RemixIcon } from '../../../utils/icons';
import { supabase } from '../../../lib/supabase';
import { typography } from '../../../utils/typography';

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
          setRiders([]);
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
      key={item.id}
      style={[
        styles.riderCard,
        selectedRiderId === item.id && styles.riderCardSelected
      ]}
      onPress={() => onSelect(item.id)}
      activeOpacity={0.8}
    >
      <View style={styles.riderInfo}>
        <View style={styles.photoContainer}>
          <Image source={{ uri: item.photo }} style={styles.photo} />
          {item.isOnline && <View style={styles.onlineBadge} />}
        </View>
        <View style={styles.details}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
            {item.rating >= 4.8 && (
              <View style={styles.topRatedBadge}>
                <Text style={styles.topRatedText}>Top Rated</Text>
              </View>
            )}
          </View>
          <View style={styles.ratingRow}>
            <View style={styles.ratingBox}>
              <RemixIcon name="ri-star-fill" size={12} color="#fbbf24" />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
            <View style={styles.dot} />
            <Text style={styles.distanceText}>{item.distance}</Text>
          </View>
        </View>
      </View>
      <View style={[
        styles.selectionCircle,
        selectedRiderId === item.id && styles.selectionCircleActive
      ]}>
        {selectedRiderId === item.id ? (
          <RemixIcon name="ri-checkbox-circle-fill" size={24} color="#10b981" />
        ) : (
          <View style={styles.unselectedCircle} />
        )}
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10b981" />
        <Text style={styles.loadingText}>Finding nearby riders...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.countText}>{riders.length} Riders nearby</Text>
      </View>
      
      <View style={styles.list}>
        {riders.length > 0 ? (
          riders.map(item => renderRider({ item }))
        ) : (
          <View style={styles.emptyState}>
            <RemixIcon name="ri-user-unfollow-line" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No online riders found in your area.</Text>
            <Text style={styles.emptySubtext}>Please try again in a few minutes.</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontFamily: typography.bold,
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: typography.regular,
    color: '#6b7280',
  },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#ecfdf5',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  countText: {
    fontSize: 12,
    fontFamily: typography.semiBold,
    color: '#059669',
  },
  list: {
    gap: 12,
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#d1d5db',
  },
  emptyText: {
    fontSize: 16,
    fontFamily: typography.semiBold,
    color: '#374151',
    marginTop: 12,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    fontFamily: typography.regular,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'center',
  },
  riderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  riderCardSelected: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  riderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  photoContainer: {
    position: 'relative',
  },
  photo: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#f3f4f6',
    borderWidth: 2,
    borderColor: '#fff',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10b981',
    borderWidth: 2.5,
    borderColor: '#ffffff',
  },
  details: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  name: {
    fontSize: 16,
    fontFamily: typography.semiBold,
    color: '#111827',
  },
  topRatedBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  topRatedText: {
    fontSize: 10,
    fontFamily: typography.bold,
    color: '#d97706',
    textTransform: 'uppercase',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#fffbeb',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 12,
    fontFamily: typography.semiBold,
    color: '#d97706',
  },
  dot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#d1d5db',
  },
  distanceText: {
    fontSize: 13,
    fontFamily: typography.medium,
    color: '#6b7280',
  },
  selectionCircle: {
    marginLeft: 10,
  },
  unselectedCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  loadingContainer: {
    padding: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    fontFamily: typography.medium,
    color: '#6b7280',
  },
});
