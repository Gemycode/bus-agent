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

interface BusLocation {
  id: string;
  busNumber: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  lastUpdate: string;
}

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
      let buses = await apiService.getActiveBuses() as BusLocation[];
      if (!Array.isArray(buses)) {
        // fallback to static example if API fails
        buses = [{
          id: 'static-bus',
          busNumber: '1',
          latitude: 30.0444,
          longitude: 31.2357,
          speed: 0,
          heading: 0,
          lastUpdate: new Date().toISOString(),
        }];
      }
      setActiveBuses(buses);
      
      if (buses.length > 0 && !selectedBus) {
        setSelectedBus(buses[0]);
        setRegion({
          latitude: buses[0].latitude,
          longitude: buses[0].longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      }
    } catch (error) {
      console.error('Failed to load active buses:', error);
      setActiveBuses([
        {
          id: 'static-bus',
          busNumber: '1',
          latitude: 30.0444,
          longitude: 31.2357,
          speed: 0,
          heading: 0,
          lastUpdate: new Date().toISOString(),
        },
      ]);
      Alert.alert('Error', 'Failed to load bus locations, showing static data.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectBus = (bus: BusLocation) => {
    setSelectedBus(bus);
    setRegion({
      latitude: bus.latitude,
      longitude: bus.longitude,
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
            <Text style={styles.busNumber}>Bus {selectedBus.busNumber}</Text>
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
            key={bus.id}
            title={`Bus ${bus.busNumber}`}
            onPress={() => selectBus(bus)}
            variant={selectedBus?.id === bus.id ? 'primary' : 'outline'}
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
  const latitude = activeBuses[0]?.latitude || 30.0444;
  const longitude = activeBuses[0]?.longitude || 31.2357;
  const mapUrl = `https://maps.google.com/maps?q=${latitude},${longitude}&z=15&output=embed`;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Live Tracking (WebView)</Text>
        <Text style={styles.headerSubtitle}>
          {activeBuses.length} buses active
        </Text>
      </View>

      <View style={styles.mapContainer}>
        <WebView
          source={{ uri: mapUrl }}
          style={styles.webview}
          javaScriptEnabled
          domStorageEnabled
        />
      </View>

      {activeBuses.length === 0 ? (
        <View style={styles.emptyState}>
          <MapPin size={64} color={Colors.gray400} />
          <Text style={styles.emptyTitle}>No Active Buses</Text>
          <Text style={styles.emptySubtitle}>
            There are currently no buses on the road.
          </Text>
        </View>
      ) : (
        <>
          {renderBusInfo()}
          {renderBusList()}
        </>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    backgroundColor: Colors.white,
    padding: 24,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray200,
  },
  headerTitle: {
    fontSize: 28,
    fontFamily: 'Inter-Bold',
    color: Colors.brandDarkBlue,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.gray600,
  },
  map: {
    flex: 1,
  },
  webMapContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    padding: 32,
  },
  webMapTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: Colors.gray700,
    marginTop: 16,
    marginBottom: 8,
  },
  webMapSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.gray500,
    textAlign: 'center',
    marginBottom: 24,
  },
  webBusInfo: {
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  webBusText: {
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: Colors.brandDarkBlue,
    textAlign: 'center',
    marginBottom: 4,
  },
  busInfoCard: {
    position: 'absolute',
    top: 120,
    left: 16,
    right: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  busInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  busInfoTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  busNumber: {
    fontSize: 18,
    fontFamily: 'Inter-SemiBold',
    color: Colors.brandDarkBlue,
    marginLeft: 8,
  },
  statusBadge: {
    backgroundColor: Colors.success,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontFamily: 'Inter-Medium',
    color: Colors.white,
  },
  busInfoDetails: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: Colors.gray600,
    marginLeft: 8,
  },
  busListContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.gray200,
  },
  busListTitle: {
    fontSize: 16,
    fontFamily: 'Inter-SemiBold',
    color: Colors.brandDarkBlue,
    marginBottom: 12,
  },
  busButton: {
    marginRight: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Inter-SemiBold',
    color: Colors.gray700,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: Colors.gray500,
    textAlign: 'center',
  },
  mapContainer: {
    flex: 1,
    margin: 16,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.gray200,
    elevation: 2,
  },
  webview: {
    flex: 1,
    minHeight: 300,
    borderRadius: 16,
  },
});
