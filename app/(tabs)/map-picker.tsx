import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MapPicker from '../../components/MapPicker';

export default function MapPickerScreen() {
  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>اختيار موقع على الخريطة</Text>
      <MapPicker
        label="اضغط على الخريطة لاختيار الموقع"
        onLocationSelect={setCoords}
      />
      {coords && (
        <Text style={styles.coords}>
          الإحداثيات المختارة: {coords.latitude.toFixed(5)}, {coords.longitude.toFixed(5)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 16,
  },
  coords: {
    marginTop: 16,
    fontSize: 16,
    color: '#444',
  },
}); 