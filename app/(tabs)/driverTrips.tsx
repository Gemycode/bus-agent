// app/(tabs)/driverTrips.tsx
import React, { useEffect, useState, useContext } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
// Remove RouteProp and StackNavigationProp imports for now

// Define the Trip type based on backend response
interface Trip {
  _id: string;
  studentId?: { _id: string; firstName: string; lastName: string };
  routeId?: { _id: string; name: string };
  busId?: { _id: string };
  date: string;
  status: string;
}

// Navigation type (adjust RootStackParamList if you have it)
// type DriverTripsScreenNavigationProp = StackNavigationProp<any, any>;

const DriverTripsScreen = ({ navigation }: { navigation: any }) => {
  // Use AuthContext as any to avoid type error for token
  const { token }: any = useContext(AuthContext) || {};
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await apiService.getDriverTrips();
        setTrips(Array.isArray(res) ? res : []);
      } catch (err) {
        alert('حدث خطأ أثناء جلب الرحلات');
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, [token]);

  if (loading) return <ActivityIndicator size="large" style={{ marginTop: 40 }} />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>رحلاتي</Text>
      <FlatList
        data={trips}
        keyExtractor={item => item._id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.tripCard}
            onPress={() => navigation.navigate('DriverTripDetails', { trip: item })}
          >
            <Text>الطالب: {item.studentId?.firstName ?? ''} {item.studentId?.lastName ?? ''}</Text>
            <Text>المسار: {item.routeId?.name ?? ''}</Text>
            <Text>التاريخ: {item.date ? new Date(item.date).toLocaleDateString() : ''}</Text>
            <Text>الحالة: {item.status ?? ''}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 30 }}>لا توجد رحلات</Text>}
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
