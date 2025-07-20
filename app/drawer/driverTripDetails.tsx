// app/(tabs)/driverTripDetails.tsx
import React, { useContext, useState } from 'react';
import { View, Text, Button, ActivityIndicator, Alert } from 'react-native';
import { AuthContext } from '../../contexts/AuthContext';
import { useAuth } from '../../contexts/AuthContext';
import { apiService } from '../../services/api';
import StudentAttendanceList from '../../components/StudentAttendanceList';

// نوع الطالب
interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  attendanceStatus?: string; // 'present' | 'absent' | undefined
}

// نوع الرحلة
interface Trip {
  _id: string;
  students?: Student[]; // مصفوفة الطلاب (يفضل)
  studentId?: Student;  // طالب واحد (احتياطي)
  routeId?: { _id: string; name: string };
  busId?: { _id: string };
  date: string;
  status: string;
}

interface DriverTripDetailsProps {
  route: { params: { trip: Trip } };
  navigation: any;
}

const DriverTripDetails = ({ route, navigation }: DriverTripDetailsProps) => {
  if (!route || !route.params || !route.params.trip) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Text>لا توجد بيانات للرحلة</Text></View>;
  }
  const { token }: any = useContext(AuthContext) || {};
  const { user } = useAuth();
  const { trip: initialTrip } = route.params;
  const busId = initialTrip.busId && initialTrip.busId._id ? initialTrip.busId._id : undefined;
  const [status, setStatus] = useState(initialTrip.status);
  const [loading, setLoading] = useState(false);
  // الطلاب: إما students أو studentId كمصفوفة
  const [students, setStudents] = useState<Student[]>(
    initialTrip.students && initialTrip.students.length > 0
      ? initialTrip.students
      : initialTrip.studentId ? [{ ...initialTrip.studentId }] : []
  );

  const handleStartTrip = async () => {
    setLoading(true);
    try {
      if (initialTrip.busId?._id) {
        await apiService.post(`/driver/trip/${initialTrip.busId._id}/start`, { date: initialTrip.date }, { Authorization: `Bearer ${token}` });
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
      if (initialTrip.busId?._id) {
        await apiService.post(`/driver/trip/${initialTrip.busId._id}/end`, { date: initialTrip.date }, { Authorization: `Bearer ${token}` });
      }
      setStatus('ended');
      Alert.alert('تم إنهاء الرحلة');
    } catch {
      Alert.alert('خطأ', 'تعذر إنهاء الرحلة');
    } finally {
      setLoading(false);
    }
  };

  // تحديث حالة حضور الطالب محليًا بعد نجاح الطلب
  const markAttendance = async (studentId: string, attendanceStatus: string) => {
    setLoading(true);
    try {
      if (initialTrip.busId?._id) {
        await apiService.post(
          `/driver/trip/${initialTrip.busId._id}/attendance/${studentId}`,
          { date: initialTrip.date, status: attendanceStatus },
          { Authorization: `Bearer ${token}` }
        );
      }
      setStudents(prev => prev.map(s =>
        s._id === studentId ? { ...s, attendanceStatus } : s
      ));
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
      <Text>المسار: {initialTrip.routeId?.name}</Text>
      <Text>التاريخ: {new Date(initialTrip.date).toLocaleDateString()}</Text>
      <Text>الحالة الحالية: {status}</Text>

      {(user?.role === 'driver' || user?.role === 'admin') && status === 'confirmed' && (
        <Button title="بدء الرحلة" onPress={handleStartTrip} disabled={loading} />
      )}
      {(user?.role === 'driver' || user?.role === 'admin') && status === 'started' && (
        <Button title="إنهاء الرحلة" onPress={handleEndTrip} disabled={loading} />
      )}

      {/* زر تتبع الرحلة */}
      {busId && (
        // <Button
        //   title="تتبع الرحلة"
        //   onPress={() => navigation.navigate('Tracking', { busId })}
        //   disabled={loading}
        // />
        null
      )}

      <Text style={{ marginTop: 20, fontWeight: 'bold' }}>الطلاب:</Text>
      <StudentAttendanceList
        students={students}
        onMarkAttendance={user?.role === 'driver' || user?.role === 'admin' ? markAttendance : () => {}}
        loading={loading}
      />
      {loading && <ActivityIndicator style={{ marginTop: 20 }} />}
    </View>
  );
};

export default DriverTripDetails;
