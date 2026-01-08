import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { RemixIcon } from '../../../utils/icons';

interface WasteTypeSelectorProps {
  selectedTypes: string[];
  selectedSize: string;
  notes: string;
  onTypesChange: (types: string[]) => void;
  onSizeChange: (size: string) => void;
  onNotesChange: (notes: string) => void;
}

export const WasteTypeSelector: React.FC<WasteTypeSelectorProps> = ({ 
  selectedTypes, 
  selectedSize, 
  notes,
  onTypesChange, 
  onSizeChange, 
  onNotesChange 
}) => {
  const wasteTypes = [
    {
      id: 'general',
      title: 'General Household Waste',
      description: 'Regular trash, food waste, non-recyclables',
      icon: 'https://readdy.ai/api/search-image?query=icon%2C%203D%20cartoon%20household%20waste%20bin%2C%20the%20icon%20should%20take%20up%2070%25%20of%20the%20frame%2C%20vibrant%20colors%20with%20soft%20gradients%2C%20minimalist%20design%2C%20smooth%20rounded%20shapes%2C%20subtle%20shading%2C%20no%20outlines%2C%20centered%20composition%2C%20isolated%20on%20white%20background%2C%20playful%20and%20friendly%20aesthetic%2C%20isometric%20perspective%2C%20high%20detail%20quality%2C%20clean%20and%20modern%20look%2C%20single%20object%20focus&width=80&height=80&seq=waste1&orientation=squarish',
      color: '#f3f4f6'
    },
    {
      id: 'recyclables',
      title: 'Recyclables',
      description: 'Plastic bottles, cans, paper, cardboard',
      icon: 'https://readdy.ai/api/search-image?query=icon%2C%203D%20cartoon%20recycling%20symbol%20with%20bottles%20and%20cans%2C%20the%20icon%20should%20take%20up%2070%25%20of%20the%20frame%2C%20vibrant%20green%20colors%20with%20soft%20gradients%2C%20minimalist%20design%2C%20smooth%20rounded%20shapes%2C%20subtle%20shading%2C%20no%20outlines%2C%20centered%20composition%2C%20isolated%20on%20white%20background%2C%20playful%20and%20friendly%20aesthetic%2C%20isometric%20perspective%2C%20high%20detail%20quality%2C%20clean%20and%20modern%20look%2C%20single%20object%20focus&width=80&height=80&seq=waste2&orientation=squarish',
      color: '#dcfce7'
    },
    {
      id: 'organic',
      title: 'Organic Waste',
      description: 'Food scraps, garden waste, compostables',
      icon: 'https://readdy.ai/api/search-image?query=icon%2C%203D%20cartoon%20organic%20waste%20with%20fruits%20and%20vegetables%2C%20the%20icon%20should%20take%20up%2070%25%20of%20the%20frame%2C%20vibrant%20brown%20and%20green%20colors%20with%20soft%20gradients%2C%20minimalist%20design%2C%20smooth%20rounded%20shapes%2C%20subtle%20shading%2C%20no%20outlines%2C%20centered%20composition%2C%20isolated%20on%20white%20background%2C%20playful%20and%20friendly%20aesthetic%2C%20isometric%20perspective%2C%20high%20detail%20quality%2C%20clean%20and%20modern%20look%2C%20single%20object%20focus&width=80&height=80&seq=waste3&orientation=squarish',
      color: '#fef3c7'
    }
  ];

  const bagSizes = [
    { id: 'small', title: 'Small Bag', description: '1-2 bags', price: '+₵0' },
    { id: 'medium', title: 'Medium Bin', description: '3-5 bags', price: '+₵5' },
    { id: 'large', title: 'Large Sack', description: '6+ bags', price: '+₵10' }
  ];

  const toggleWasteType = (typeId: string) => {
    if (selectedTypes.includes(typeId)) {
      onTypesChange(selectedTypes.filter(id => id !== typeId));
    } else {
      onTypesChange([...selectedTypes, typeId]);
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.title}>Waste Details</Text>
      <Text style={styles.subtitle}>What type of waste do you have?</Text>
      
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Waste Categories</Text>
          <View style={styles.wasteTypesList}>
            {wasteTypes.map((type) => {
              const isSelected = selectedTypes.includes(type.id);
              return (
                <TouchableOpacity
                  key={type.id}
                  onPress={() => toggleWasteType(type.id)}
                  style={[
                    styles.wasteTypeCard,
                    isSelected && styles.wasteTypeCardActive
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={styles.wasteTypeContent}>
                    <View style={[styles.iconContainer, { backgroundColor: type.color }]}>
                      <Image source={{ uri: type.icon }} style={styles.typeImage} resizeMode="cover" />
                    </View>
                    <View style={styles.wasteTypeInfo}>
                      <Text style={styles.wasteTypeTitle}>{type.title}</Text>
                      <Text style={styles.wasteTypeDescription}>{type.description}</Text>
                    </View>
                    <View style={styles.checkContainer}>
                      {isSelected && (
                        <RemixIcon name="ri-check-line" size={20} color="#10b981" />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estimated Volume</Text>
          <View style={styles.bagSizesList}>
            {bagSizes.map((size) => {
              const isSelected = selectedSize === size.id;
              return (
                <TouchableOpacity
                  key={size.id}
                  onPress={() => onSizeChange(size.id)}
                  style={[
                    styles.bagSizeCard,
                    isSelected && styles.bagSizeCardActive
                  ]}
                  activeOpacity={0.8}
                >
                  <View style={styles.bagSizeContent}>
                    <View style={styles.bagSizeInfo}>
                      <Text style={styles.bagSizeTitle}>{size.title}</Text>
                      <Text style={styles.bagSizeDescription}>{size.description}</Text>
                    </View>
                    <Text style={styles.bagSizePrice}>{size.price}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Special Instructions (Optional)</Text>
          <TextInput
            value={notes}
            onChangeText={onNotesChange}
            placeholder="Any special instructions for the pickup..."
            style={styles.notesInput}
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
            maxLength={500}
          />
          <Text style={styles.characterCount}>{notes.length}/500 characters</Text>
        </View>
      </View>
    </ScrollView>
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
  content: {
    gap: 24,
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  wasteTypesList: {
    gap: 12,
  },
  wasteTypeCard: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  wasteTypeCardActive: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  wasteTypeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeImage: {
    width: '100%',
    height: '100%',
  },
  wasteTypeInfo: {
    flex: 1,
  },
  wasteTypeTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  wasteTypeDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  checkContainer: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bagSizesList: {
    gap: 12,
  },
  bagSizeCard: {
    width: '100%',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    backgroundColor: '#ffffff',
  },
  bagSizeCardActive: {
    borderColor: '#10b981',
    backgroundColor: '#ecfdf5',
  },
  bagSizeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bagSizeInfo: {
    flex: 1,
  },
  bagSizeTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
    marginBottom: 4,
  },
  bagSizeDescription: {
    fontSize: 14,
    color: '#6b7280',
  },
  bagSizePrice: {
    fontSize: 16,
    fontWeight: '500',
    color: '#10b981',
  },
  notesInput: {
    width: '100%',
    padding: 12,
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    fontSize: 14,
    color: '#1f2937',
    minHeight: 80,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'right',
  },
});
