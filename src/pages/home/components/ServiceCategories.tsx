import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';

interface Category {
  id: string;
  title: string;
  description: string;
  image: string;
  color: string;
}

export const ServiceCategories: React.FC = () => {
  const categories: Category[] = [
    {
      id: 'household',
      title: 'Household Waste',
      description: 'General trash & kitchen waste',
      image: 'https://readdy.ai/api/search-image?query=icon%2C%203D%20cartoon%20household%20waste%20bin%2C%20colorful%20trash%20bags%2C%20the%20icon%20should%20take%20up%2070%25%20of%20the%20frame%2C%20vibrant%20colors%20with%20soft%20gradients%2C%20minimalist%20design%2C%20smooth%20rounded%20shapes%2C%20subtle%20shading%2C%20no%20outlines%2C%20centered%20composition%2C%20isolated%20on%20white%20background%2C%20playful%20and%20friendly%20aesthetic%2C%20isometric%20perspective%2C%20high%20detail%20quality%2C%20clean%20and%20modern%20look%2C%20single%20object%20focus&width=100&height=100&seq=cat1&orientation=squarish',
      color: '#ef4444'
    },
    {
      id: 'recyclables',
      title: 'Recyclables',
      description: 'Plastic, paper, cans & bottles',
      image: 'https://readdy.ai/api/search-image?query=icon%2C%203D%20cartoon%20recycling%20symbols%20with%20plastic%20bottles%20and%20paper%2C%20the%20icon%20should%20take%20up%2070%25%20of%20the%20frame%2C%20vibrant%20green%20colors%20with%20soft%20gradients%2C%20minimalist%20design%2C%20smooth%20rounded%20shapes%2C%20subtle%20shading%2C%20no%20outlines%2C%20centered%20composition%2C%20isolated%20on%20white%20background%2C%20playful%20and%20friendly%20aesthetic%2C%20isometric%20perspective%2C%20high%20detail%20quality%2C%20clean%20and%20modern%20look%2C%20single%20object%20focus&width=100&height=100&seq=cat2&orientation=squarish',
      color: '#22c55e'
    },
    {
      id: 'organic',
      title: 'Organic Waste',
      description: 'Food scraps & garden waste',
      image: 'https://readdy.ai/api/search-image?query=icon%2C%203D%20cartoon%20organic%20waste%20compost%20bin%20with%20vegetables%20and%20fruits%2C%20the%20icon%20should%20take%20up%2070%25%20of%20the%20frame%2C%20vibrant%20brown%20and%20green%20colors%20with%20soft%20gradients%2C%20minimalist%20design%2C%20smooth%20rounded%20shapes%2C%20subtle%20shading%2C%20no%20outlines%2C%20centered%20composition%2C%20isolated%20on%20white%20background%2C%20playful%20and%20friendly%20aesthetic%2C%20isometric%20perspective%2C%20high%20detail%20quality%2C%20clean%20and%20modern%20look%2C%20single%20object%20focus&width=100&height=100&seq=cat3&orientation=squarish',
      color: '#f59e0b'
    },
    {
      id: 'bulk',
      title: 'Bulk Items',
      description: 'Furniture & large items',
      image: 'https://readdy.ai/api/search-image?query=icon%2C%203D%20cartoon%20furniture%20and%20large%20household%20items%2C%20the%20icon%20should%20take%20up%2070%25%20of%20the%20frame%2C%20vibrant%20blue%20colors%20with%20soft%20gradients%2C%20minimalist%20design%2C%20smooth%20rounded%20shapes%2C%20subtle%20shading%2C%20no%20outlines%2C%20centered%20composition%2C%20isolated%20on%20white%20background%2C%20playful%20and%20friendly%20aesthetic%2C%20isometric%20perspective%2C%20high%20detail%20quality%2C%20clean%20and%20modern%20look%2C%20single%20object%20focus&width=100&height=100&seq=cat4&orientation=squarish',
      color: '#3b82f6'
    }
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>What do you need to dispose?</Text>
      
      <View style={styles.grid}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={styles.categoryCard}
            activeOpacity={0.8}
          >
            <View style={styles.categoryContent}>
              <View style={styles.imageContainer}>
                <Image 
                  source={{ uri: category.image }}
                  style={styles.categoryImage}
                  resizeMode="cover"
                />
              </View>
              <Text style={styles.categoryTitle} numberOfLines={1}>
                {category.title}
              </Text>
              <Text style={styles.categoryDescription} numberOfLines={2}>
                {category.description}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  categoryCard: {
    width: '47%',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryContent: {
    alignItems: 'center',
  },
  imageContainer: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  categoryTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  categoryDescription: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 16,
    textAlign: 'center',
  },
});
