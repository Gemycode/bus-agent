import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator } from 'react-native';
import { apiService } from '../../services/api';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { Colors } from '../../constants/Colors';

export default function AdminTripsScreen() {
  const [trips, setTrips] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ date: new Date(), routeId: '', busId: '', driverId: '' });
  const [routes, setRoutes] = useState<any[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingTrip, setEditingTrip] = useState<any>(null);

  useEffect(() => {
    loadMeta();
  }, []);
  useEffect(() => {
    loadTrips();
  }, [selectedDate]);

  const loadMeta = async () => {
    const [routes, buses, drivers] = await Promise.all([
      apiService.getAllRoutes(),
      apiService.getAllBuses(),
      apiService.getAllDrivers(),
    ]);
    console.log('drivers:', drivers);
    setRoutes(routes as any[]);
    setBuses(buses as any[]);
    setDrivers(drivers as any[]);
  };

  const loadTrips = async () => {
    setLoading(true);
    try {
      const trips = await apiService.getTrips(selectedDate.toISOString().split('T')[0]);
      setTrips(trips as any[]);
    } catch {
      setTrips([]);
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setForm({ date: selectedDate, routeId: '', busId: '', driverId: '' });
    setEditingTrip(null);
    setShowModal(true);
  };
  const openEdit = (trip: any) => {
    setForm({
      date: new Date(trip.date),
      routeId: trip.routeId?._id || trip.routeId,
      busId: trip.busId?._id || trip.busId,
      driverId: trip.driverId?._id || trip.driverId,
    });
    setEditingTrip(trip);
    setShowModal(true);
  };
  const handleSave = async () => {
    if (!form.date || !form.routeId || !form.busId || !form.driverId) {
      Alert.alert('خطأ', 'يرجى ملء جميع الحقول');
      return;
    }
    setSaving(true);
    try {
      if (editingTrip) {
        await apiService.updateTrip(editingTrip._id, {
          date: form.date,
          routeId: form.routeId,
          busId: form.busId,
          driverId: form.driverId,
        });
        Alert.alert('تم التحديث', 'تم تحديث الرحلة بنجاح');
      } else {
        await apiService.createTrip({
          date: form.date,
          routeId: form.routeId,
          busId: form.busId,
          driverId: form.driverId,
        });
        Alert.alert('تم الإنشاء', 'تم إنشاء الرحلة بنجاح');
      }
      setShowModal(false);
      loadTrips();
    } catch {
      Alert.alert('خطأ', 'فشل حفظ الرحلة');
    } finally {
      setSaving(false);
    }
  };
  const handleDelete = async (tripId: string) => {
    Alert.alert('تأكيد', 'هل أنت متأكد من حذف الرحلة؟', [
      { text: 'إلغاء', style: 'cancel' },
      { text: 'حذف', style: 'destructive', onPress: async () => {
        try {
          await apiService.deleteTrip(tripId);
          loadTrips();
        } catch {
          Alert.alert('خطأ', 'فشل حذف الرحلة');
        }
      }}
    ]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.gray50 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold' }}>إدارة الرحلات</Text>
        <TouchableOpacity onPress={openCreate} style={{ backgroundColor: Colors.brandMediumBlue, padding: 10, borderRadius: 8 }}>
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>+ رحلة جديدة</Text>
        </TouchableOpacity>
      </View>
      <View style={{ paddingHorizontal: 16, marginBottom: 8 }}>
        <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 8 }}>
          <Text>تاريخ الرحلات: {selectedDate.toLocaleDateString('ar-EG')}</Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            onChange={(_, d) => { setShowDatePicker(false); if (d) setSelectedDate(d); }}
          />
        )}
      </View>
      {loading ? <ActivityIndicator style={{ marginTop: 40 }} /> : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          {trips.length === 0 ? <Text style={{ textAlign: 'center', color: '#888', marginTop: 40 }}>لا توجد رحلات لهذا اليوم</Text> : (
            trips.map(trip => (
              <View key={trip._id} style={{ backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 14, elevation: 2 }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16 }}>المسار: {trip.routeId?.name || ''}</Text>
                <Text>الباص: {trip.busId?.BusNumber || ''}</Text>
                <Text>السائق: {trip.driverId?.name || ''}</Text>
                <Text>التاريخ: {new Date(trip.date).toLocaleDateString('ar-EG')}</Text>
                <Text>الحالة: {trip.status}</Text>
                <View style={{ flexDirection: 'row', marginTop: 10 }}>
                  <TouchableOpacity onPress={() => openEdit(trip)} style={{ marginRight: 16 }}>
                    <Text style={{ color: Colors.brandMediumBlue, fontWeight: 'bold' }}>تعديل</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(trip._id)}>
                    <Text style={{ color: Colors.error, fontWeight: 'bold' }}>حذف</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
      {/* Modal for create/edit */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, width: '90%' }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 12 }}>{editingTrip ? 'تعديل الرحلة' : 'إنشاء رحلة جديدة'}</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={{ backgroundColor: '#f7f7fa', padding: 10, borderRadius: 8, marginBottom: 12 }}>
              <Text>تاريخ الرحلة: {form.date.toLocaleDateString('ar-EG')}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={form.date}
                mode="date"
                display="default"
                onChange={(_, d) => { setShowDatePicker(false); if (d) setForm(f => ({ ...f, date: d })); }}
              />
            )}
            <Text style={{ marginBottom: 4 }}>المسار</Text>
            <Picker
              selectedValue={form.routeId}
              onValueChange={v => setForm(f => ({ ...f, routeId: v }))}
              style={{ backgroundColor: '#f7f7fa', marginBottom: 12 }}
            >
              <Picker.Item label="اختر المسار" value="" />
              {routes.map((r: any) => <Picker.Item key={r._id} label={r.name} value={r._id} />)}
            </Picker>
            <Text style={{ marginBottom: 4 }}>الباص</Text>
            <Picker
              selectedValue={form.busId}
              onValueChange={v => setForm(f => ({ ...f, busId: v }))}
              style={{ backgroundColor: '#f7f7fa', marginBottom: 12 }}
            >
              <Picker.Item label="اختر الباص" value="" />
              {buses.map((b: any) => <Picker.Item key={b._id} label={b.BusNumber} value={b._id} />)}
            </Picker>
            <Text style={{ marginBottom: 4 }}>السائق</Text>
            <Picker
              selectedValue={form.driverId}
              onValueChange={v => setForm(f => ({ ...f, driverId: v }))}
              style={{ backgroundColor: '#f7f7fa', marginBottom: 12 }}
            >
              <Picker.Item label="اختر السائق" value="" />
              {drivers.map((d: any) =>
                <Picker.Item
                  key={d._id}
                  label={
                    (d.firstName && d.lastName)
                      ? `${d.firstName} ${d.lastName}`
                      : d.name || 'بدون اسم'
                  }
                  value={d._id}
                />
              )}
            </Picker>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity onPress={() => setShowModal(false)} style={{ marginRight: 16 }} disabled={saving}>
                <Text style={{ color: '#888', fontSize: 16 }}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSave} disabled={saving} style={{ backgroundColor: Colors.brandMediumBlue, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 }}>
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>{saving ? 'جارٍ الحفظ...' : 'حفظ'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
} 