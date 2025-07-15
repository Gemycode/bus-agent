import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { CustomButton } from '../../components/CustomButton';
import { Colors } from '../../constants/Colors';
import { MapPin, Navigation, Clock } from 'lucide-react-native';
import MapView, { Marker } from 'react-native-maps';
import { WebView } from 'react-native-webview';

import { BusLocation } from '../../types';

export default function TrackingScreen() {
  const { user } = useAuth();
  const [activeBuses, setActiveBuses] = useState<BusLocation[]>([]);
  const [selectedBus, setSelectedBus] = useState<BusLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [region, setRegion] = useState({
    latitude: 37.78825,
    longitude: -122.4324,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    loadActiveBuses();
    const interval = setInterval(loadActiveBuses, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadActiveBuses = async () => {
    try {
      let buses = await apiService.getActiveBusLocations() as BusLocation[];
      if (!Array.isArray(buses) || buses.length === 0) {
        // Create sample bus data for demo
        buses = [
          {
            _id: 'bus-1',
            busId: {
              _id: 'bus-1',
              BusNumber: '1',
              capacity: 30
            },
            driverId: {
              _id: 'driver-1',
              firstName: 'Ahmed',
              lastName: 'Ali'
            },
            routeId: {
              _id: 'route-1',
              name: 'Route 1',
              start_point: { name: 'Start', lat: 30.0444, long: 31.2357 },
              end_point: { name: 'End', lat: 30.0544, long: 31.2457 },
              stops: []
            },
            currentLocation: {
              latitude: 30.0444,
              longitude: 31.2357
            },
            speed: 35,
            heading: 45,
            status: 'active',
            lastUpdate: new Date().toISOString(),
          },
          {
            _id: 'bus-2',
            busId: {
              _id: 'bus-2',
              BusNumber: '2',
              capacity: 25
            },
            driverId: {
              _id: 'driver-2',
              firstName: 'Mohamed',
              lastName: 'Hassan'
            },
            routeId: {
              _id: 'route-2',
              name: 'Route 2',
              start_point: { name: 'Start', lat: 30.0544, long: 31.2457 },
              end_point: { name: 'End', lat: 30.0644, long: 31.2557 },
              stops: []
            },
            currentLocation: {
              latitude: 30.0544,
              longitude: 31.2457
            },
            speed: 28,
            heading: 90,
            status: 'active',
            lastUpdate: new Date().toISOString(),
          }
        ];
      }
      setActiveBuses(buses);
      
      if (buses.length > 0 && !selectedBus) {
        setSelectedBus(buses[0]);
        setRegion({
          latitude: buses[0].currentLocation.latitude,
          longitude: buses[0].currentLocation.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (error) {
      console.error('Failed to load active buses:', error);
      // Create sample data on error
      const sampleBuses = [
        {
          _id: 'bus-1',
          busId: {
            _id: 'bus-1',
            BusNumber: '1',
            capacity: 30
          },
          driverId: {
            _id: 'driver-1',
            firstName: 'Ahmed',
            lastName: 'Ali'
          },
          routeId: {
            _id: 'route-1',
            name: 'Route 1',
            start_point: { name: 'Start', lat: 30.0444, long: 31.2357 },
            end_point: { name: 'End', lat: 30.0544, long: 31.2457 },
            stops: []
          },
          currentLocation: {
            latitude: 30.0444,
            longitude: 31.2357
          },
          speed: 35,
          heading: 45,
          status: 'active',
          lastUpdate: new Date().toISOString(),
        },
        {
          _id: 'bus-2',
          busId: {
            _id: 'bus-2',
            BusNumber: '2',
            capacity: 25
          },
          driverId: {
            _id: 'driver-2',
            firstName: 'Mohamed',
            lastName: 'Hassan'
          },
          routeId: {
            _id: 'route-2',
            name: 'Route 2',
            start_point: { name: 'Start', lat: 30.0544, long: 31.2457 },
            end_point: { name: 'End', lat: 30.0644, long: 31.2557 },
            stops: []
          },
          currentLocation: {
            latitude: 30.0544,
            longitude: 31.2457
          },
          speed: 28,
          heading: 90,
          status: 'active',
          lastUpdate: new Date().toISOString(),
        }
      ];
      setActiveBuses(sampleBuses);
      setSelectedBus(sampleBuses[0]);
      setRegion({
        latitude: sampleBuses[0].currentLocation.latitude,
        longitude: sampleBuses[0].currentLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectBus = (bus: BusLocation) => {
    setSelectedBus(bus);
    setRegion({
      latitude: bus.currentLocation.latitude,
      longitude: bus.currentLocation.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
  };

  const renderBusInfo = () => {
    if (!selectedBus) return null;

    return (
      <View style={styles.busInfoCard}>
        <View style={styles.busInfoHeader}>
                  <View style={styles.busInfoTitle}>
          <MapPin size={20} color={Colors.brandMediumBlue} />
          <Text style={styles.busNumber}>Bus {selectedBus.busId.BusNumber}</Text>
        </View>
          <View style={styles.statusBadge}>
            <Text style={styles.statusText}>Active</Text>
          </View>
        </View>
        
        <View style={styles.busInfoDetails}>
          <View style={styles.infoRow}>
            <Navigation size={16} color={Colors.gray600} />
            <Text style={styles.infoText}>Speed: {selectedBus.speed} km/h</Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={16} color={Colors.gray600} />
            <Text style={styles.infoText}>
              Last update: {new Date(selectedBus.lastUpdate).toLocaleTimeString()}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderBusList = () => (
    <View style={styles.busListContainer}>
      <Text style={styles.busListTitle}>Active Buses</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {activeBuses.map((bus) => (
          <CustomButton
            key={bus._id}
            title={`Bus ${bus.busId.BusNumber}`}
            onPress={() => selectBus(bus)}
            variant={selectedBus?._id === bus._id ? 'primary' : 'outline'}
            size="small"
            style={styles.busButton}
          />
        ))}
      </ScrollView>
    </View>
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  // Determine map center: use first bus if available, else default to Cairo
  const latitude = activeBuses[0]?.currentLocation.latitude || 30.0444;
  const longitude = activeBuses[0]?.currentLocation.longitude || 31.2357;
  const mapUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;

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