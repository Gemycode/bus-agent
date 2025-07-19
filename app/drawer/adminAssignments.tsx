import React, { useEffect, useState } from 'react';
import { View, Text, Button, ScrollView, Alert, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { apiService } from '../../services/api';

interface Route {
  _id: string;
  name: string;
}
interface Bus {
  _id: string;
  BusNumber: string;
}
interface Driver {
  _id: string;
  firstName: string;
  lastName:string;
  email:string
}
interface Assignment {
  _id?: string;
  date: string;
  driverId: string;
  busId: string;
  routeId: string;
}

interface AssignmentMap {
  [routeId: string]: {
    busId: string;
    driverId: string;
    assignmentId?: string;
  };
}

const AdminAssignmentsScreen: React.FC = () => {
  const [routes, setRoutes] = useState<Route[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [assignments, setAssignments] = useState<AssignmentMap>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [routesData, busesData, driversData, assignmentsRes] = await Promise.all([
        apiService.getAllRoutes(),
        apiService.getAllBuses(),
        apiService.getAllDrivers(),
        apiService.getAssignments ? apiService.getAssignments() : Promise.resolve({ assignments: [] })
      ]);
      setRoutes(Array.isArray(routesData) ? routesData : []);
      setBuses(Array.isArray(busesData) ? busesData : []);
      setDrivers(Array.isArray(driversData) ? driversData : []);
      // تحويل قائمة التعيينات إلى خريطة routeId => {busId, driverId, assignmentId}
      const assignmentMap: AssignmentMap = {};
      const assignmentsArr = (assignmentsRes as { assignments: any[] }).assignments || [];
      assignmentsArr.forEach((a: any) => {
        if (a.routeId && a.busId && a.driverId) {
          assignmentMap[a.routeId._id || a.routeId] = {
            busId: a.busId._id || a.busId,
            driverId: a.driverId._id || a.driverId,
            assignmentId: a._id
          };
        }
      });
      setAssignments(assignmentMap);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async (routeId: string) => {
    const assignment = assignments[routeId];
    if (!assignment || !assignment.busId || !assignment.driverId) {
      Alert.alert('Error', 'Please select both a bus and a driver');
      return;
    }
    try {
      await apiService.createAssignment({
        date: new Date().toISOString().slice(0, 10),
        routeId,
        busId: assignment.busId,
        driverId: assignment.driverId
      });
      Alert.alert('Success', 'Assignment saved!');
      loadData();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save assignment');
    }
  };

  if (loading) return <Text style={{ textAlign: 'center', marginTop: 40 }}>Loading...</Text>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>إدارة تعيينات اليوم</Text>
      {routes.map(route => (
        <View key={route._id} style={styles.card}>
          <Text style={styles.routeName}>المسار: {route.name}</Text>
          <Text style={styles.label}>الباص:</Text>
          <Picker
            selectedValue={assignments[route._id]?.busId || ''}
            onValueChange={busId => setAssignments(prev => ({
              ...prev,
              [route._id]: { ...prev[route._id], busId }
            }))}
            style={styles.picker}
          >
            <Picker.Item label="اختر الباص" value="" />
            {buses.map(bus => (
              <Picker.Item key={bus._id} label={bus.BusNumber} value={bus._id} />
            ))}
          </Picker>
          <Text style={styles.label}>السائق:</Text>
          <Picker
            selectedValue={assignments[route._id]?.driverId || ''}
            onValueChange={driverId => setAssignments(prev => ({
              ...prev,
              [route._id]: { ...prev[route._id], driverId }
            }))}
            style={styles.picker}
          >
            <Picker.Item label="اختر السائق" value="" />
            {drivers.filter(Boolean).map(driver => (
              <Picker.Item
                key={driver._id}
                label={
                  // يعرض الاسم الأول واسم العائلة إذا وجدا، أو الإيميل، أو نص افتراضي
                  [driver.firstName, driver.lastName].filter(Boolean).join(' ').trim() ||
                  driver.email ||
                  'بدون اسم'
                }
                value={driver._id}
              />
            ))}
          </Picker>
          <Button
            title="حفظ التعيين"
            onPress={() => handleAssign(route._id)}
            color="#007bff"
          />
        </View>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  header: { fontSize: 22, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  card: { backgroundColor: '#f9f9f9', borderRadius: 8, padding: 16, marginBottom: 16, elevation: 2 },
  routeName: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  label: { fontSize: 14, marginTop: 8 },
  picker: { backgroundColor: '#fff', marginVertical: 4 },
});

export default AdminAssignmentsScreen;
