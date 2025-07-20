import React, { useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import MapView, { Marker, MapPressEvent } from 'react-native-maps';

interface MapPickerProps {
  initialLocation?: { latitude: number; longitude: number };
  onLocationSelect: (coords: { latitude: number; longitude: number }) => void;
  label?: string;
}

const { width } = Dimensions.get('window');

const DEFAULT_REGION = {
  latitude: 24.0889, // Aswan default
  longitude: 32.8998,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const MapPicker: React.FC<MapPickerProps> = ({ initialLocation, onLocationSelect, label }) => {
  const [selected, setSelected] = useState<{
    latitude: number;
    longitude: number;
  } | null>(initialLocation || null);

  const handlePress = (e: MapPressEvent) => {
    const coords = e.nativeEvent.coordinate;
    setSelected(coords);
    onLocationSelect(coords);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <MapView
        style={styles.map}
        initialRegion={initialLocation ? {
          ...initialLocation,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        } : DEFAULT_REGION}
        onPress={handlePress}
      >
        {selected && <Marker coordinate={selected} />}
      </MapView>
      {selected && (
        <Text style={styles.coords}>
          Selected: {selected.latitude.toFixed(5)}, {selected.longitude.toFixed(5)}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
    alignItems: 'center',
  },
  label: {
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 6,
    fontSize: 15,
  },
  map: {
    width: width - 40,
    height: 220,
    borderRadius: 16,
  },
  coords: {
    marginTop: 8,
    color: '#444',
    fontSize: 13,
  },
});

export default MapPicker;