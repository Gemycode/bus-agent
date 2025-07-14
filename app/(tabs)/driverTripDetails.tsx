// app/(tabs)/driverTripDetails.tsx
import React, { useContext, useState } from 'react';
import { View, Text, Button, FlatList, ActivityIndicator, Alert } from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';

type Trip = {
  _id: string;
  studentId?: { _id: string; firstName: string; lastName: string };
  routeId?: { _id: string; name: string };
  busId?: { _id: string };
  date: string;
  status: string;
};

type DriverTripDetailsProps = {
  route: { params: { trip: Trip } };
  navigation: any;
};

const DriverTripDetails = ({ route, navigation }: DriverTripDetailsProps) => {
  const { token }: any = useContext(AuthContext) || {};
  const { trip } = route.params;
  const [status, setStatus] = useState(trip.status);
  const [loading, setLoading] = useState(false);

  const handleStartTrip = async () => {
    setLoading(true);
    try {
      if (trip.busId?._id) {
        await apiService.post(`/driver/trip/${trip.busId._id}/start`, { date: trip.date }, { Authorization: `Bearer ${token}` });
      }
      setStatus('started');
      Alert.alert('تم بدء الرحلة');
    } catch {
      Alert.alert('خطأ', 'تعذر بدء الرحلة');
    } finally {
      setLoading(false);
    }
  };

  const handleEndTrip = async () => {
    setLoading(true);
    try {
      if (trip.busId?._id) {
        await apiService.post(`/driver/trip/${trip.busId._id}/end`, { date: trip.date }, { Authorization: `Bearer ${token}` });
      }
      setStatus('ended');
      Alert.alert('تم إنهاء الرحلة');
    } catch {
      Alert.alert('خطأ', 'تعذر إنهاء الرحلة');
    } finally {
      setLoading(false);
    }
  };

  const markAttendance = async (studentId: string, attendanceStatus: string) => {
    setLoading(true);
    try {
      if (trip.busId?._id) {
        await apiService.post(`/driver/trip/${trip.busId._id}/attendance/${studentId}`, { date: trip.date, status: attendanceStatus }, { Authorization: `Bearer ${token}` });
      }
      Alert.alert('تم تحديث الحضور');
    } catch {
      Alert.alert('خطأ', 'تعذر تحديث الحضور');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold' }}>تفاصيل الرحلة</Text>
      <Text>المسار: {trip.routeId?.name}</Text>
      <Text>التاريخ: {new Date(trip.date).toLocaleDateString()}</Text>
      <Text>الحالة الحالية: {status}</Text>

      {status === 'confirmed' && (
        <Button title="بدء الرحلة" onPress={handleStartTrip} disabled={loading} />
      )}
      {status === 'started' && (
        <Button title="إنهاء الرحلة" onPress={handleEndTrip} disabled={loading} />
      )}

      <Text style={{ marginTop: 20, fontWeight: 'bold' }}>الطلاب:</Text>
      <FlatList
        data={[trip.studentId]}
        keyExtractor={item => item?._id ?? ''}
        renderItem={({ item }) => item ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }}>
            <Text style={{ flex: 1 }}>{item.firstName} {item.lastName}</Text>
            <Button title="حاضر" onPress={() => markAttendance(item._id, 'present')} disabled={loading} />
            <Button title="غائب" onPress={() => markAttendance(item._id, 'absent')} disabled={loading} />
          </View>
        ) : null}
      />
      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
    </View>
  );
};

export default DriverTripDetails;
