// app/(tabs)/driverTrips.tsx
import React, { useEffect, useState, useContext, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet, RefreshControl } from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../contexts/AuthContext';
// Remove RouteProp and StackNavigationProp imports for now

// Define the Trip type based on backend response
interface Trip {
  _id: string;
  studentId?: { _id: string; firstName: string; lastName: string };
  routeId?: { _id: string; name: string } | string;
  busId?: { _id: string; BusNumber?: string } | string;
  driverId?: { _id: string; firstName?: string; lastName?: string } | string;
  date: string;
  status: string;
}

// Navigation type (adjust RootStackParamList if you have it)
// type DriverTripsScreenNavigationProp = StackNavigationProp<any, any>;

const DriverTripsScreen = ({ navigation }: { navigation: any }) => {
  // Use AuthContext as any to avoid type error for token
  // alert('DriverTrips screen loaded');
  // useEffect(() => {
  //   apiService.getTripsForDriver('687a98167dea0023296bd490').then(data => {
  //     console.log('API SERVICE DATA:', data);
  //     alert(JSON.stringify(data));
  //   });
  // }, []);
  const { user } = useAuth();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTrips = async () => {
    if (!refreshing) setLoading(true);
    try {
      if (user?._id) {
        const res = await apiService.getTripsForDriver(user._id);
        console.log('API RESPONSE:', res);
        setTrips(Array.isArray(res) ? res : []);
      } else {
        setTrips([]);
      }
    } catch (err) {
      alert('حدث خطأ أثناء جلب الرحلات');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchTrips();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?._id]);

  // تحديث تلقائي عند العودة للشاشة
  useFocusEffect(
    useCallback(() => {
      fetchTrips();
    }, [user?._id])
  );

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>رحلاتي</Text>
      <FlatList
        data={trips}
        keyExtractor={item => String(item._id)}
        renderItem={({ item }) => {
          // معالجة driverId ليكون إما object أو string
          let driverName = 'غير محدد';
          if (item.driverId && typeof item.driverId === 'object') {
            if ('firstName' in item.driverId && 'lastName' in item.driverId) {
              driverName = `${item.driverId.firstName} ${item.driverId.lastName}`;
            } else if ('_id' in item.driverId) {
              driverName = item.driverId._id;
            } else {
              driverName = JSON.stringify(item.driverId);
            }
          } else if (typeof item.driverId === 'string') {
            driverName = item.driverId;
          }
          let busNumber = 'غير محدد';
          if (item.busId && typeof item.busId === 'object' && 'BusNumber' in item.busId) {
            busNumber = item.busId.BusNumber ?? 'غير محدد';
          } else if (item.busId) {
            busNumber = String(item.busId);
          }
          let routeName = 'غير محدد';
          if (item.routeId && typeof item.routeId === 'object' && 'name' in item.routeId) {
            routeName = item.routeId.name;
          } else if (item.routeId) {
            routeName = String(item.routeId);
          }
          return (
            <TouchableOpacity
              style={styles.tripCard}
              onPress={() => navigation.navigate('DriverTripDetails', { trip: item })}
            >
              <Text style={{ fontWeight: 'bold', fontSize: 16 }}>رحلة #{item._id}</Text>
              <Text>المسار: {routeName}</Text>
              <Text>الباص: {busNumber}</Text>
              <Text>التاريخ: {item.date ? new Date(item.date).toLocaleDateString() : 'غير محدد'}</Text>
              <Text>الحالة: {item.status || 'غير محددة'}</Text>
              <Text>السائق: {driverName}</Text>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 30 }}>لا توجد رحلات</Text>}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchTrips(); }} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  tripCard: {
    padding: 16,
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    marginBottom: 12
  }
});

export default DriverTripsScreen;
