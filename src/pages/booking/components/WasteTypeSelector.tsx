import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, TextInput, ScrollView } from 'react-native';
import { RemixIcon } from '../../../utils/icons';
import { typography } from '../../../utils/typography';

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
      title: 'General Household',
      description: 'Regular trash, food, non-recyclables',
      icon: 'https://cdn-icons-png.flaticon.com/512/3299/3299935.png',
      color: '#f8fafc'
    },
    {
      id: 'plastic',
      title: 'Plastic & Bottles',
      description: 'PET bottles, containers, clean plastic',
      icon: 'https://cdn-icons-png.flaticon.com/512/2666/2666631.png',
      color: '#f8fafc'
    }
  ];

  const bagSizes = [
    { id: 'small', title: 'Small', description: '1-2 regular bags' },
    { id: 'medium', title: 'Medium', description: '3-4 regular bags' },
    { id: 'large', title: 'Large', description: '5+ bags / Big sack' }
  ];

  const toggleWasteType = (typeId: string) => {
    if (selectedTypes.includes(typeId)) {
      onTypesChange(selectedTypes.filter(id => id !== typeId));
    } else {
      onTypesChange([...selectedTypes, typeId]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Waste Details</Text>
        <Text style={styles.subtitle}>Help us understand your pickup needs</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.grid}>
          {wasteTypes.map((type) => {
            const isSelected = selectedTypes.includes(type.id);
            return (
              <TouchableOpacity
                key={type.id}
                onPress={() => toggleWasteType(type.id)}
                style={[styles.typeCard, isSelected && styles.typeCardActive]}
                activeOpacity={0.8}
              >
                <View style={styles.typeIconBox}>
                  <Image source={{ uri: type.icon }} style={styles.typeImage} />
                </View>
                <Text style={styles.typeTitle}>{type.title}</Text>
                <Text style={styles.typeDesc} numberOfLines={2}>{type.description}</Text>
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <RemixIcon name="ri-check-line" size={10} color="#fff" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Volume / Size</Text>
        <View style={styles.sizeList}>
          {bagSizes.map((size) => {
            const isSelected = selectedSize === size.id;
            return (
              <TouchableOpacity
                key={size.id}
                onPress={() => onSizeChange(size.id)}
                style={[styles.sizeItem, isSelected && styles.sizeItemActive]}
                activeOpacity={0.8}
              >
                <View style={[styles.radio, isSelected && styles.radioActive]}>
                  {isSelected && <View style={styles.radioDot} />}
                </View>
                <View style={styles.sizeInfo}>
                  <Text style={[styles.sizeTitle, isSelected && styles.sizeTitleActive]}>{size.title}</Text>
                  <Text style={styles.sizeDesc}>{size.description}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Additional Notes</Text>
        <TextInput
          value={notes}
          onChangeText={onNotesChange}
          placeholder="e.g. Near the blue gate, heavy items..."
          style={styles.input}
          placeholderTextColor="#94a3b8"
          multiline
          numberOfLines={3}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { marginBottom: 20 },
  title: { fontSize: 20, fontFamily: typography.bold, color: '#0f172a' },
  subtitle: { fontSize: 13, fontFamily: typography.medium, color: '#94a3b8', marginTop: 2 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 14, fontFamily: typography.bold, color: '#1e293b', marginBottom: 12 },
  grid: { flexDirection: 'row', gap: 12 },
  typeCard: {
    flex: 1,
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    alignItems: 'center',
    position: 'relative',
  },
  typeCardActive: { borderColor: '#10b981', backgroundColor: '#f0fdf4' },
  typeIconBox: { width: 50, height: 50, marginBottom: 10 },
  typeImage: { width: '100%', height: '100%' },
  typeTitle: { fontSize: 14, fontFamily: typography.bold, color: '#1e293b', textAlign: 'center' },
  typeDesc: { fontSize: 11, fontFamily: typography.medium, color: '#64748b', textAlign: 'center', marginTop: 4 },
  checkBadge: { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' },
  sizeList: { gap: 10 },
  sizeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sizeItemActive: { borderColor: '#10b981', backgroundColor: '#f0fdf4' },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#cbd5e1', alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: '#10b981' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#10b981' },
  sizeInfo: { marginLeft: 12 },
  sizeTitle: { fontSize: 14, fontFamily: typography.bold, color: '#1e293b' },
  sizeTitleActive: { color: '#0f172a' },
  sizeDesc: { fontSize: 12, fontFamily: typography.medium, color: '#64748b', marginTop: 2 },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 16,
    padding: 16,
    fontSize: 14,
    color: '#0f172a',
    fontFamily: typography.medium,
    minHeight: 100,
    textAlignVertical: 'top',
  },
});
