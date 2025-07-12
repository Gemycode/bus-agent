import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, TextInput, TouchableOpacity, Alert, Button } from 'react-native';
import { apiService } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from '../../components/LoadingSpinner';
import { Colors } from '../../constants/Colors';

export default function ChildrenScreen() {
  const { user } = useAuth();
  const [children, setChildren] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newChild, setNewChild] = useState({ firstName: '', lastName: '', email: '', password: '', grade: '', school: '' });
  const [saving, setSaving] = useState(false);
  const [attendanceStatus, setAttendanceStatus] = useState<{ [childId: string]: string }>({});
  const [busAssignment, setBusAssignment] = useState<{ [childId: string]: string }>({});

  useEffect(() => {
    loadChildren();
  }, []);

  const loadChildren = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getMyChildren();
      let childrenList: any[] = [];
      const dataAny = data as any;
      if (Array.isArray(dataAny)) {
        childrenList = dataAny;
      } else if (dataAny && Array.isArray(dataAny.children)) {
        childrenList = dataAny.children;
      }
      setChildren(childrenList);
    } catch (e) {
      setChildren([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddChild = async () => {
    if (!newChild.firstName || !newChild.lastName || !newChild.email || !newChild.password || !newChild.grade || !newChild.school) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    setSaving(true);
    try {
      await apiService.addChild(newChild);
      setShowAddModal(false);
      setNewChild({ firstName: '', lastName: '', email: '', password: '', grade: '', school: '' });
      loadChildren();
    } catch (e) {
      Alert.alert('Error', 'Failed to add child');
    } finally {
      setSaving(false);
    }
  };

  const handleAttendance = async (childId: string, status: string) => {
    setAttendanceStatus((prev) => ({ ...prev, [childId]: status }));
    try {
      console.log('Sending attendance data:', {
        personId: childId,
        personType: 'student',
        date: new Date().toISOString().split('T')[0],
        status,
      });
      
      const result = await apiService.createAttendance({
        personId: childId,
        personType: 'student', // أو 'child' حسب ما يتوقعه API
        date: new Date().toISOString().split('T')[0], // اليوم الحالي
        status,
      });
      
      console.log('Attendance result:', result);
      Alert.alert('Success', `Marked as ${status} for today`);
    } catch (e) {
      console.error('Attendance error:', e);
      Alert.alert('Error', `Failed to mark attendance: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
  };

  // يمكنك تعديل هذا الجزء ليجلب الباصات من الـ API
  const buses = [
    { id: 'bus1', number: '1' },
    { id: 'bus2', number: '2' },
  ];

  const handleAssignBus = async (childId: string, busId: string) => {
    setBusAssignment((prev) => ({ ...prev, [childId]: busId }));
    // هنا يمكنك استدعاء API لربط الابن بالباص فعليًا إذا كان لديك endpoint لذلك
    Alert.alert('Success', 'Bus assigned (demo only)');
  };

  const handleDeleteChild = async (childId: string) => {
    try {
      await apiService.deleteChild(childId);
      loadChildren();
    } catch (e) {
      Alert.alert('Error', 'Failed to delete child');
    }
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>My Children</Text>
      <TouchableOpacity style={styles.addButton} onPress={() => setShowAddModal(true)}>
        <Text style={styles.addButtonText}>+ Add Child</Text>
      </TouchableOpacity>
      {children.length === 0 ? (
        <Text style={styles.emptyText}>No children found.</Text>
      ) : (
        children.map((child) => (
          <View key={child._id || child.id} style={styles.childCard}>
            <Text style={styles.childName}>{child.firstName} {child.lastName}</Text>
            <Text style={styles.childInfo}>Grade: {child.grade} | School: {child.school}</Text>
            <Text style={styles.childInfo}>Email: {child.email}</Text>
            <View style={styles.row}>
              <Button
                title="Mark Present"
                color={attendanceStatus[child._id || child.id] === 'present' ? Colors.success : Colors.brandMediumBlue}
                onPress={() => handleAttendance(child._id || child.id, 'present')}
              />
              <Button
                title="Mark Absent"
                color={attendanceStatus[child._id || child.id] === 'absent' ? Colors.error : Colors.gray600}
                onPress={() => handleAttendance(child._id || child.id, 'absent')}
              />
            </View>
            <View style={styles.row}>
              <Text style={{ marginRight: 8 }}>Assign Bus:</Text>
              {buses.map((bus) => (
                <TouchableOpacity
                  key={bus.id}
                  style={[
                    styles.busButton,
                    busAssignment[child._id || child.id] === bus.id && { backgroundColor: Colors.brandMediumBlue },
                  ]}
                  onPress={() => handleAssignBus(child._id || child.id, bus.id)}
                >
                  <Text style={{ color: busAssignment[child._id || child.id] === bus.id ? '#fff' : Colors.brandMediumBlue }}>{bus.number}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => handleDeleteChild(child._id || child.id)} style={{ marginTop: 8, alignSelf: 'flex-end' }}>
              <Text style={{ color: Colors.error, fontWeight: 'bold' }}>Delete</Text>
            </TouchableOpacity>
          </View>
        ))
      )}
      <Modal visible={showAddModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add New Child</Text>
            <TextInput
              placeholder="First Name"
              value={newChild.firstName}
              onChangeText={(v) => setNewChild((prev) => ({ ...prev, firstName: v }))}
              style={styles.input}
            />
            <TextInput
              placeholder="Last Name"
              value={newChild.lastName}
              onChangeText={(v) => setNewChild((prev) => ({ ...prev, lastName: v }))}
              style={styles.input}
            />
            <TextInput
              placeholder="Email"
              value={newChild.email}
              onChangeText={(v) => setNewChild((prev) => ({ ...prev, email: v }))}
              style={styles.input}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              placeholder="Password"
              value={newChild.password}
              onChangeText={(v) => setNewChild((prev) => ({ ...prev, password: v }))}
              style={styles.input}
              secureTextEntry
            />
            <TextInput
              placeholder="Grade"
              value={newChild.grade}
              onChangeText={(v) => setNewChild((prev) => ({ ...prev, grade: v }))}
              style={styles.input}
            />
            <TextInput
              placeholder="School"
              value={newChild.school}
              onChangeText={(v) => setNewChild((prev) => ({ ...prev, school: v }))}
              style={styles.input}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginTop: 16 }}>
              <TouchableOpacity onPress={() => setShowAddModal(false)} style={{ marginRight: 16 }} disabled={saving}>
                <Text style={{ color: '#888' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleAddChild} disabled={saving}>
                <Text style={{ color: Colors.brandMediumBlue, fontWeight: 'bold' }}>{saving ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.white, padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 14, marginTop:28, color: Colors.brandDarkBlue },
  addButton: { backgroundColor: Colors.brandMediumBlue, padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 16 },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  emptyText: { textAlign: 'center', color: Colors.gray500, marginTop: 32 },
  childCard: { backgroundColor: Colors.gray50, borderRadius: 12, padding: 16, marginBottom: 16, elevation: 2 },
  childName: { fontSize: 18, fontWeight: 'bold', color: Colors.brandDarkBlue },
  childInfo: { color: Colors.gray600, marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  busButton: { borderWidth: 1, borderColor: Colors.brandMediumBlue, borderRadius: 8, paddingVertical: 4, paddingHorizontal: 12, marginRight: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 20, width: '90%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, marginBottom: 8, padding: 8 },
}); 