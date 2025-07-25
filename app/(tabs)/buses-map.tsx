import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity, Platform, Image } from 'react-native';
import MapView, { Marker, Polyline, AnimatedRegion, Animated as AnimatedMap } from 'react-native-maps';
import { apiService } from '../../services/api';
import io from 'socket.io-client';
import { View as RNView } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';

const DEFAULT_REGION = {
  latitude: 30.0444,
  longitude: 31.2357,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const SOCKET_URL = 'http://YOUR_SERVER_IP:5001'; // عدلها حسب سيرفرك

// دالة جلب Polyline من OSRM مع نقاط التجمع
async function fetchOSRMRouteWithStops(points: { lat: number; long: number }[]) {
  const coords = points.map(p => `${p.long},${p.lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coords}?overview=full&geometries=geojson`;
  const res = await fetch(url);
  const data = await res.json();
  if (!data.routes || !data.routes[0]) throw new Error('No route found');
  return data.routes[0].geometry.coordinates.map(([lng, lat]: [number, number]) => ({ latitude: lat, longitude: lng }));
}

// دالة لإنشاء AnimatedRegion
function createAnimatedRegion(lat: number, lng: number) {
  return new AnimatedRegion({
    latitude: lat,
    longitude: lng,
    latitudeDelta: 0.001,
    longitudeDelta: 0.001,
  });
}

export default function BusesAndRoutesMap() {
  const [buses, setBuses] = useState<any[]>([]);
  const [routesData, setRoutesData] = useState<any[]>([]); // [{routeId, points, polyline}]
  const [loading, setLoading] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const mapRef = useRef<MapView>(null);

  // تتبع حي
  const [liveTracking, setLiveTracking] = useState(false);
  const [liveBuses, setLiveBuses] = useState<any[]>([]);
  const [animatedMarkers, setAnimatedMarkers] = useState<any>({});
  const socketRef = useRef<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // جلب الباصات النشطة
        const busesData = (await apiService.getActiveBusLocations()) as any[];
        setBuses(Array.isArray(busesData) ? busesData : []);

        // جلب بيانات المسارات لكل باص
        const uniqueRoutes: Record<string, any> = {};
        for (const bus of busesData) {
          const routeId = bus.routeId?._id || bus.routeId;
          if (routeId && !uniqueRoutes[routeId]) {
            // جلب بيانات المسار من الباك اند
            const route: any = await apiService.getRouteById(routeId);
            // تجهيز النقاط: البداية + نقاط التجمع + النهاية
            const points = [
              { lat: route.start_point.lat, long: route.start_point.long },
              ...(route.stops || []),
              { lat: route.end_point.lat, long: route.end_point.long }
            ];
            // جلب Polyline من OSRM
            let polyline: { latitude: number; longitude: number }[] = [];
            try {
              polyline = await fetchOSRMRouteWithStops(points);
            } catch (err) {
              polyline = [];
            }
            uniqueRoutes[routeId] = { routeId, points, polyline };
          }
        }
        setRoutesData(Object.values(uniqueRoutes));
      } catch (e: any) {
        setBuses([]);
        setRoutesData([]);
        Alert.alert('Error', e.message || 'حدث خطأ أثناء جلب البيانات');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // زوّم تلقائيًا على كل الباصات والمسارات بعد التحميل
  useEffect(() => {
    if (!loading && (buses.length > 0 || routesData.length > 0) && mapRef.current) {
      let allCoords: { latitude: number; longitude: number }[] = [];
      allCoords = [
        ...buses.map(bus => bus.currentLocation),
        ...routesData.flatMap(route => route.polyline || [])
      ];
      if (allCoords.length > 1) {
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(allCoords, {
            edgePadding: { top: 80, right: 80, bottom: 80, left: 80 },
            animated: true,
          });
        }, 500);
      }
    }
  }, [loading, buses, routesData]);

  // إدارة الاتصال بالـ socket.io مع حركة Marker
  const handleLiveTracking = () => {
    if (!liveTracking) {
      // بدء التتبع
      socketRef.current = io(SOCKET_URL);
      socketRef.current.on('busLocation', (data: any) => {
        setLiveBuses((prevBuses) => {
          const idx = prevBuses.findIndex((b) => b.busId === data.busId);
          if (idx !== -1) {
            const updated = [...prevBuses];
            updated[idx] = { ...updated[idx], ...data };
            return updated;
          } else {
            return [...prevBuses, data];
          }
        });
        // حركة Marker
        setAnimatedMarkers((prev: any) => {
          let newMarkers = { ...prev };
          if (!newMarkers[data.busId]) {
            newMarkers[data.busId] = createAnimatedRegion(data.latitude, data.longitude);
          } else {
            const newCoord = { latitude: data.latitude, longitude: data.longitude };
            if (Platform.OS === 'android') {
              newMarkers[data.busId].timing(newCoord, { duration: 800 }).start();
            } else {
              newMarkers[data.busId].timing(newCoord).start();
            }
          }
          return newMarkers;
        });
      });
      setLiveTracking(true);
    } else {
      // إيقاف التتبع
      socketRef.current && socketRef.current.disconnect();
      setLiveTracking(false);
      setLiveBuses([]);
      setAnimatedMarkers({});
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#1976d2" style={{ flex: 1, justifyContent: 'center' }} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* زر التكبير/التصغير في الوضع الكامل */}
      {isFullScreen && (
        <TouchableOpacity 
          style={styles.zoomButtonFull} 
          onPress={() => setIsFullScreen(false)}
          activeOpacity={0.8}
        >
          <View style={styles.buttonContent}>
            <FontAwesome name="compress" size={16} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.zoomButtonText}>تصغير</Text>
          </View>
        </TouchableOpacity>
      )}
      
      {/* الخريطة */}
      <View style={isFullScreen ? styles.mapContainer : styles.mapContainerSmall}>
        <MapView
          ref={mapRef}
          style={isFullScreen ? styles.mapFullScreen : styles.mapSmall}
          initialRegion={DEFAULT_REGION}
        >
          {/* إظهار الباصات */}
          {liveTracking
            ? liveBuses.map((bus) => (
                animatedMarkers[bus.busId] ? (
                  <Marker.Animated
                    key={bus.busId}
                    coordinate={animatedMarkers[bus.busId]}
                    title={`Bus ${bus.busId}`}
                    pinColor="purple"
                    rotation={typeof bus.heading === 'number' ? bus.heading : 0}
                    anchor={{ x: 0.5, y: 0.5 }}
                    flat
                  >
                    <View style={styles.busMarker}>
                      <FontAwesome name="bus" size={24} color="#fff" />
                    </View>
                  </Marker.Animated>
                ) : (
                  <Marker
                    key={bus.busId}
                    coordinate={{ latitude: bus.latitude, longitude: bus.longitude }}
                    title={`Bus ${bus.busId}`}
                    pinColor="purple"
                    rotation={typeof bus.heading === 'number' ? bus.heading : 0}
                    anchor={{ x: 0.5, y: 0.5 }}
                    flat
                  >
                    <View style={styles.busMarker}>
                      <FontAwesome name="bus" size={24} color="#fff" />
                    </View>
                  </Marker>
                )
              ))
            : buses.map(bus => (
                <Marker
                  key={bus._id}
                  coordinate={bus.currentLocation}
                  title={`Bus ${bus.busId?.BusNumber || ''}`}
                  description={`Speed: ${bus.speed || ''} km/h`}
                  pinColor="blue"
                />
              ))}

          {/* إظهار المسارات مع نقاط التجمع */}
          {!liveTracking && routesData.map((route, idx) => (
            <React.Fragment key={route.routeId}>
              {/* رسم نقاط البداية/التجمع/النهاية */}
              {route.points.map((point: any, i: number) => (
                <Marker
                  key={i}
                  coordinate={{ latitude: point.lat, longitude: point.long }}
                  title={
                    i === 0
                      ? 'البداية'
                      : i === route.points.length - 1
                      ? 'النهاية'
                      : `نقطة تجمع ${i}`
                  }
                  pinColor={
                    i === 0
                      ? 'green'
                      : i === route.points.length - 1
                      ? 'red'
                      : 'orange'
                  }
                />
              ))}
              {/* رسم المسار */}
              {route.polyline.length > 1 && (
                <Polyline
                  coordinates={route.polyline}
                  strokeColor="#1976d2"
                  strokeWidth={4}
                />
              )}
            </React.Fragment>
          ))}
        </MapView>
        
        {/* زر التكبير في الوضع العادي */}
        {!isFullScreen && (
          <TouchableOpacity 
            style={styles.zoomButton} 
            onPress={() => setIsFullScreen(true)}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <FontAwesome name="expand" size={16} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.zoomButtonText}>تكبير</Text>
            </View>
          </TouchableOpacity>
        )}
      </View>
      
      {/* مكان للأزرار الإضافية أسفل الخريطة */}
      {!isFullScreen && (
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, liveTracking && styles.actionButtonActive]} 
            onPress={handleLiveTracking}
            activeOpacity={0.8}
          >
            <View style={styles.buttonContent}>
              <FontAwesome 
                name={liveTracking ? "pause-circle" : "play-circle"} 
                size={18} 
                color="#fff" 
                style={{ marginRight: 8 }} 
              />
              <Text style={styles.actionButtonText}>
                {liveTracking ? 'إيقاف التتبع الحي' : 'بدء التتبع الحي'}
              </Text>
            </View>
          </TouchableOpacity>
          {/* يمكنك إضافة أزرار أخرى هنا */}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainerSmall: {
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    backgroundColor: '#fff',
    marginTop: 16,
  },
  mapContainer: {
    flex: 1,
  },
  mapSmall: {
    height: 340,
    width: '100%',
  },
  mapFullScreen: {
    position: 'absolute',
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0,
    zIndex: 10,
  },
  zoomButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: '#1976d2',
    borderRadius: 28,
    zIndex: 20,
    shadowColor: '#1976d2',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  zoomButtonFull: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: '#1976d2',
    borderRadius: 30,
    zIndex: 30,
    shadowColor: '#1976d2',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  zoomButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
  buttonsContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: '#43a047',
    borderRadius: 25,
    shadowColor: '#43a047',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    minWidth: 180,
  },
  actionButtonActive: {
    backgroundColor: '#e65100',
    shadowColor: '#e65100',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  busMarker: {
    backgroundColor: '#1976d2',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
});