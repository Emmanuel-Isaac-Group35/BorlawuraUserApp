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
      title: 'General',
      description: 'Regular household trash',
      icon: 'https://cdn-icons-png.flaticon.com/512/3299/3299935.png',
    },
    {
      id: 'plastic',
      title: 'Recyclables',
      description: 'Plastics, bottles, paper',
      icon: 'https://cdn-icons-png.flaticon.com/512/2666/2666631.png',
    },
    {
      id: 'organic',
      title: 'Organic',
      description: 'Food & garden waste',
      icon: 'https://cdn-icons-png.flaticon.com/512/2933/2933931.png',
    },
    {
      id: 'bulk',
      title: 'Bulk Items',
      description: 'Furniture, appliances',
      icon: 'https://cdn-icons-png.flaticon.com/512/1048/1048329.png',
    }
  ];

  const bagSizes = [
    { id: 'small', title: 'Small', label: '1 - 2 Bags', icon: 'ri-shopping-bag-3-fill' },
    { id: 'medium', title: 'Medium', label: '3 - 5 Bags', icon: 'ri-handbag-fill' },
    { id: 'large', title: 'Large', label: '6+ / Sacks', icon: 'ri-archive-fill' },
    { id: 'xl', title: 'Extra Large', label: 'Truck Load', icon: 'ri-truck-fill' }
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
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>WASTE CATEGORIES</Text>
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
        <Text style={styles.sectionLabel}>CHOOSE VOLUME</Text>
        <View style={styles.sizeGrid}>
          {bagSizes.map((size) => {
            const isSelected = selectedSize === size.id;
            return (
              <TouchableOpacity
                key={size.id}
                onPress={() => onSizeChange(size.id)}
                style={[styles.sizeCard, isSelected && styles.sizeCardActive]}
                activeOpacity={0.8}
              >
                <RemixIcon name={size.icon} size={24} color={isSelected ? "#10b981" : "#94a3b8"} />
                <Text style={[styles.sizeTitle, isSelected && styles.sizeTitleActive]}>{size.title}</Text>
                <Text style={styles.sizeLabel}>{size.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>OPTIONAL INSTRUCTIONS</Text>
        <View style={styles.inputBox}>
          <TextInput
            value={notes}
            onChangeText={onNotesChange}
            placeholder="e.g. Near the main gate..."
            style={styles.input}
            placeholderTextColor="#94a3b8"
            multiline
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 20 },
  section: { gap: 12 },
  sectionLabel: { fontSize: 10, fontFamily: typography.bold, color: '#94a3b8', letterSpacing: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  typeCard: {
    width: '48%',
    padding: 16,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    alignItems: 'center',
    position: 'relative',
  },
  typeCardActive: { borderColor: '#10b981', backgroundColor: '#f0fdf4' },
  typeIconBox: { width: 44, height: 44, marginBottom: 8 },
  typeImage: { width: '100%', height: '100%', opacity: 0.8 },
  typeTitle: { fontSize: 13, fontFamily: typography.bold, color: '#1e293b' },
  checkBadge: { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9, backgroundColor: '#10b981', alignItems: 'center', justifyContent: 'center' },
  sizeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  sizeCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 18,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    alignItems: 'center',
    gap: 4
  },
  sizeCardActive: { borderColor: '#10b981', backgroundColor: '#f0fdf4' },
  sizeTitle: { fontSize: 14, fontFamily: typography.bold, color: '#1e293b' },
  sizeTitleActive: { color: '#065f46' },
  sizeLabel: { fontSize: 11, fontFamily: typography.medium, color: '#94a3b8' },
  inputBox: { backgroundColor: '#f8fafc', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#f1f5f9' },
  input: { fontSize: 14, fontFamily: typography.medium, color: '#0f172a', minHeight: 80, textAlignVertical: 'top' },
});
