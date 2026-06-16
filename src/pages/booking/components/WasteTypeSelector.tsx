import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { RemixIcon } from '../../../utils/icons';
import { typography } from '../../../utils/typography';

interface WasteTypeSelectorProps {
  selectedSize: string;
  notes: string;
  onSizeChange: (size: string) => void;
  onNotesChange: (notes: string) => void;
}

export const WasteTypeSelector: React.FC<WasteTypeSelectorProps> = ({ 
  selectedSize, 
  notes,
  onSizeChange, 
  onNotesChange 
}) => {
  const bagSizes = [
    { id: 'small', title: 'Small', label: '1 - 2 Bags', icon: 'ri-shopping-bag-3-fill' },
    { id: 'medium', title: 'Medium', label: '3 - 5 Bags', icon: 'ri-handbag-fill' },
    { id: 'large', title: 'Large', label: '6+ / Sacks', icon: 'ri-archive-fill' },
    { id: 'xl', title: 'Extra Large', label: 'Truck Load', icon: 'ri-truck-fill' }
  ];

  return (
    <View style={styles.container}>
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
                <View style={[styles.sizeIconBox, isSelected && styles.sizeIconBoxActive]}>
                  <RemixIcon name={size.icon} size={22} color={isSelected ? "#10b981" : "#94a3b8"} />
                </View>
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
            placeholder="e.g. Near the main gate or trash chute..."
            style={styles.input}
            placeholderTextColor="#94a3b8"
            multiline
            numberOfLines={3}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: 20 },
  section: { gap: 10 },
  sectionLabel: { fontSize: 11, fontFamily: typography.bold, color: '#94a3b8', letterSpacing: 1.5, marginBottom: 4 },
  sizeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12 },
  sizeCard: {
    width: '48%',
    padding: 14,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    alignItems: 'center',
    gap: 4
  },
  sizeCardActive: { borderColor: '#10b981', backgroundColor: '#f0fdf4' },
  sizeIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#f8fafc', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  sizeIconBoxActive: { backgroundColor: '#e6fcf0' },
  sizeTitle: { fontSize: 14, fontFamily: typography.bold, color: '#1e293b' },
  sizeTitleActive: { color: '#065f46' },
  sizeLabel: { fontSize: 11, fontFamily: typography.medium, color: '#94a3b8' },
  inputBox: { backgroundColor: '#f8fafc', borderRadius: 18, paddingHorizontal: 16, paddingVertical: 12, borderWidth: 1.5, borderColor: '#cbd5e1' },
  input: { fontSize: 14, fontFamily: typography.medium, color: '#0f172a', minHeight: 80, textAlignVertical: 'top' },
});
